import { ChipDenomination } from './types'

export interface ChipDistributionInput {
  denominations: ChipDenomination[]
  expectedPlayers: number
  chipsPerBuyin: number
}

export interface PlayerChipAllocation {
  value: number
  quantity: number
  total: number
}

export interface ChipDistributionResult {
  perPlayer: PlayerChipAllocation[]
  totalValuePerPlayer: number
  targetValue: number
  isExact: boolean
  warning?: string
  remainingChips: { value: number; quantity: number }[]
}

/**
 * Calculates optimal chip distribution per player.
 * 
 * Strategy:
 * 1. Calculate how many of each denomination can go to each player (total / numPlayers)
 * 2. Try to hit the target chip value (chipsPerBuyin) as closely as possible
 * 3. Start with highest denominations and work down (greedy approach)
 * 4. Report any shortfall or excess
 */
export function calculateChipDistribution(input: ChipDistributionInput): ChipDistributionResult {
  const { denominations, expectedPlayers, chipsPerBuyin } = input
  
  if (expectedPlayers <= 0) {
    return {
      perPlayer: [],
      totalValuePerPlayer: 0,
      targetValue: chipsPerBuyin,
      isExact: false,
      warning: 'Expected players must be greater than 0',
      remainingChips: []
    }
  }

  if (denominations.length === 0) {
    return {
      perPlayer: [],
      totalValuePerPlayer: 0,
      targetValue: chipsPerBuyin,
      isExact: false,
      warning: 'No chip denominations available',
      remainingChips: []
    }
  }

  // Sort denominations by value (ascending for better spread of small chips)
  const sortedDenoms = [...denominations]
    .filter(d => d.quantity > 0)
    .sort((a, b) => a.value - b.value)

  // Calculate chips available per player for each denomination
  const availablePerPlayer = sortedDenoms.map(d => ({
    value: d.value,
    maxQuantity: Math.floor(d.quantity / expectedPlayers),
    totalAvailable: d.quantity
  }))

  // Weighted allocation: bias towards smaller denominations for usability
  const allocation: PlayerChipAllocation[] = []
  const totalWeight = availablePerPlayer.reduce(
    (sum, _, idx) => sum + (availablePerPlayer.length - idx),
    0
  )

  let allocatedValue = 0
  availablePerPlayer.forEach((denom, idx) => {
    if (denom.maxQuantity === 0) return
    const weight = availablePerPlayer.length - idx
    const targetValue = (chipsPerBuyin * weight) / totalWeight
    const qty = Math.min(denom.maxQuantity, Math.floor(targetValue / denom.value))
    if (qty > 0) {
      allocation.push({ value: denom.value, quantity: qty, total: qty * denom.value })
      allocatedValue += qty * denom.value
    }
  })

  let remainingValue = chipsPerBuyin - allocatedValue

  // Ensure some variety in denominations (if possible)
  const minDistinct = Math.min(4, availablePerPlayer.length)
  if (allocation.length < minDistinct && remainingValue > 0) {
    for (const denom of availablePerPlayer) {
      if (allocation.find(a => a.value === denom.value)) continue
      if (denom.maxQuantity > 0 && remainingValue - denom.value >= 0) {
        allocation.push({ value: denom.value, quantity: 1, total: denom.value })
        remainingValue -= denom.value
      }
      if (allocation.length >= minDistinct || remainingValue <= 0) break
    }
  }

  // Fill remaining value using larger denominations first to reach target
  for (const denom of [...availablePerPlayer].sort((a, b) => b.value - a.value)) {
    if (remainingValue <= 0) break
    const existingAlloc = allocation.find(a => a.value === denom.value)
    const alreadyUsed = existingAlloc?.quantity || 0
    const stillAvailable = denom.maxQuantity - alreadyUsed
    if (stillAvailable <= 0) continue

    const canUse = Math.min(Math.floor(remainingValue / denom.value), stillAvailable)
    if (canUse > 0) {
      if (existingAlloc) {
        existingAlloc.quantity += canUse
        existingAlloc.total += canUse * denom.value
      } else {
        allocation.push({ value: denom.value, quantity: canUse, total: canUse * denom.value })
      }
      remainingValue -= canUse * denom.value
    }
  }

  // If still short, try to top up with any smaller chips available (more chips per player)
  if (remainingValue > 0) {
    for (const denom of availablePerPlayer) {
      if (remainingValue <= 0) break
      const existingAlloc = allocation.find(a => a.value === denom.value)
      const alreadyUsed = existingAlloc?.quantity || 0
      const stillAvailable = denom.maxQuantity - alreadyUsed
      if (stillAvailable <= 0) continue

      const canUse = Math.min(Math.floor(remainingValue / denom.value), stillAvailable)
      if (canUse > 0) {
        if (existingAlloc) {
          existingAlloc.quantity += canUse
          existingAlloc.total += canUse * denom.value
        } else {
          allocation.push({ value: denom.value, quantity: canUse, total: canUse * denom.value })
        }
        remainingValue -= canUse * denom.value
      }
    }
  }

  // Sort allocation by value (highest first) for display
  allocation.sort((a, b) => b.value - a.value)

  const totalValuePerPlayer = allocation.reduce((sum, a) => sum + a.total, 0)
  const isExact = totalValuePerPlayer === chipsPerBuyin

  // Calculate remaining chips in the set after distribution
  const remainingChips = sortedDenoms.map(d => {
    const used = allocation.find(a => a.value === d.value)?.quantity || 0
    return {
      value: d.value,
      quantity: d.quantity - (used * expectedPlayers)
    }
  }).filter(r => r.quantity > 0)

  let warning: string | undefined
  if (totalValuePerPlayer < chipsPerBuyin) {
    warning = `Not enough chips! Each player gets ${totalValuePerPlayer} instead of ${chipsPerBuyin} (short by ${chipsPerBuyin - totalValuePerPlayer})`
  } else if (totalValuePerPlayer > chipsPerBuyin) {
    warning = `Slight overage: Each player gets ${totalValuePerPlayer} instead of ${chipsPerBuyin} (extra ${totalValuePerPlayer - chipsPerBuyin})`
  }

  return {
    perPlayer: allocation,
    totalValuePerPlayer,
    targetValue: chipsPerBuyin,
    isExact,
    warning,
    remainingChips
  }
}

/**
 * Quick check if a chip set can support the expected players
 */
export function canSupportPlayers(
  denominations: ChipDenomination[],
  expectedPlayers: number,
  chipsPerBuyin: number
): { canSupport: boolean; maxPlayers: number; shortfall: number } {
  const totalChipValue = denominations.reduce((sum, d) => sum + (d.value * d.quantity), 0)
  const totalNeeded = chipsPerBuyin * expectedPlayers
  const maxPlayers = Math.floor(totalChipValue / chipsPerBuyin)

  return {
    canSupport: totalChipValue >= totalNeeded,
    maxPlayers,
    shortfall: totalNeeded > totalChipValue ? totalNeeded - totalChipValue : 0
  }
}
