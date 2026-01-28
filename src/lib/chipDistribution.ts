import { ChipDenomination } from './types'

export interface ChipDistributionInput {
  denominations: ChipDenomination[]
  expectedPlayers: number
  chipsPerBuyin: number
  smallBlind?: number
  bigBlind?: number
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
 * Professional chip distribution algorithm
 * Uses recursive backtracking to find exact matches
 * PRIORITIZES blind denominations for practical poker play
 * Calculates how many buyins are supported by available chips
 */
export function calculateChipDistribution(input: ChipDistributionInput): ChipDistributionResult {
  const { denominations, expectedPlayers, chipsPerBuyin, smallBlind, bigBlind } = input
  
  if (expectedPlayers <= 0) {
    return emptyResult(chipsPerBuyin, 'Expected players must be greater than 0', denominations)
  }

  if (denominations.length === 0) {
    return emptyResult(chipsPerBuyin, 'No chip denominations available', denominations)
  }

  // Calculate available chips per player based on what we actually have
  const available = denominations
    .filter(d => d.quantity > 0)
    .map(d => ({
      value: d.value,
      maxPerPlayer: Math.floor(d.quantity / expectedPlayers),
      isBlind: d.value === smallBlind || d.value === bigBlind
    }))
    .filter(d => d.maxPerPlayer > 0)
    .sort((a, b) => {
      // Blind denominations come first
      if (a.isBlind && !b.isBlind) return -1
      if (!a.isBlind && b.isBlind) return 1
      // Then sort by value descending
      return b.value - a.value
    })

  if (available.length === 0) {
    return emptyResult(chipsPerBuyin, 'Not enough chips available for distribution', denominations)
  }

  // Find ALL exact solutions and pick the best one
  const allExactSolutions = findAllExactSolutions(available, chipsPerBuyin)
  
  if (allExactSolutions.length > 0) {
    // Pick simplest solution (fewest total chips)
    const bestSolution = allExactSolutions.reduce((best, current) => {
      return isSimpler(current, best, available) ? current : best
    })
    return formatResult(bestSolution, chipsPerBuyin, denominations, expectedPlayers)
  }

  // Find closest possible
  const closestSolution = findClosestSolution(available, chipsPerBuyin)
  return formatResult(closestSolution, chipsPerBuyin, denominations, expectedPlayers)
}

/**
 * Find ALL exact solutions (up to a reasonable limit)
 */
function findAllExactSolutions(
  available: { value: number; maxPerPlayer: number; isBlind?: boolean }[],
  target: number
): Map<number, number>[] {
  const solutions: Map<number, number>[] = []
  const maxSolutions = 50 // Don't go crazy
  
  function backtrack(
    index: number,
    current: Map<number, number>,
    currentSum: number
  ) {
    if (solutions.length >= maxSolutions) return
    
    if (currentSum === target) {
      solutions.push(new Map(current))
      return
    }

    if (currentSum > target || index >= available.length) {
      return
    }

    const { value, maxPerPlayer } = available[index]
    
    for (let qty = maxPerPlayer; qty >= 0; qty--) {
      const newSum = currentSum + (value * qty)
      
      if (newSum > target) continue
      
      if (qty > 0) {
        current.set(value, qty)
      }
      
      backtrack(index + 1, current, newSum)
      
      current.delete(value)
    }
  }
  
  backtrack(0, new Map(), 0)
  return solutions
}

/**
 * Check if solution A is simpler than solution B
 * Prioritizes: rounder quantities, fewer total chips, blind denoms
 */
function isSimpler(
  a: Map<number, number>,
  b: Map<number, number>,
  available: { value: number; maxPerPlayer: number; isBlind?: boolean }[]
): boolean {
  // First priority: prefer round quantities (divisible by 5)
  const roundnessA = calculateRoundness(a)
  const roundnessB = calculateRoundness(b)
  
  if (roundnessA !== roundnessB) {
    return roundnessA > roundnessB
  }
  
  // Second: fewer total chips
  const totalChipsA = Array.from(a.values()).reduce((sum, qty) => sum + qty, 0)
  const totalChipsB = Array.from(b.values()).reduce((sum, qty) => sum + qty, 0)
  
  if (totalChipsA !== totalChipsB) {
    return totalChipsA < totalChipsB
  }
  
  // Third: prefer blind denominations
  const blindValues = available.filter(d => d.isBlind).map(d => d.value)
  const blindsA = Array.from(a.entries())
    .filter(([v]) => blindValues.includes(v))
    .reduce((sum, [_, q]) => sum + q, 0)
  const blindsB = Array.from(b.entries())
    .filter(([v]) => blindValues.includes(v))
    .reduce((sum, [_, q]) => sum + q, 0)
  
  if (blindsA !== blindsB) {
    return blindsA > blindsB
  }
  
  // Finally: prefer larger denominations
  const avgValueA = Array.from(a.entries()).reduce((sum, [v, q]) => sum + (v * q), 0) / totalChipsA
  const avgValueB = Array.from(b.entries()).reduce((sum, [v, q]) => sum + (v * q), 0) / totalChipsB
  
  return avgValueA > avgValueB
}

/**
 * Calculate how "round" the quantities are (prefer 5, 10, 15, 20, not 9, 11, etc)
 */
function calculateRoundness(solution: Map<number, number>): number {
  let score = 0
  
  for (const qty of solution.values()) {
    if (qty % 10 === 0) {
      score += 3 // Perfect: 10, 20, 30, etc
    } else if (qty % 5 === 0) {
      score += 2 // Good: 5, 15, 25, etc
    } else if (qty % 4 === 0) {
      score += 1 // OK: 4, 8, 12, etc
    }
    // Otherwise 0 points for odd numbers like 9, 11
  }
  
  return score
}

/**
 * Find closest possible solution
 */
function findClosestSolution(
  available: { value: number; maxPerPlayer: number; isBlind?: boolean }[],
  target: number
): Map<number, number> {
  let bestDist = Infinity
  let bestSolution = new Map<number, number>()
  
  const maxCombinations = 100000
  let combinations = 0
  
  function iterate(index: number, current: Map<number, number>, sum: number) {
    if (combinations++ > maxCombinations) return
    
    const dist = Math.abs(target - sum)
    if (dist < bestDist || (dist === bestDist && hasMoreBlindChips(current, bestSolution, available))) {
      bestDist = dist
      bestSolution = new Map(current)
    }
    
    if (index >= available.length) return
    
    const { value, maxPerPlayer } = available[index]
    
    for (let qty = maxPerPlayer; qty >= 0; qty--) {
      const newSum = sum + (value * qty)
      
      if (Math.abs(target - newSum) <= target * 0.2) {
        if (qty > 0) current.set(value, qty)
        iterate(index + 1, current, newSum)
        current.delete(value)
      }
    }
  }
  
  iterate(0, new Map(), 0)
  
  if (bestSolution.size === 0) {
    return greedyFallback(available, target)
  }
  
  return bestSolution
}

/**
 * Simple greedy fallback
 */
function greedyFallback(
  available: { value: number; maxPerPlayer: number; isBlind?: boolean }[],
  target: number
): Map<number, number> {
  const result = new Map<number, number>()
  let remaining = target
  
  for (const { value, maxPerPlayer } of available) {
    if (remaining <= 0) break
    
    const qty = Math.min(maxPerPlayer, Math.floor(remaining / value))
    if (qty > 0) {
      result.set(value, qty)
      remaining -= qty * value
    }
  }
  
  return result
}

/**
 * Prefer solutions with blind denominations
 */
function hasMoreBlindChips(
  a: Map<number, number>, 
  b: Map<number, number>,
  available: { value: number; maxPerPlayer: number; isBlind?: boolean }[]
): boolean {
  const blindValues = available.filter(d => d.isBlind).map(d => d.value)
  
  const blindsA = Array.from(a.entries())
    .filter(([v]) => blindValues.includes(v))
    .reduce((sum, [_, q]) => sum + q, 0)
  const blindsB = Array.from(b.entries())
    .filter(([v]) => blindValues.includes(v))
    .reduce((sum, [_, q]) => sum + q, 0)
  
  if (blindsA !== blindsB) return blindsA > blindsB
  
  // If same blind chips, prefer more small chips overall
  return hasMoreSmallChips(a, b)
}

/**
 * Check if solution A has more small chips than B
 */
function hasMoreSmallChips(a: Map<number, number>, b: Map<number, number>): boolean {
  const smallA = Array.from(a.entries())
    .filter(([v]) => v <= 25)
    .reduce((sum, [_, q]) => sum + q, 0)
  const smallB = Array.from(b.entries())
    .filter(([v]) => v <= 25)
    .reduce((sum, [_, q]) => sum + q, 0)
  return smallA > smallB
}

/**
 * Format result with metadata
 */
function formatResult(
  distribution: Map<number, number>,
  target: number,
  allDenoms: ChipDenomination[],
  expectedPlayers: number
): ChipDistributionResult {
  const perPlayer: PlayerChipAllocation[] = Array.from(distribution.entries())
    .map(([value, quantity]) => ({
      value,
      quantity,
      total: value * quantity
    }))
    .sort((a, b) => b.value - a.value)

  const totalValuePerPlayer = perPlayer.reduce((sum, a) => sum + a.total, 0)
  const isExact = totalValuePerPlayer === target

  const remainingChips = allDenoms.map(d => {
    const used = distribution.get(d.value) || 0
    return {
      value: d.value,
      quantity: d.quantity - (used * expectedPlayers)
    }
  })

  // Calculate how many total buyins can be supported
  const totalChipsNeeded = Array.from(distribution.values()).reduce((sum, qty) => sum + qty, 0)
  const maxBuyins = allDenoms.reduce((min, d) => {
    const needed = distribution.get(d.value) || 0
    if (needed === 0) return min
    const supported = Math.floor(d.quantity / needed)
    return Math.min(min, supported)
  }, Infinity)
  
  const supportedBuyins = maxBuyins === Infinity ? 0 : maxBuyins
  const expectedBuyins = expectedPlayers * 3 // Initial + 2 rebuys

  let warning: string | undefined
  const diff = totalValuePerPlayer - target
  
  if (diff < 0) {
    const pct = ((target - totalValuePerPlayer) / target * 100).toFixed(1)
    warning = `Short by ${-diff} (${pct}% below target) - insufficient chips in set`
  } else if (diff > 0) {
    const pct = (diff / target * 100).toFixed(1)
    warning = `Overage of ${diff} per player (${pct}% above target)`
  }
  
  if (supportedBuyins < expectedBuyins && !warning) {
    warning = `⚠️ Only ${supportedBuyins} buyins available (expected ${expectedBuyins} for rebuys)`
  } else if (supportedBuyins < expectedBuyins) {
    warning += ` | Only ${supportedBuyins} buyins available`
  }

  return {
    perPlayer,
    totalValuePerPlayer,
    targetValue: target,
    isExact,
    warning,
    remainingChips
  }
}

/**
 * Empty result helper
 */
function emptyResult(target: number, warning: string, denoms: ChipDenomination[]): ChipDistributionResult {
  return {
    perPlayer: [],
    totalValuePerPlayer: 0,
    targetValue: target,
    isExact: false,
    warning,
    remainingChips: denoms.map(d => ({ value: d.value, quantity: d.quantity }))
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
