export interface Game {
  id: string
  title: string
  buyinAmount: number
  chipsPerBuyin: number
  currency: string
  status: 'active' | 'closed'
  createdAt: string
  closedAt?: string
  chipSetId?: string
  expectedPlayers?: number
  smallBlind?: number
  bigBlind?: number
  playerCount?: number
}

export interface ChipSet {
  id: string
  name: string
  ownerId?: string
  createdAt: string
  updatedAt: string
}

export interface ChipDenomination {
  id: string
  chipSetId: string
  value: number
  quantity: number
  createdAt: string
}

export interface ChipSetWithDenominations extends ChipSet {
  denominations: ChipDenomination[]
}

export interface Player {
  id: string
  gameId: string
  displayName: string
  createdAt: string
}

export interface Buyin {
  id: string
  gameId: string
  playerId: string
  amount: number
  type: 'buyin' | 'rebuy'
  createdAt: string
}

export interface FinalStack {
  gameId: string
  playerId: string
  amount: number
}

export interface Settlement {
  id: string
  gameId: string
  computedAt: string
  method: string
}

export interface Transfer {
  id: string
  fromPlayerId: string
  toPlayerId: string
  amount: number
}

export interface PlayerWithStats {
  player: Player
  buyinCount: number
  rebuyCount: number
  hasBuyin: boolean
  investedTotal: number
  finalStack?: number
  net?: number
}

export interface SettlementResult {
  players: Array<PlayerWithStats>
  transfers: Array<Transfer & { fromName: string; toName: string }>
  totalBuyins: number
  totalFinalStacks: number
  isValid: boolean
}