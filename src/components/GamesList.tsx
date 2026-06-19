import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  Field,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  Input,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Plus, ArrowRight, PokerChip, CalendarBlank, Wallet, Cards, Trash, UsersFour, Coin } from '@phosphor-icons/react'
import { Game } from '@/lib/types'
import { listGames, deleteGame } from '@/lib/db'
import { toaster } from './ui/toaster'
import { Spade, Heart, Diamond, ClubSimple } from './ui/poker-icons'
import CreateSessionDialog from './CreateSessionDialog'

export default function GamesList() {
  const navigate = useNavigate()
  const gameAccessPin = import.meta.env.VITE_GAME_ACCESS_PIN || '0105'
  
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const [pendingGameId, setPendingGameId] = useState<string | null>(null)
  const [enteredPin, setEnteredPin] = useState('')

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

  const openDeleteDialog = (game: Game) => {
    setDeleteTarget(game)
    setIsDeleteDialogOpen(true)
  }

  const requestGameAccess = (gameId: string) => {
    setPendingGameId(gameId)
    setEnteredPin('')
    setIsPinDialogOpen(true)
  }

  const handlePinSubmit = () => {
    if (!pendingGameId) return

    if (enteredPin === gameAccessPin) {
      setIsPinDialogOpen(false)
      navigate(`/game/${pendingGameId}`)
      return
    }

    toaster.create({
      title: 'Incorrect PIN',
      description: 'Please enter the correct game PIN.',
      type: 'error',
      duration: 2500,
    })
  }

  const handleDeleteSession = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteGame(deleteTarget.id)
      await loadGames()
      setIsDeleteDialogOpen(false)
      setDeleteTarget(null)
      toaster.create({ title: 'Session deleted', type: 'success', duration: 2000 })
    } catch (error) {
      console.error('Failed to delete session', error)
      toaster.create({ title: 'Failed to delete session', type: 'error', duration: 3000 })
    } finally {
      setIsDeleting(false)
    }
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
                  onClick={() => requestGameAccess(game.id)}
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
                    bottom="4" 
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
                      
                      <Flex align="center" gap="1.5">
                        <Flex align="center" gap="1.5" color="whiteAlpha.600" fontSize="xs">
                          <CalendarBlank weight="fill" size={14} />
                          <Text>
                            {new Date(game.createdAt).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                        </Flex>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(game)
                          }}
                          px="3"
                          h="9"
                        >
                          <Trash size={18} weight="bold" />
                        </Button>
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
                      <Text fontSize="sm" color="whiteAlpha.600">
                        {new Date(game.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </Box>

                    <Flex justify="space-between" align="end">
                      <Flex direction="column" gap="3">
                        <Box>
                          <Text 
                            fontSize="xs" 
                            color="whiteAlpha.600" 
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
                        <Flex gap="4">
                          <Flex align="center" gap="1.5">
                            <UsersFour size={16} weight="fill" color="rgba(255, 255, 255, 0.5)" />
                            <Text fontSize="sm" color="whiteAlpha.600" fontWeight="medium">
                              {game.playerCount || 0} players
                            </Text>
                          </Flex>
                          <Flex align="center" gap="1.5">
                            <Coin size={16} weight="fill" color="rgba(255, 255, 255, 0.5)" />
                            <Text fontSize="sm" color="whiteAlpha.600" fontWeight="medium">
                              {game.smallBlind}/{game.bigBlind}
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>

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

      {/* Delete Session Dialog */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={(e) => setIsDeleteDialogOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(10px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="#1a1a2e"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              borderRadius={{ base: 'xl', md: '2xl' }}
              shadow="0 25px 50px rgba(0, 0, 0, 0.5)"
              maxW={{ base: 'calc(100vw - 1.5rem)', md: 'md' }}
              w="full"
              mx="4"
            >
              <Dialog.Header pt="6" pb="2" px={{ base: "4", md: "6" }}>
                <Dialog.Title color="white" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                  Delete Session?
                </Dialog.Title>
                <Dialog.Description color="whiteAlpha.500" fontSize="sm" mt="1">
                  {deleteTarget ? `Delete "${deleteTarget.title}" and all its data.` : 'Delete this session.'}
                </Dialog.Description>
              </Dialog.Header>
              <Dialog.Body px={{ base: "4", md: "6" }} pb="4">
                <Box borderRadius="xl" bg="rgba(239, 68, 68, 0.1)" borderWidth="1px" borderColor="red.500/30" p="3">
                  <Text color="red.300" fontSize="sm">
                    This action cannot be undone.
                  </Text>
                </Box>
              </Dialog.Body>
              <Dialog.Footer pb="6" px={{ base: "4", md: "6" }}>
                <Flex gap="3" w="full">
                  <Button
                    flex="1"
                    h="12"
                    variant="outline"
                    colorPalette="gray"
                    borderColor="whiteAlpha.200"
                    color="whiteAlpha.700"
                    fontSize="md"
                    fontWeight="semibold"
                    borderRadius="xl"
                    _hover={{ borderColor: 'whiteAlpha.300', color: 'white', bg: 'whiteAlpha.100' }}
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    flex="1"
                    h="12"
                    bg="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    color="white"
                    fontSize="md"
                    fontWeight="semibold"
                    borderRadius="xl"
                    onClick={handleDeleteSession}
                    loading={isDeleting}
                    _hover={{
                      bg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'
                    }}
                    transition="all 0.2s"
                  >
                    Delete Session
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Game PIN Dialog */}
      <Dialog.Root
        open={isPinDialogOpen}
        onOpenChange={(e) => {
          setIsPinDialogOpen(e.open)
          if (!e.open) {
            setEnteredPin('')
            setPendingGameId(null)
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(10px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="#1a1a2e"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              borderRadius="2xl"
              shadow="0 25px 50px rgba(0, 0, 0, 0.5)"
              maxW="md"
              mx="4"
            >
              <Dialog.Header pt="6" pb="2" px={{ base: "4", md: "6" }}>
                <Dialog.Title color="white" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                  Enter Game PIN
                </Dialog.Title>
                <Dialog.Description color="whiteAlpha.500" fontSize="sm" mt="1">
                  This session is protected. Enter PIN to continue.
                </Dialog.Description>
              </Dialog.Header>

              <Dialog.Body px={{ base: "4", md: "6" }} pb={{ base: '2', md: '4' }}>
                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                    PIN Code
                  </Field.Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Enter PIN"
                    bg="rgba(255, 255, 255, 0.03)"
                    borderColor="whiteAlpha.100"
                    borderRadius="xl"
                    color="white"
                    h={{ base: '14', md: '12' }}
                    px="4"
                    fontSize={{ base: 'lg', md: 'md' }}
                    letterSpacing="0.12em"
                    _placeholder={{ color: 'whiteAlpha.300' }}
                    _hover={{ borderColor: 'whiteAlpha.200' }}
                    _focus={{ borderColor: 'purple.500' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handlePinSubmit()
                      }
                    }}
                  />
                </Field.Root>
              </Dialog.Body>

              <Dialog.Footer pb={{ base: 'max(1rem, env(safe-area-inset-bottom))', md: '6' }} px={{ base: "4", md: "6" }}>
                <Flex direction={{ base: 'column-reverse', md: 'row' }} gap="3" w="full">
                  <Button
                    flex="1"
                    h={{ base: '12', md: '12' }}
                    variant="outline"
                    colorPalette="gray"
                    borderColor="whiteAlpha.200"
                    color="whiteAlpha.700"
                    fontSize="md"
                    fontWeight="semibold"
                    borderRadius="xl"
                    onClick={() => setIsPinDialogOpen(false)}
                    _hover={{ borderColor: 'whiteAlpha.300', color: 'white', bg: 'whiteAlpha.100' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    flex="1"
                    h={{ base: '12', md: '12' }}
                    bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                    color="white"
                    fontSize="md"
                    fontWeight="semibold"
                    borderRadius="xl"
                    onClick={handlePinSubmit}
                    _hover={{
                      bg: 'linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)',
                      transform: 'translateY(-1px)',
                    }}
                    transition="all 0.2s"
                  >
                    Unlock
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  )
}
