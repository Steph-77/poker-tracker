import { Game, Player, Buyin, FinalStack, PlayerWithStats, SettlementResult } from './types'
import { calculateSettlement, validateSettlement } from './settlement'
import { supabase } from './supabase'

// Mappers
function mapGame(data: any): Game {
  return {
    id: data.id,
    title: data.title,
    buyinAmount: data.buyin_amount,
    currency: data.currency,
    status: data.status,
    createdAt: data.created_at,
    closedAt: data.closed_at
  }
}

function mapPlayer(data: any): Player {
  return {
    id: data.id,
    gameId: data.game_id,
    displayName: data.display_name,
    createdAt: data.created_at
  }
}

function mapBuyin(data: any): Buyin {
  return {
    id: data.id,
    gameId: data.game_id,
    playerId: data.player_id,
    amount: data.amount,
    type: data.type,
    createdAt: data.created_at
  }
}

function mapFinalStack(data: any): FinalStack {
  return {
    gameId: data.game_id,
    playerId: data.player_id,
    amount: data.amount
  }
}

export async function createGame(params: {
  title?: string
  buyinAmount?: number
  currency?: string
}): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert({
      title: params.title || `Poker Night ${new Date().toLocaleDateString()}`,
      buyin_amount: params.buyinAmount || 500,
      currency: params.currency || 'THB',
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error
  return mapGame(data)
}

export async function listGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(mapGame)
}

export async function getGame(gameId: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (error) return null
  return mapGame(data)
}

export async function addPlayer(gameId: string, displayName: string): Promise<Player> {
  const game = await getGame(gameId)
  if (!game || game.status === 'closed') {
    throw new Error('Cannot add player to closed game')
  }

  const { data, error } = await supabase
    .from('players')
    .insert({
      game_id: gameId,
      display_name: displayName
    })
    .select()
    .single()

  if (error) throw error
  return mapPlayer(data)
}

export async function getPlayers(gameId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data.map(mapPlayer)
}

export async function addBuyin(
  gameId: string,
  playerId: string,
  type: 'buyin' | 'rebuy'
): Promise<Buyin> {
  const game = await getGame(gameId)
  if (!game || game.status === 'closed') {
    throw new Error('Cannot add buy-in to closed game')
  }
  
  const { data, error } = await supabase
    .from('buyins')
    .insert({
      game_id: gameId,
      player_id: playerId,
      amount: game.buyinAmount,
      type
    })
    .select()
    .single()

  if (error) throw error
  return mapBuyin(data)
}

export async function getBuyins(gameId: string): Promise<Buyin[]> {
  const { data, error } = await supabase
    .from('buyins')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data?.map(mapBuyin) || []
}

export async function setFinalStack(
  gameId: string,
  playerId: string,
  amount: number
): Promise<void> {
  const game = await getGame(gameId)
  if (!game || game.status === 'closed') {
    throw new Error('Cannot update final stack for closed game')
  }
  
  const { error } = await supabase
    .from('final_stacks')
    .upsert({
      game_id: gameId,
      player_id: playerId,
      amount
    }, { onConflict: 'game_id,player_id' })

  if (error) throw error
}

export async function getFinalStacks(gameId: string): Promise<FinalStack[]> {
  const { data, error } = await supabase
    .from('final_stacks')
    .select('*')
    .eq('game_id', gameId)

  if (error) throw error
  return data?.map(mapFinalStack) || []
}

export async function getGameWithStats(gameId: string): Promise<{
  game: Game
  players: PlayerWithStats[]
} | null> {
  const game = await getGame(gameId)
  if (!game) return null
  
  const players = await getPlayers(gameId)
  const buyins = await getBuyins(gameId)
  const finalStacks = await getFinalStacks(gameId)
  
  const playersWithStats: PlayerWithStats[] = players.map(player => {
    const playerBuyins = buyins.filter(b => b.playerId === player.id)
    const buyinCount = playerBuyins.length
    const investedTotal = playerBuyins.reduce((sum, b) => sum + b.amount, 0)
    const finalStack = finalStacks.find(fs => fs.playerId === player.id)
    const net = finalStack ? finalStack.amount - investedTotal : undefined
    
    return {
      player,
      buyinCount,
      investedTotal,
      finalStack: finalStack?.amount,
      net
    }
  })
  
  return { game, players: playersWithStats }
}

export async function calculateGameSettlement(gameId: string): Promise<SettlementResult | null> {
  const data = await getGameWithStats(gameId)
  if (!data) return null
  
  const { game, players } = data
  
  const totalBuyins = players.reduce((sum, p) => sum + p.investedTotal, 0)
  const totalFinalStacks = players.reduce((sum, p) => sum + (p.finalStack || 0), 0)
  
  const validation = validateSettlement(totalBuyins, totalFinalStacks)
  
  if (!validation.isValid) {
    return {
      players,
      transfers: [],
      totalBuyins,
      totalFinalStacks,
      isValid: false
    }
  }
  
  const balances = players
    .filter(p => p.net !== undefined)
    .map(p => ({
      playerId: p.player.id,
      playerName: p.player.displayName,
      net: p.net!
    }))
  
  const transfers = calculateSettlement(balances)
  
  const transfersWithNames = transfers.map(t => {
    const fromPlayer = players.find(p => p.player.id === t.fromPlayerId)
    const toPlayer = players.find(p => p.player.id === t.toPlayerId)
    return {
      ...t,
      fromName: fromPlayer?.player.displayName || 'Unknown',
      toName: toPlayer?.player.displayName || 'Unknown'
    }
  })
  
  return {
    players,
    transfers: transfersWithNames,
    totalBuyins,
    totalFinalStacks,
    isValid: true
  }
}

export async function closeGame(gameId: string): Promise<void> {
  const settlement = await calculateGameSettlement(gameId)
  if (!settlement || !settlement.isValid) {
    throw new Error('Cannot close game: settlement is invalid')
  }
  
  const { error } = await supabase
    .from('games')
    .update({ 
      status: 'closed',
      closed_at: new Date().toISOString()
    })
    .eq('id', gameId)

  if (error) throw error
}

export async function deletePlayer(gameId: string, playerId: string): Promise<void> {
  const game = await getGame(gameId)
  if (!game || game.status === 'closed') {
    throw new Error('Cannot delete player from closed game')
  }
  
  await supabase.from('final_stacks').delete().eq('player_id', playerId).eq('game_id', gameId)
  await supabase.from('buyins').delete().eq('player_id', playerId).eq('game_id', gameId)
  const { error } = await supabase.from('players').delete().eq('id', playerId).eq('game_id', gameId)

  if (error) throw error
}