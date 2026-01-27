import { Transfer } from './types'

export interface PlayerBalance {
  playerId: string
  playerName: string
  net: number
}

export function calculateSettlement(balances: PlayerBalance[]): Transfer[] {
  const creditors = balances
    .filter(b => b.net > 0)
    .sort((a, b) => b.net - a.net)
    .map(b => ({ ...b }))
  
  const debtors = balances
    .filter(b => b.net < 0)
    .sort((a, b) => a.net - b.net)
    .map(b => ({ ...b }))
  
  const transfers: Transfer[] = []
  
  let i = 0
  let j = 0
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    
    const transferAmount = Math.min(creditor.net, Math.abs(debtor.net))
    
    if (transferAmount > 0) {
      transfers.push({
        id: `${Date.now()}-${i}-${j}`,
        fromPlayerId: debtor.playerId,
        toPlayerId: creditor.playerId,
        amount: transferAmount
      })
    }
    
    creditor.net -= transferAmount
    debtor.net += transferAmount
    
    if (creditor.net === 0) i++
    if (debtor.net === 0) j++
  }
  
  return transfers
}

export function validateSettlement(
  totalBuyins: number,
  totalFinalStacks: number
): { isValid: boolean; message?: string } {
  if (totalFinalStacks === 0) {
    return { isValid: false, message: 'Please enter final stacks for all players' }
  }
  
  if (totalBuyins !== totalFinalStacks) {
    const diff = totalFinalStacks - totalBuyins
    return {
      isValid: false,
      message: `Final stacks don't match buy-ins. Difference: ${diff > 0 ? '+' : ''}${diff} ${diff > 0 ? 'THB' : 'THB'}`
    }
  }
  
  return { isValid: true }
}