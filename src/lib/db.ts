import { Game, Player, Buyin, FinalStack, PlayerWithStats, SettlementResult, ChipSet, ChipDenomination, ChipSetWithDenominations } from './types'
import { calculateSettlement, validateSettlement } from './settlement'
import { supabase } from './supabase'

// Mappers
function mapGame(data: any): Game {
  return {
    id: data.id,
    title: data.title,
    buyinAmount: data.buyin_amount,
    chipsPerBuyin: data.chips_per_buyin,
    currency: data.currency,
    status: data.status,
    createdAt: data.created_at,
    closedAt: data.closed_at,
    chipSetId: data.chip_set_id,
    expectedPlayers: data.expected_players,
    smallBlind: data.small_blind,
    bigBlind: data.big_blind
  }
}

function mapChipSet(data: any): ChipSet {
  return {
    id: data.id,
    name: data.name,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapChipDenomination(data: any): ChipDenomination {
  return {
    id: data.id,
    chipSetId: data.chip_set_id,
    value: data.value,
    quantity: data.quantity,
    createdAt: data.created_at
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
  chipsPerBuyin?: number
  currency?: string
  chipSetId?: string
  expectedPlayers?: number
  smallBlind?: number
  bigBlind?: number
}): Promise<Game> {
  const { data, error} = await supabase
    .from('games')
    .insert({
      title: params.title || `Poker Night ${new Date().toLocaleDateString()}`,
      buyin_amount: params.buyinAmount || 500,
      chips_per_buyin: params.chipsPerBuyin || 1000,
      currency: params.currency || 'THB',
      chip_set_id: params.chipSetId || null,
      expected_players: params.expectedPlayers || 6,
      small_blind: params.smallBlind || 5,
      big_blind: params.bigBlind || 10,
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error
  return mapGame(data)
}

export async function updateGame(params: {
  gameId: string
  title?: string
  buyinAmount?: number
  chipsPerBuyin?: number
  chipSetId?: string | null
  expectedPlayers?: number
  smallBlind?: number
  bigBlind?: number
}): Promise<Game> {
  const updates: any = {}

  if (params.title !== undefined) updates.title = params.title
  if (params.buyinAmount !== undefined) updates.buyin_amount = params.buyinAmount
  if (params.chipsPerBuyin !== undefined) updates.chips_per_buyin = params.chipsPerBuyin
  if (params.chipSetId !== undefined) updates.chip_set_id = params.chipSetId
  if (params.expectedPlayers !== undefined) updates.expected_players = params.expectedPlayers
  if (params.smallBlind !== undefined) updates.small_blind = params.smallBlind
  if (params.bigBlind !== undefined) updates.big_blind = params.bigBlind

  const { data, error } = await supabase
    .from('games')
    .update(updates)
    .eq('id', params.gameId)
    .select()
    .single()

  if (error) throw error
  return mapGame(data)
}

export async function deleteGame(gameId: string): Promise<void> {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)

  if (error) throw error
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

export async function addPlayer(
  gameId: string,
  displayName: string,
  autoBuyin: boolean = false
): Promise<Player> {
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

  const player = mapPlayer(data)

  if (autoBuyin) {
    await addBuyin(gameId, player.id, 'buyin')
  }

  return player
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

  // Check if player already has a buy-in
  const { data: existingBuyins, error: checkError } = await supabase
    .from('buyins')
    .select('*')
    .eq('game_id', gameId)
    .eq('player_id', playerId)
    .eq('type', 'buyin')
  
  if (checkError) throw checkError

  // If trying to add a buy-in but one already exists, throw error
  if (type === 'buyin' && existingBuyins && existingBuyins.length > 0) {
    throw new Error('Player already has a buy-in. Use rebuy instead.')
  }

  // If trying to rebuy but no initial buy-in exists, throw error
  if (type === 'rebuy' && (!existingBuyins || existingBuyins.length === 0)) {
    throw new Error('Player must buy-in first before rebuying.')
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
    const hasBuyin = playerBuyins.some(b => b.type === 'buyin')
    const rebuyCount = playerBuyins.filter(b => b.type === 'rebuy').length
    const buyinCount = playerBuyins.length
    const investedTotal = playerBuyins.reduce((sum, b) => sum + b.amount, 0)
    const finalStack = finalStacks.find(fs => fs.playerId === player.id)
    const net = finalStack ? finalStack.amount - investedTotal : undefined
    
    return {
      player,
      buyinCount,
      rebuyCount,
      hasBuyin,
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

// Chip Set Management
export async function createChipSet(params: {
  name: string
  ownerId?: string
  denominations: Array<{ value: number; quantity: number }>
}): Promise<ChipSetWithDenominations> {
  const { data: chipSetData, error: chipSetError } = await supabase
    .from('chip_sets')
    .insert({
      name: params.name,
      owner_id: params.ownerId
    })
    .select()
    .single()

  if (chipSetError) throw chipSetError

  const { data: denomsData, error: denomsError } = await supabase
    .from('chip_denominations')
    .insert(
      params.denominations.map(d => ({
        chip_set_id: chipSetData.id,
        value: d.value,
        quantity: d.quantity
      }))
    )
    .select()

  if (denomsError) throw denomsError

  return {
    ...mapChipSet(chipSetData),
    denominations: denomsData.map(mapChipDenomination)
  }
}

export async function listChipSets(): Promise<ChipSetWithDenominations[]> {
  const { data: chipSets, error: chipSetsError } = await supabase
    .from('chip_sets')
    .select('*')
    .order('created_at', { ascending: false })

  if (chipSetsError) throw chipSetsError

  const results = await Promise.all(
    chipSets.map(async (chipSet) => {
      const { data: denoms, error: denomsError } = await supabase
        .from('chip_denominations')
        .select('*')
        .eq('chip_set_id', chipSet.id)
        .order('value', { ascending: true })

      if (denomsError) throw denomsError

      return {
        ...mapChipSet(chipSet),
        denominations: denoms.map(mapChipDenomination)
      }
    })
  )

  return results
}

export async function getChipSet(chipSetId: string): Promise<ChipSetWithDenominations | null> {
  const { data: chipSet, error: chipSetError } = await supabase
    .from('chip_sets')
    .select('*')
    .eq('id', chipSetId)
    .single()

  if (chipSetError) return null

  const { data: denoms, error: denomsError } = await supabase
    .from('chip_denominations')
    .select('*')
    .eq('chip_set_id', chipSetId)
    .order('value', { ascending: true })

  if (denomsError) throw denomsError

  return {
    ...mapChipSet(chipSet),
    denominations: denoms.map(mapChipDenomination)
  }
}

export async function updateChipSet(params: {
  chipSetId: string
  name: string
  denominations: Array<{ value: number; quantity: number }>
}): Promise<ChipSetWithDenominations> {
  // Update chip set name
  const { data: chipSetData, error: chipSetError } = await supabase
    .from('chip_sets')
    .update({
      name: params.name,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.chipSetId)
    .select()
    .single()

  if (chipSetError) throw chipSetError

  // Delete existing denominations
  const { error: deleteError } = await supabase
    .from('chip_denominations')
    .delete()
    .eq('chip_set_id', params.chipSetId)

  if (deleteError) throw deleteError

  // Insert new denominations
  const { data: denomsData, error: denomsError } = await supabase
    .from('chip_denominations')
    .insert(
      params.denominations.map(d => ({
        chip_set_id: params.chipSetId,
        value: d.value,
        quantity: d.quantity
      }))
    )
    .select()

  if (denomsError) throw denomsError

  return {
    ...mapChipSet(chipSetData),
    denominations: denomsData.map(mapChipDenomination)
  }
}
