import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Plus, ArrowRight, PokerChip, CalendarBlank, Wallet, Cards } from '@phosphor-icons/react'
import { Game } from '@/lib/types'
import { listGames } from '@/lib/db'
import { toaster } from './ui/toaster'
import { Spade, Heart, Diamond, ClubSimple } from './ui/poker-icons'
import CreateSessionDialog from './CreateSessionDialog'

export default function GamesList() {
  const navigate = useNavigate()
  
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      const data = await listGames()
      setGames(data)
    } catch (error) {
      console.error('Failed to load games', error)
      toaster.create({
        title: 'Failed to load games',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSessionCreated = (gameId: string) => {
    navigate(`/game/${gameId}`)
  }

  return (
    <Box minH="100vh" py="0" px={{ base: "4", md: "8" }} position="relative">
      <Container maxW="container.xl" mx="auto" position="relative" zIndex="1">
        <VStack gap="10" align="stretch">
          
          {/* Header */}
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="space-between" 
            align={{ base: 'start', md: 'center' }}
            gap="6"
            w="full"
          >
            <Box>
              <Flex align="center" gap="3" mb="2">
                <Box
                  p="2"
                  borderRadius="3xl"
                  position="relative"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="40"
                  h="40"
                >
                  <Image
                    src="/logo.png"
                    alt="PokerSettle logo"
                    w="36"
                    h="36"
                    objectFit="contain"
                  />
                </Box>
                <Box>
                  <Heading 
                    as="h1" 
                    fontSize={{ base: "3xl", md: "4xl" }}
                    fontWeight="bold"
                    color="white"
                  >
                    SplitChips
                  </Heading>
                  <Flex align="center" gap="3" mt="3">
                    <Spade size={16} color="#a855f7" />
                    <Heart size={16} color="#ef4444" />
                    <Diamond size={16} color="#ef4444" />
                    <ClubSimple size={16} color="#a855f7" />
                  </Flex>
                </Box>
              </Flex>
              <Text color="whiteAlpha.600" fontSize="lg">
                Track buy-ins, calculate settlements, settle up fast.
              </Text>
            </Box>

            <Button
              size="lg"
              bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
              color="white"
              onClick={() => setIsOpen(true)}
              px="8"
              h="14"
              fontSize="md"
              fontWeight="semibold"
              borderRadius="xl"
              shadow="0 4px 20px rgba(168, 85, 247, 0.4)"
              _hover={{ 
                transform: 'translateY(-2px)', 
                shadow: '0 6px 30px rgba(168, 85, 247, 0.5)',
              }}
              transition="all 0.2s"
            >
              <Plus weight="bold" size={20} />
              New Session
            </Button>
          </Flex>

          {/* Games Grid */}
          {loading ? (
            <Flex justify="center" py="20" w="full">
              <VStack gap="4">
                <Spinner size="xl" color="purple.400" borderWidth="3px" />
                <Text color="whiteAlpha.500">Loading sessions...</Text>
              </VStack>
            </Flex>
          ) : games.length === 0 ? (
            <Box
              bg="rgba(255, 255, 255, 0.02)"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="whiteAlpha.100"
              borderRadius="2xl"
              py="20"
              px="8"
              w="full"
              maxW="600px"
              mx="auto"
              position="relative"
              overflow="hidden"
            >
              {/* Decorative card suits in corners */}
              <Box position="absolute" top="6" left="6" opacity="0.1">
                <Spade size={30} color="white" />
              </Box>
              <Box position="absolute" top="6" right="6" opacity="0.1">
                <Heart size={30} color="#ef4444" />
              </Box>
              <Box position="absolute" bottom="6" left="6" opacity="0.1">
                <Diamond size={30} color="#ef4444" />
              </Box>
              <Box position="absolute" bottom="6" right="6" opacity="0.1">
                <ClubSimple size={30} color="white" />
              </Box>
              
              <VStack gap="5">
                <Box 
                  bg="linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)"
                  p="5" 
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="whiteAlpha.100"
                >
                  <Flex align="center" gap="2">
                    <Spade size={24} color="#a855f7" />
                    <Heart size={24} color="#ef4444" />
                    <ClubSimple size={24} color="#a855f7" />
                    <Diamond size={24} color="#ef4444" />
                  </Flex>
                </Box>
                <Heading size="md" color="whiteAlpha.800">No sessions yet</Heading>
                <Text color="whiteAlpha.500" textAlign="center" maxW="sm">
                  Start your first poker session to begin tracking buy-ins and settlements.
                </Text>
                <Button
                  mt="2"
                  bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                  color="white"
                  onClick={() => setIsOpen(true)}
                  px="6"
                  h="12"
                  borderRadius="xl"
                  shadow="0 4px 20px rgba(168, 85, 247, 0.3)"
                  _hover={{ shadow: '0 6px 30px rgba(168, 85, 247, 0.4)' }}
                >
                  <Plus weight="bold" />
                  Create First Session
                </Button>
              </VStack>
            </Box>
          ) : (
            <Grid 
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} 
              gap="6"
              w="full"
            >
              {games.map((game, index) => (
                <Box
                  key={game.id}
                  bg="rgba(255, 255, 255, 0.02)"
                  borderWidth="1px"
                  borderColor="whiteAlpha.100"
                  borderRadius="xl"
                  overflow="hidden"
                  cursor="pointer"
                  onClick={() => navigate(`/game/${game.id}`)}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    transform: 'translateY(-4px)',
                    bg: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'purple.500/50',
                    shadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px rgba(168, 85, 247, 0.1)',
                  }}
                  role="group"
                  position="relative"
                >
                  {/* Card suit watermark */}
                  <Box 
                    position="absolute" 
                    top="4" 
                    right="4" 
                    opacity="0.05"
                    _groupHover={{ opacity: 0.1 }}
                    transition="opacity 0.3s"
                  >
                    {index % 4 === 0 && <Spade size={50} color="white" />}
                    {index % 4 === 1 && <Heart size={50} color="#ef4444" />}
                    {index % 4 === 2 && <Diamond size={50} color="#ef4444" />}
                    {index % 4 === 3 && <ClubSimple size={50} color="white" />}
                  </Box>
                  
                  {/* Gradient border effect on hover */}
                  <Box
                    position="absolute"
                    top="-1px"
                    left="0"
                    right="0"
                    h="2px"
                    bg="linear-gradient(90deg, #a855f7, #06b6d4)"
                    opacity="0"
                    _groupHover={{ opacity: 1 }}
                    transition="opacity 0.3s"
                  />
                  
                  <Box p="5">
                    <Flex justify="space-between" align="center" mb="4">
                      <Flex
                        align="center"
                        gap="2"
                        px="3"
                        py="1.5"
                        borderRadius="full"
                        bg={game.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                        borderWidth="1px"
                        borderColor={game.status === 'active' ? 'green.500/30' : 'whiteAlpha.100'}
                      >
                        {game.status === 'active' && (
                          <Box 
                            w="2" 
                            h="2" 
                            bg="green.400" 
                            borderRadius="full"
                            shadow="0 0 8px rgba(34, 197, 94, 0.8)"
                          />
                        )}
                        <Text 
                          fontSize="xs" 
                          fontWeight="semibold"
                          color={game.status === 'active' ? 'green.400' : 'whiteAlpha.500'}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          {game.status}
                        </Text>
                      </Flex>
                      
                      <Flex align="center" gap="1.5" color="whiteAlpha.400" fontSize="xs">
                        <CalendarBlank weight="fill" size={14} />
                        <Text>
                          {new Date(game.createdAt).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                      </Flex>
                    </Flex>

                    <Box mb="5">
                      <Heading 
                        size="lg" 
                        color="white"
                        lineClamp={1}
                        mb="1"
                        _groupHover={{ color: 'purple.300' }}
                        transition="color 0.2s"
                      >
                        {game.title}
                      </Heading>
                      <Text fontSize="sm" color="whiteAlpha.400">
                        {new Date(game.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </Box>

                    <Flex justify="space-between" align="end">
                      <Box>
                        <Text 
                          fontSize="xs" 
                          color="whiteAlpha.400" 
                          textTransform="uppercase" 
                          fontWeight="semibold"
                          letterSpacing="wider"
                          mb="1"
                        >
                          Buy-in
                        </Text>
                        <Flex align="center" gap="2">
                          <Box 
                            p="1.5" 
                            borderRadius="lg" 
                            bg="rgba(6, 182, 212, 0.15)"
                            borderWidth="1px"
                            borderColor="cyan.500/30"
                          >
                            <Wallet size={18} weight="fill" color="#22d3ee" />
                          </Box>
                          <Text fontSize="xl" fontFamily="mono" fontWeight="bold" color="white">
                            {game.buyinAmount.toLocaleString()}
                          </Text>
                          <Text fontSize="sm" color="whiteAlpha.500" fontWeight="medium">
                            {game.currency}
                          </Text>
                        </Flex>
                      </Box>

                      <Box
                        p="2.5"
                        borderRadius="full"
                        bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                        opacity="0"
                        transform="translateX(10px)"
                        _groupHover={{ 
                          opacity: 1, 
                          transform: 'translateX(0)' 
                        }}
                        transition="all 0.3s"
                        shadow="0 4px 15px rgba(168, 85, 247, 0.4)"
                      >
                        <ArrowRight size={18} weight="bold" color="white" />
                      </Box>
                    </Flex>
                  </Box>
                </Box>
              ))}
            </Grid>
          )}
        </VStack>
      </Container>

      <CreateSessionDialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onSuccess={handleSessionCreated}
      />
    </Box>
  )
}
