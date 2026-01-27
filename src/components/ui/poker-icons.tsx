import { Box, Flex } from '@chakra-ui/react'

// Card Suit Icons
export const Spade = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C12 2 4 9 4 14C4 17 6.5 19 9 19C10.5 19 11.5 18 12 17C12.5 18 13.5 19 15 19C17.5 19 20 17 20 14C20 9 12 2 12 2ZM9 21C9 21 9.5 22 12 22C14.5 22 15 21 15 21L14 20H10L9 21Z" />
  </svg>
)

export const Heart = ({ size = 24, color = '#ef4444' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" />
  </svg>
)

export const Diamond = ({ size = 24, color = '#ef4444' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L2 12L12 22L22 12L12 2Z" />
  </svg>
)

export const Club = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C9.79 2 8 3.79 8 6C8 7.48 8.81 8.75 10 9.45C8.81 9.75 8 10.81 8 12C8 12.54 8.14 13.05 8.38 13.5C6.5 13.18 5 11.77 5 10C5 8.67 5.67 7.5 6.69 6.75C5.67 6 5 4.83 5 3.5C5 1.57 6.57 0 8.5 0C9.83 0 11 0.67 11.75 1.69C12.5 0.67 13.67 0 15 0C16.93 0 18.5 1.57 18.5 3.5C18.5 4.83 17.83 6 16.81 6.75C17.83 7.5 18.5 8.67 18.5 10C18.5 11.77 17 13.18 15.12 13.5C15.36 13.05 15.5 12.54 15.5 12C15.5 10.81 14.69 9.75 13.5 9.45C14.69 8.75 15.5 7.48 15.5 6C15.5 3.79 13.71 2 11.5 2H12ZM12 2C14.21 2 16 3.79 16 6C16 7.48 15.19 8.75 14 9.45C15.19 9.75 16 10.81 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 10.81 8.81 9.75 10 9.45C8.81 8.75 8 7.48 8 6C8 3.79 9.79 2 12 2ZM9 21C9 21 9.5 22 12 22C14.5 22 15 21 15 21L14 20H10L9 21Z" />
  </svg>
)

// Simplified Club icon
export const ClubSimple = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="12" cy="8" r="4" />
    <circle cx="7" cy="14" r="4" />
    <circle cx="17" cy="14" r="4" />
    <path d="M10 18L12 22L14 18H10Z" />
  </svg>
)

// Poker Chip Icon
export const PokerChipIcon = ({ size = 24, color = '#a855f7' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10" fill={`${color}20`} />
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="4" fill={color} />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
    <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
    <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
    <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
  </svg>
)

// Playing Card Icon
export const PlayingCard = ({ size = 24, suit = 'spade' }: { size?: number; suit?: 'spade' | 'heart' | 'diamond' | 'club' }) => {
  const suitColors = { spade: 'white', heart: '#ef4444', diamond: '#ef4444', club: 'white' }
  const SuitIcon = { spade: Spade, heart: Heart, diamond: Diamond, club: ClubSimple }[suit]
  
  return (
    <Box position="relative" w={`${size}px`} h={`${size * 1.4}px`}>
      <Box
        position="absolute"
        inset="0"
        bg="white"
        borderRadius="md"
        shadow="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <SuitIcon size={size * 0.5} color={suitColors[suit]} />
      </Box>
    </Box>
  )
}

// Decorative card suits background pattern
export const CardSuitsPattern = ({ opacity = 0.03 }: { opacity?: number }) => (
  <Box
    position="absolute"
    inset="0"
    overflow="hidden"
    pointerEvents="none"
    opacity={opacity}
  >
    <Flex flexWrap="wrap" gap="16" p="8" transform="rotate(-15deg)" scale="1.5">
      {Array.from({ length: 30 }).map((_, i) => {
        const suits = [Spade, Heart, Diamond, ClubSimple]
        const Suit = suits[i % 4]
        const colors = ['white', '#ef4444', '#ef4444', 'white']
        return <Suit key={i} size={40} color={colors[i % 4]} />
      })}
    </Flex>
  </Box>
)

// Floating card suits decoration
export const FloatingCardSuits = () => (
  <Box position="absolute" inset="0" overflow="hidden" pointerEvents="none">
    <Box position="absolute" top="10%" left="5%" opacity="0.1" transform="rotate(-15deg)">
      <Spade size={60} color="white" />
    </Box>
    <Box position="absolute" top="20%" right="10%" opacity="0.08" transform="rotate(20deg)">
      <Heart size={45} color="#ef4444" />
    </Box>
    <Box position="absolute" bottom="30%" left="8%" opacity="0.06" transform="rotate(-10deg)">
      <Diamond size={35} color="#ef4444" />
    </Box>
    <Box position="absolute" bottom="15%" right="5%" opacity="0.1" transform="rotate(25deg)">
      <ClubSimple size={50} color="white" />
    </Box>
    <Box position="absolute" top="50%" right="15%" opacity="0.05" transform="rotate(-20deg)">
      <Spade size={70} color="white" />
    </Box>
  </Box>
)

// Chip stack decoration
export const ChipStack = ({ count = 3, size = 40 }: { count?: number; size?: number }) => (
  <Box position="relative" h={`${size + (count - 1) * 8}px`} w={`${size}px`}>
    {Array.from({ length: count }).map((_, i) => {
      const colors = ['#a855f7', '#06b6d4', '#22c55e', '#eab308']
      return (
        <Box
          key={i}
          position="absolute"
          bottom={`${i * 8}px`}
          left="0"
          w={`${size}px`}
          h={`${size}px`}
        >
          <PokerChipIcon size={size} color={colors[i % colors.length]} />
        </Box>
      )
    })}
  </Box>
)
