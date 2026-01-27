import { Game, Player, Buyin, FinalStack, PlayerWithStats, SettlementResult } from './types'
import { calculateSettlement, validateSettlement } from './settlement'

const GAMES_KEY = 'poker-games'
const PLAYERS_KEY = 'poker-players'
const BUYINS_KEY = 'poker-buyins'
const FINAL_STACKS_KEY = 'poker-final-stacks'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export async function createGame(params: {
  title?: string
  buyinAmount?: number
  currency?: string
}): Promise<Game> {
  const games = await spark.kv.get<Game[]>(GAMES_KEY) || []
  
  const newGame: Game = {
    id: generateId(),
    title: params.title || `Poker Night ${new Date().toLocaleDateString()}`,
    buyinAmount: params.buyinAmount || 500,
    currency: params.currency || 'THB',
    status: 'active',
    createdAt: new Date().toISOString()
  }
  
  games.unshift(newGame)
  await spark.kv.set(GAMES_KEY, games)
  
  return newGame
}

export async function listGames(): Promise<Game[]> {
  return await spark.kv.get<Game[]>(GAMES_KEY) || []
}

export async function getGame(gameId: string): Promise<Game | null> {
  const games = await spark.kv.get<Game[]>(GAMES_KEY) || []
  return games.find(g => g.id === gameId) || null
}

export async function addPlayer(gameId: string, displayName: string): Promise<Player> {
  const game = await getGame(gameId)
  if (!game || game.status === 'closed') {
    throw new Error('Cannot add player to closed game')
  }
  
  const players = await spark.kv.get<Player[]>(PLAYERS_KEY) || []
  
  const newPlayer: Player = {
    id: generateId(),
    gameId,
    displayName,
    createdAt: new Date().toISOString()
  }
  
  players.push(newPlayer)
  await spark.kv.set(PLAYERS_KEY, players)
  
  return newPlayer
}

export async function getPlayers(gameId: string): Promise<Player[]> {
  const players = await spark.kv.get<Player[]>(PLAYERS_KEY) || []
  return players.filter(p => p.gameId === gameId)
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
  
  const buyins = await spark.kv.get<Buyin[]>(BUYINS_KEY) || []
  
  const newBuyin: Buyin = {
    id: generateId(),
    gameId,
    playerId,
    amount: game.buyinAmount,
    type,
    createdAt: new Date().toISOString()
  }
  
  buyins.push(newBuyin)
  await spark.kv.set(BUYINS_KEY, buyins)
  
  return newBuyin
}

export async function getBuyins(gameId: string): Promise<Buyin[]> {
  const buyins = await spark.kv.get<Buyin[]>(BUYINS_KEY) || []
  return buyins.filter(b => b.gameId === gameId)
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
  
  const finalStacks = await spark.kv.get<FinalStack[]>(FINAL_STACKS_KEY) || []
  const existingIndex = finalStacks.findIndex(
    fs => fs.gameId === gameId && fs.playerId === playerId
  )
  
  const finalStack: FinalStack = { gameId, playerId, amount }
  
  if (existingIndex >= 0) {
    finalStacks[existingIndex] = finalStack
  } else {
    finalStacks.push(finalStack)
  }
  
  await spark.kv.set(FINAL_STACKS_KEY, finalStacks)
}

export async function getFinalStacks(gameId: string): Promise<FinalStack[]> {
  const finalStacks = await spark.kv.get<FinalStack[]>(FINAL_STACKS_KEY) || []
  return finalStacks.filter(fs => fs.gameId === gameId)
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
  
  const games = await spark.kv.get<Game[]>(GAMES_KEY) || []
  const gameIndex = games.findIndex(g => g.id === gameId)
  
  if (gameIndex >= 0) {
    games[gameIndex].status = 'closed'
    games[gameIndex].closedAt = new Date().toISOString()
    await spark.kv.set(GAMES_KEY, games)
  }
}

export async function deletePlayer(gameId: string, playerId: string): Promise<void> {
  const game = await getGame(gameId)
  if (!game || game.status === 'closed') {
    throw new Error('Cannot delete player from closed game')
  }
  
  const players = await spark.kv.get<Player[]>(PLAYERS_KEY) || []
  const buyins = await spark.kv.get<Buyin[]>(BUYINS_KEY) || []
  const finalStacks = await spark.kv.get<FinalStack[]>(FINAL_STACKS_KEY) || []
  
  const updatedPlayers = players.filter(p => p.id !== playerId)
  const updatedBuyins = buyins.filter(b => b.playerId !== playerId)
  const updatedFinalStacks = finalStacks.filter(fs => fs.playerId !== playerId)
  
  await spark.kv.set(PLAYERS_KEY, updatedPlayers)
  await spark.kv.set(BUYINS_KEY, updatedBuyins)
  await spark.kv.set(FINAL_STACKS_KEY, updatedFinalStacks)
}