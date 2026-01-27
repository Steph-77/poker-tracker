import { forwardRef, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  type InputProps,
  Portal,
  Spinner,
  Stack,
  Tabs,
  Text,
  VStack,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from '@chakra-ui/react'
import DatePicker from 'react-datepicker'
import CreateSessionDialog from './CreateSessionDialog'
import { ArrowLeft, Plus, Trash, TrendUp, TrendDown, Check, Wallet, Cards, Calculator, PencilSimple, CaretDown, UsersFour, Coin } from '@phosphor-icons/react'
import { Game, PlayerWithStats, SettlementResult, ChipSetWithDenominations } from '@/lib/types'
import { getGameWithStats, addPlayer, addBuyin, setFinalStack, calculateGameSettlement, closeGame, deletePlayer, updateGame, deleteGame, deleteChipSet, listChipSets, createChipSet, updateChipSet } from '@/lib/db'
import { toaster } from './ui/toaster'
import { Spade, Heart, Diamond, ClubSimple } from './ui/poker-icons'
import ChipDistributionDialog from './ChipDistributionDialog'

const DEFAULT_DENOMS = [
  { value: 5, quantity: 0 },
  { value: 10, quantity: 0 },
  { value: 20, quantity: 0 },
  { value: 50, quantity: 0 },
  { value: 100, quantity: 0 },
  { value: 200, quantity: 0 },
]

const BLIND_OPTIONS = [
  { label: '5 / 10', small: 5, big: 10 },
  { label: '10 / 20', small: 10, big: 20 },
  { label: '25 / 50', small: 25, big: 50 },
  { label: '50 / 100', small: 50, big: 100 },
]

const DateTimeInput = forwardRef<HTMLInputElement, InputProps & { value?: string; onClick?: () => void }>(
  ({ value, onClick, placeholder, ...props }, ref) => (
    <Input
      ref={ref}
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      readOnly
      bg="rgba(255, 255, 255, 0.03)"
      borderColor="whiteAlpha.100"
      borderRadius="xl"
      color="white"
      h="12"
      px="4"
      fontSize="md"
      cursor="pointer"
      _placeholder={{ color: 'whiteAlpha.300' }}
      _hover={{ borderColor: 'whiteAlpha.200' }}
      _focus={{ 
        borderColor: 'purple.500', 
        boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)',
        bg: 'rgba(255, 255, 255, 0.05)'
      }}
      {...props}
    />
  )
)
DateTimeInput.displayName = 'DateTimeInput'

export default function GameDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [settlement, setSettlement] = useState<SettlementResult | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [finalStackInputs, setFinalStackInputs] = useState<Record<string, string>>({})
  const [isClosing, setIsClosing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePlayerDialogOpen, setIsDeletePlayerDialogOpen] = useState(false)
  const [deletePlayerTarget, setDeletePlayerTarget] = useState<{ id: string; name: string } | null>(null)
  const [isDeleteChipSetDialogOpen, setIsDeleteChipSetDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChipCalcOpen, setIsChipCalcOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editSessionDate, setEditSessionDate] = useState<Date | null>(null)
  const [editSessionTime, setEditSessionTime] = useState<Date | null>(null)
  const [editBuyinAmount, setEditBuyinAmount] = useState('')
  const [editChipsPerBuyin, setEditChipsPerBuyin] = useState('')
  const [editExpectedPlayers, setEditExpectedPlayers] = useState('')
  const [editSmallBlind, setEditSmallBlind] = useState('5')
  const [editBigBlind, setEditBigBlind] = useState('10')
  const [editChipSetId, setEditChipSetId] = useState<string>('')
  const [chipSets, setChipSets] = useState<ChipSetWithDenominations[]>([])

  // Chip set management state
  const [isCreatingNewSet, setIsCreatingNewSet] = useState(false)
  const [isEditingSet, setIsEditingSet] = useState(false)
  const [newChipSetName, setNewChipSetName] = useState('')
  const [denominations, setDenominations] = useState(DEFAULT_DENOMS)


  useEffect(() => {
    loadGameData()
  }, [id])

  useEffect(() => {
    if (players.length > 0) {
      calculateSettlementData()
    }
  }, [finalStackInputs])

  const loadGameData = async () => {
    if (!id) return
    try {
      const data = await getGameWithStats(id)
      if (data) {
        setGame(data.game)
        setPlayers(data.players)
        
        const inputs: Record<string, string> = {}
        data.players.forEach(p => {
          if (p.finalStack !== undefined) {
            inputs[p.player.id] = p.finalStack.toString()
          }
        })
        setFinalStackInputs(inputs)
      }

      try {
        const sets = await listChipSets()
        setChipSets(sets)
      } catch (error) {
        console.error('Failed to load chip sets:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateSettlementData = async () => {
    if (!id) return
    const result = await calculateGameSettlement(id)
    if (result) {
      setSettlement(result)
    }
  }

  const handleOpenEditDialog = async () => {
    if (!game) return
    setEditTitle(game.title)
    const createdAt = new Date(game.createdAt)
    setEditSessionDate(createdAt)
    setEditSessionTime(createdAt)
    setEditBuyinAmount(game.buyinAmount.toString())
    setEditChipsPerBuyin(game.chipsPerBuyin.toString())
    setEditExpectedPlayers((game.expectedPlayers || 6).toString())
    setEditSmallBlind((game.smallBlind || 5).toString())
    setEditBigBlind((game.bigBlind || 10).toString())
    setEditChipSetId(game.chipSetId || '')
    
    // Load chip sets
    try {
      const sets = await listChipSets()
      setChipSets(sets)
    } catch (error) {
      console.error('Failed to load chip sets:', error)
    }
    
    setIsEditDialogOpen(true)
  }

  const handleDenomChange = (index: number, field: 'value' | 'quantity', value: string) => {
    const newDenoms = [...denominations]
    newDenoms[index] = { ...newDenoms[index], [field]: parseInt(value) || 0 }
    setDenominations(newDenoms)
  }

  const handleCreateChipSet = async () => {
    if (!newChipSetName.trim()) {
      toaster.create({ title: 'Please enter a chip set name', type: 'error', duration: 2000 })
      return
    }

    try {
      const newSet = await createChipSet({
        name: newChipSetName,
        denominations: denominations.filter(d => d.value > 0 && d.quantity > 0)
      })
      await listChipSets().then(setChipSets)
      setEditChipSetId(newSet.id)
      setIsCreatingNewSet(false)
      setNewChipSetName('')
      setDenominations(DEFAULT_DENOMS)
      toaster.create({ title: 'Chip set created!', type: 'success', duration: 2000 })
    } catch (error) {
      console.error('Failed to create chip set:', error)
      toaster.create({ title: 'Failed to create chip set', type: 'error', duration: 3000 })
    }
  }

  const handleUpdateChipSet = async () => {
    if (!newChipSetName.trim()) {
      toaster.create({ title: 'Please enter a chip set name', type: 'error', duration: 2000 })
      return
    }

    if (!editChipSetId) return

    try {
      await updateChipSet({
        chipSetId: editChipSetId,
        name: newChipSetName,
        denominations
      })
      await listChipSets().then(setChipSets)
      setIsEditingSet(false)
      setNewChipSetName('')
      setDenominations(DEFAULT_DENOMS)
      toaster.create({ title: 'Chip set updated!', type: 'success', duration: 2000 })
    } catch (error) {
      console.error('Failed to update chip set:', error)
      toaster.create({ title: 'Failed to update chip set', type: 'error', duration: 3000 })
    }
  }

  const handleUpdateGame = async () => {
    // Prevent saving if there are unsaved chip set changes
    if (isEditingSet || isCreatingNewSet) {
      toaster.create({
        title: 'Unsaved chip set changes',
        description: 'Please save or cancel your chip set changes first.',
        type: 'warning',
        duration: 3000
      })
      return
    }

    if (!id || !game) return
    
    try {
      const createdAtDate = editSessionDate ? new Date(editSessionDate) : null
      if (createdAtDate && editSessionTime) {
        createdAtDate.setHours(editSessionTime.getHours(), editSessionTime.getMinutes(), 0, 0)
      }
      const createdAt = createdAtDate ? createdAtDate.toISOString() : undefined

      await updateGame({
        gameId: id,
        title: editTitle || undefined,
        buyinAmount: parseInt(editBuyinAmount) || undefined,
        chipsPerBuyin: parseInt(editChipsPerBuyin) || undefined,
        expectedPlayers: parseInt(editExpectedPlayers) || undefined,
        smallBlind: parseInt(editSmallBlind) || undefined,
        bigBlind: parseInt(editBigBlind) || undefined,
        chipSetId: editChipSetId || null,
        createdAt
      })
      
      await loadGameData()
      setIsEditDialogOpen(false)
      toaster.create({
        title: 'Session updated',
        type: 'success',
        duration: 2000,
      })
    } catch (error) {
      console.error('Failed to update game:', error)
      toaster.create({
        title: 'Failed to update session',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const handleAddPlayer = async () => {
    if (!id || !newPlayerName.trim()) return
    setIsAddingPlayer(true)
    try {
      const names = newPlayerName
        .split(',')
        .map(name => name.trim())
        .filter(Boolean)

      for (const name of names) {
        await addPlayer(id, name, true)
      }
      await loadGameData()
      setNewPlayerName('')
      toaster.create({
        title: names.length === 1 ? `${names[0]} added to game` : `${names.length} players added`,
        type: 'success',
        duration: 2000,
      })
    } catch (error: any) {
      toaster.create({
        title: error.message || 'Failed to add player',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setIsAddingPlayer(false)
    }
  }

  const handleAddBuyin = async (playerId: string, playerName: string, type: 'buyin' | 'rebuy') => {
    if (!id) return
    try {
      await addBuyin(id, playerId, type)
      await loadGameData()
      toaster.create({
        title: `${type === 'buyin' ? 'Buy-in' : 'Rebuy'} added for ${playerName}`,
        type: 'success',
        duration: 2000,
      })
    } catch (error: any) {
      toaster.create({
        title: error.message || `Failed to add ${type}`,
        type: 'error',
        duration: 3000,
      })
    }
  }

  const handleFinalStackChange = async (playerId: string, value: string) => {
    setFinalStackInputs(prev => ({ ...prev, [playerId]: value }))
    
    const amount = parseInt(value)
    if (!isNaN(amount) && amount >= 0 && id) {
      try {
        await setFinalStack(id, playerId, amount)
        await loadGameData()
      } catch (error: any) {
        console.error('Failed to set final stack:', error)
      }
    }
  }

  const handleCloseGame = async () => {
    if (!id) return
    setIsClosing(true)
    try {
      await closeGame(id)
      await loadGameData()
      setIsCloseDialogOpen(false)
      toaster.create({
        title: 'Game closed successfully!',
        type: 'success',
        duration: 2000,
      })
    } catch (error: any) {
      toaster.create({
        title: error.message || 'Failed to close game',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setIsClosing(false)
    }
  }

  const handleDeleteGame = async () => {
    if (!id) return
    setIsDeleting(true)
    try {
      await deleteGame(id)
      setIsDeleteDialogOpen(false)
      toaster.create({
        title: 'Session deleted',
        type: 'success',
        duration: 2000,
      })
      navigate('/')
    } catch (error: any) {
      toaster.create({
        title: error.message || 'Failed to delete session',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteChipSet = async () => {
    if (!editChipSetId) return
    try {
      await deleteChipSet(editChipSetId)
      const sets = await listChipSets()
      setChipSets(sets)
      setEditChipSetId('')
      setIsDeleteChipSetDialogOpen(false)
      toaster.create({ title: 'Chip set deleted', type: 'success', duration: 2000 })
    } catch (error: any) {
      toaster.create({
        title: error.message || 'Failed to delete chip set',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const openDeletePlayerDialog = (playerId: string, playerName: string) => {
    setDeletePlayerTarget({ id: playerId, name: playerName })
    setIsDeletePlayerDialogOpen(true)
  }

  const handleDeletePlayer = async () => {
    if (!id || !deletePlayerTarget) return
    try {
      await deletePlayer(id, deletePlayerTarget.id)
      await loadGameData()
      toaster.create({
        title: `${deletePlayerTarget.name} removed from game`,
        type: 'success',
        duration: 2000,
      })
      setIsDeletePlayerDialogOpen(false)
      setDeletePlayerTarget(null)
    } catch (error: any) {
      toaster.create({
        title: error.message || 'Failed to remove player',
        type: 'error',
        duration: 3000,
      })
    }
  }

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <VStack gap="4">
          <Spinner size="xl" color="purple.400" borderWidth="3px" />
          <Text color="whiteAlpha.500">Loading game...</Text>
        </VStack>
      </Flex>
    )
  }

  if (!game) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Text color="whiteAlpha.500">Game not found</Text>
      </Flex>
    )
  }

  const isClosed = game.status === 'closed'

  return (
    <Box 
      minH="100vh" 
      pb="20"
      position="relative"
    >
      {/* Header */}
      <Box 
        position="sticky" 
        top="0" 
        zIndex="10" 
        bg="rgba(26, 26, 46, 0.95)"
        backdropFilter="blur(20px)"
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Container maxW="container.lg" py={{ base: "4", md: "6" }} px={{ base: "4", md: "8" }} mx="auto">
          <Box>
              <Flex direction="column" gap={{ base: "2", md: "3" }}>
                <Flex align="center" justify="space-between" gap="3" flexWrap="wrap">
                  <Flex align="center" gap="3" minW="0">
                    <Button
                      onClick={() => navigate('/')}
                      variant="ghost"
                      colorPalette="purple"
                      px={{ base: "2", md: "3" }}
                      h={{ base: "9", md: "10" }}
                      minW="auto"
                    >
                      <ArrowLeft size={18} weight="bold" />
                    </Button>
                    <Heading size={{ base: "lg", md: "xl" }} color="white" lineClamp={1}>
                      {game.title}
                    </Heading>
                  </Flex>
                  <Flex align="center" gap="2">
                    <IconButton
                      size="md"
                      variant="ghost"
                      colorPalette="purple"
                      onClick={handleOpenEditDialog}
                      aria-label="Edit session"
                      h="10"
                      w="10"
                    >
                      <PencilSimple size={20} weight="bold" />
                    </IconButton>
                  </Flex>
                </Flex>

                <Flex direction="column" gap="3">
                  <Flex align="center" gap="4" flexWrap="wrap">
                    <Flex align="center" gap="2">
                      <Box p="1.5" borderRadius="lg" bg="rgba(6, 182, 212, 0.15)">
                        <Wallet size={14} weight="fill" color="#22d3ee" />
                      </Box>
                      <Text fontSize="sm" color="whiteAlpha.500">
                        <Text as="span" fontFamily="mono" fontWeight="bold" color="cyan.400">{game.buyinAmount} {game.currency}</Text>
                      </Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <Box p="1.5" borderRadius="lg" bg="rgba(168, 85, 247, 0.15)">
                        <Cards size={14} weight="fill" color="#a855f7" />
                      </Box>
                      <Text fontSize="sm" color="whiteAlpha.500">
                        <Text as="span" fontFamily="mono" fontWeight="bold" color="purple.400">{game.chipsPerBuyin.toLocaleString()}</Text> chips
                      </Text>
                    </Flex>
                  </Flex>
                  <Flex align="center" gap="4" flexWrap="wrap">
                    <Flex align="center" gap="2">
                      <Box p="1.5" borderRadius="lg" bg="rgba(34, 197, 94, 0.15)">
                        <UsersFour size={14} weight="fill" color="#22c55e" />
                      </Box>
                      <Text fontSize="sm" color="whiteAlpha.500">
                        <Text as="span" fontFamily="mono" fontWeight="bold" color="green.400">{players.length}</Text> players
                      </Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <Box p="1.5" borderRadius="lg" bg="rgba(251, 191, 36, 0.15)">
                        <Coin size={14} weight="fill" color="#fbbf24" />
                      </Box>
                      <Text fontSize="sm" color="whiteAlpha.500">
                        <Text as="span" fontFamily="mono" fontWeight="bold" color="yellow.400">{game.smallBlind}/{game.bigBlind}</Text> blinds
                      </Text>
                    </Flex>
                    <IconButton
                      size="md"
                      variant="ghost"
                      colorPalette="purple"
                      onClick={() => setIsChipCalcOpen(true)}
                      aria-label="Calculate chip distribution"
                      h="10"
                      w="10"
                    >
                      <Calculator size={18} weight="bold" />
                    </IconButton>
                  </Flex>
                </Flex>
              </Flex>
            </Box>
        </Container>
      </Box>

      <Container maxW="container.lg" py="6" px={{ base: "4", md: "8" }} mx="auto">
        <Tabs.Root defaultValue="players" variant="enclosed" w="full">
          <Tabs.List 
            w="full"
            mb="6" 
            bg="rgba(255,255,255,0.03)" 
            p="1.5" 
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
            gap="2"
            display="flex"
          >
            <Tabs.Trigger 
              value="players" 
              flex="1" 
              borderRadius="xl"
              fontWeight="semibold"
              fontSize={{ base: "sm", md: "md" }}
              py="3.5"
              px="6"
              color="whiteAlpha.600"
              transition="all 0.2s"
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
              _selected={{ bg: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', color: 'white', shadow: '0 4px 20px rgba(168, 85, 247, 0.4)' }}
            >Players</Tabs.Trigger>
            <Tabs.Trigger 
              value="stacks" 
              flex="1" 
              borderRadius="xl"
              fontWeight="semibold"
              fontSize={{ base: "sm", md: "md" }}
              py="3.5"
              px="6"
              color="whiteAlpha.600"
              transition="all 0.2s"
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
              _selected={{ bg: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', color: 'white', shadow: '0 4px 20px rgba(168, 85, 247, 0.4)' }}
            >Final Stacks</Tabs.Trigger>
            <Tabs.Trigger 
              value="settlement" 
              flex="1" 
              borderRadius="xl"
              fontWeight="semibold"
              fontSize={{ base: "sm", md: "md" }}
              py="3.5"
              px="6"
              color="whiteAlpha.600"
              transition="all 0.2s"
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
              _selected={{ bg: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', color: 'white', shadow: '0 4px 20px rgba(168, 85, 247, 0.4)' }}
            >Settlement</Tabs.Trigger>
          </Tabs.List>

          {/* Players Tab */}
          <Tabs.Content value="players" px="0" w="full">
            <VStack gap="6" align="stretch" w="full">
              {!isClosed && (
                <Box 
                  bg="rgba(255,255,255,0.03)" 
                  borderColor="whiteAlpha.100" 
                  borderWidth="1px"
                  borderRadius="2xl"
                  p={{ base: "5", md: "8" }}
                >
                  <Heading size="md" color="white" mb="5">Add Players</Heading>
                  <Flex gap="3" direction={{ base: "column", md: "row" }} align="stretch">
                    <Box flex="1">
                      <Input
                        placeholder="Enter names (comma separated)"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                        size="lg"
                        h="12"
                        minH="48px"
                        px="4"
                        bg="rgba(255,255,255,0.04)"
                        borderColor="whiteAlpha.150"
                        borderRadius="xl"
                        color="white"
                        fontSize="md"
                        _placeholder={{ color: 'whiteAlpha.400' }}
                        _hover={{ borderColor: 'whiteAlpha.300', bg: 'rgba(255,255,255,0.05)' }}
                        _focus={{ borderColor: 'purple.500', bg: 'rgba(168, 85, 247, 0.05)', boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.5)' }}
                      />
                      <Text fontSize="xs" color="whiteAlpha.500" mt="2">
                        Example: Alex, Bea, Chris
                      </Text>
                    </Box>
                    <Button 
                      h="12"
                      minH="48px"
                      px="6"
                      minW={{ base: "auto", md: "160px" }}
                      bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                      color="white"
                      borderRadius="xl"
                      fontSize="md"
                      fontWeight="semibold"
                      onClick={handleAddPlayer}
                      loading={isAddingPlayer}
                      disabled={!newPlayerName.trim()}
                      shadow="0 4px 20px rgba(168, 85, 247, 0.3)"
                      transition="all 0.2s"
                      _hover={{ shadow: '0 6px 30px rgba(168, 85, 247, 0.5)', transform: 'translateY(-1px)' }}
                      _active={{ transform: 'translateY(0)' }}
                    >
                      <Plus size={18} weight="bold" />
                      Add Players
                    </Button>
                  </Flex>
                </Box>
              )}

              {players.length === 0 ? (
                <Box 
                  bg="rgba(255,255,255,0.02)" 
                  borderStyle="dashed" 
                  borderWidth="2px" 
                  borderColor="whiteAlpha.100"
                  borderRadius="2xl"
                  py="20"
                  px="8"
                >
                  <VStack gap="3">
                    <Box 
                      w="16" 
                      h="16" 
                      borderRadius="2xl" 
                      bg="rgba(168, 85, 247, 0.1)" 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                    >
                      <Plus size={32} weight="light" color="#a855f7" />
                    </Box>
                    <Text color="whiteAlpha.600" textAlign="center" fontSize="lg">
                      No players yet
                    </Text>
                    <Text color="whiteAlpha.400" textAlign="center" fontSize="sm">
                      Add players above to start tracking buy-ins
                    </Text>
                  </VStack>
                </Box>
              ) : (
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="5" w="full">
                  {players.map((p, index) => {
                    // Assign a card suit to each player based on their index
                    const SuitIcons = [Spade, Heart, Diamond, ClubSimple]
                    const SuitIcon = SuitIcons[index % 4]
                    
                    return (
                    <Box 
                      key={p.player.id} 
                      bg="rgba(255,255,255,0.03)" 
                      borderColor="whiteAlpha.100" 
                      borderWidth="1px"
                      borderRadius="2xl"
                      overflow="hidden"
                      transition="all 0.25s ease"
                      _hover={{ borderColor: 'purple.500/40', bg: 'rgba(255,255,255,0.05)', transform: 'translateY(-2px)', shadow: '0 8px 30px rgba(0,0,0,0.3)' }}
                    >
                      <Box p={{ base: "5", md: "6" }}>
                        <Flex justify="space-between" align="flex-start" mb="5">
                          <Flex align="center" gap="4">
                            <Flex 
                              w="12" 
                              h="12" 
                              borderRadius="xl" 
                              bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                              align="center"
                              justify="center"
                              shadow="0 4px 15px rgba(168, 85, 247, 0.3)"
                            >
                              <SuitIcon size={24} color="white" />
                            </Flex>
                            <Heading size="md" color="white">{p.player.displayName}</Heading>
                          </Flex>
                          {!isClosed && (
                            <IconButton
                              aria-label="Delete player"
                              variant="ghost"
                              size="sm"
                              color="whiteAlpha.400"
                              _hover={{ color: 'red.400', bg: 'red.500/10' }}
                              borderRadius="lg"
                              onClick={() => openDeletePlayerDialog(p.player.id, p.player.displayName)}
                            >
                              <Trash size={18} />
                            </IconButton>
                          )}
                        </Flex>
                        <Grid templateColumns="repeat(2, 1fr)" gap="3" mb="4">
                          <Box p="4" bg="rgba(255,255,255,0.03)" borderRadius="xl" textAlign="center">
                            <Text color="whiteAlpha.500" fontSize="xs" mb="1">Buy-ins</Text>
                            <Text fontFamily="mono" fontSize="2xl" fontWeight="bold" color="white">{p.buyinCount}</Text>
                          </Box>
                          <Box p="4" bg="rgba(6, 182, 212, 0.1)" borderRadius="xl" borderWidth="1px" borderColor="cyan.500/20" textAlign="center">
                            <Text color="whiteAlpha.500" fontSize="xs" mb="1">Invested</Text>
                            <Text fontFamily="mono" fontSize="xl" fontWeight="bold" color="cyan.400">{p.investedTotal}</Text>
                            <Text color="whiteAlpha.400" fontSize="xs">THB</Text>
                          </Box>
                        </Grid>
                        {!isClosed && (
                          <HStack gap="3">
                            {!p.hasBuyin ? (
                              <Button
                                flex="1"
                                h="12"
                                bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                                color="white"
                                borderRadius="xl"
                                fontWeight="semibold"
                                shadow="0 4px 15px rgba(168, 85, 247, 0.3)"
                                _hover={{ shadow: '0 6px 25px rgba(168, 85, 247, 0.4)', transform: 'translateY(-1px)' }}
                                onClick={() => handleAddBuyin(p.player.id, p.player.displayName, 'buyin')}
                              >
                                <Plus size={18} weight="bold" />
                                Buy-in
                              </Button>
                            ) : (
                              <Button
                                flex="1"
                                h="12"
                                variant="outline"
                                borderColor="purple.500/50"
                                color="purple.300"
                                borderRadius="xl"
                                fontWeight="semibold"
                                _hover={{ bg: 'purple.500/15', borderColor: 'purple.400', color: 'purple.200' }}
                                onClick={() => handleAddBuyin(p.player.id, p.player.displayName, 'rebuy')}
                              >
                                <Plus size={18} weight="bold" />
                                Rebuy
                              </Button>
                            )}
                          </HStack>
                        )}
                      </Box>
                    </Box>
                  )})}
                </Grid>
              )}
            </VStack>
          </Tabs.Content>

          {/* Final Stacks Tab */}
          <Tabs.Content value="stacks" px="0" w="full">
            <VStack gap="6" align="stretch" w="full">
              {players.length === 0 ? (
                <Box bg="rgba(6, 182, 212, 0.08)" borderRadius="2xl" p="6" borderWidth="1px" borderColor="cyan.500/20">
                  <Flex align="center" gap="3">
                    <Box w="2.5" h="2.5" bg="cyan.400" borderRadius="full" shadow="0 0 10px rgba(6, 182, 212, 0.6)" />
                    <Text color="cyan.300" fontSize="md">Add players first before entering final stacks.</Text>
                  </Flex>
                </Box>
              ) : (
                <>
                  <Box 
                    bg="rgba(255,255,255,0.03)" 
                    borderColor="whiteAlpha.100" 
                    borderWidth="1px"
                    borderRadius="2xl"
                    p={{ base: "5", md: "8" }}
                  >
                    <Heading size="md" color="white" mb="6">Enter Final Chip Stacks</Heading>
                    <VStack gap="5">
                      {players.map((p) => (
                        <Field.Root key={p.player.id} w="full">
                          <Field.Label color="whiteAlpha.600" fontSize="sm" fontWeight="semibold" mb="2">{p.player.displayName}</Field.Label>
                          <Input
                            type="number"
                            placeholder="Enter final stack..."
                            value={finalStackInputs[p.player.id] || ''}
                            onChange={(e) => handleFinalStackChange(p.player.id, e.target.value)}
                            disabled={isClosed}
                            h="14"
                            px="5"
                            fontFamily="mono"
                            fontSize="xl"
                            fontWeight="bold"
                            bg="rgba(255,255,255,0.04)"
                            borderColor="whiteAlpha.150"
                            borderRadius="xl"
                            color="white"
                            _placeholder={{ color: 'whiteAlpha.300', fontWeight: 'normal', fontSize: 'md' }}
                            _hover={{ borderColor: 'whiteAlpha.300', bg: 'rgba(255,255,255,0.05)' }}
                            _focus={{ borderColor: 'cyan.500', bg: 'rgba(6, 182, 212, 0.05)', boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.5)' }}
                          />
                        </Field.Root>
                      ))}
                    </VStack>
                  </Box>

                  {settlement && (
                    <Box 
                      bg="rgba(255,255,255,0.03)" 
                      borderColor="whiteAlpha.100" 
                      borderWidth="1px"
                      borderRadius="2xl"
                      p="6"
                    >
                      <VStack gap="4" align="stretch">
                        <Flex justify="space-between" align="center" p="3" bg="rgba(255,255,255,0.02)" borderRadius="xl">
                          <Text fontWeight="medium" color="whiteAlpha.700">Total Buy-ins</Text>
                          <Text fontFamily="mono" fontSize="xl" fontWeight="bold" color="white">{settlement.totalBuyins} THB</Text>
                        </Flex>
                        <Flex justify="space-between" align="center" p="3" bg="rgba(255,255,255,0.02)" borderRadius="xl">
                          <Text fontWeight="medium" color="whiteAlpha.700">Total Final Stacks</Text>
                          <Text fontFamily="mono" fontSize="xl" fontWeight="bold" color="white">{settlement.totalFinalStacks} THB</Text>
                        </Flex>
                        <Box borderTop="1px solid" borderColor="whiteAlpha.100" pt="4">
                          <Flex 
                            justify="space-between" 
                            align="center" 
                            p="4" 
                            borderRadius="xl"
                            bg={settlement.totalBuyins === settlement.totalFinalStacks ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                            borderWidth="1px"
                            borderColor={settlement.totalBuyins === settlement.totalFinalStacks ? 'green.500/30' : 'red.500/30'}
                          >
                            <Text fontWeight="semibold" color="whiteAlpha.800">Difference</Text>
                            <Text 
                              fontFamily="mono" 
                              fontSize="xl" 
                              fontWeight="bold"
                              color={settlement.totalBuyins === settlement.totalFinalStacks ? 'green.400' : 'red.400'}
                            >
                              {settlement.totalFinalStacks - settlement.totalBuyins} THB
                            </Text>
                          </Flex>
                        </Box>
                        {!settlement.isValid && (
                          <Box bg="rgba(239, 68, 68, 0.1)" borderRadius="xl" p="4" borderWidth="1px" borderColor="red.500/30">
                            <Text color="red.300" fontSize="sm">
                              Final stacks must equal total buy-ins to calculate settlement.
                            </Text>
                          </Box>
                        )}
                        {settlement.isValid && (
                          <Box bg="rgba(34, 197, 94, 0.1)" borderRadius="xl" p="4" borderWidth="1px" borderColor="green.500/30">
                            <Text color="green.300" fontSize="sm">
                              ✓ Totals match! Go to Settlement tab to close the game.
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </Box>
                  )}
                </>
              )}
            </VStack>
          </Tabs.Content>

          {/* Settlement Tab */}
          <Tabs.Content value="settlement" px="0" w="full">
            <VStack gap="6" align="stretch" w="full">
              {!settlement || !settlement.isValid ? (
                <Box bg="rgba(6, 182, 212, 0.08)" borderRadius="2xl" p="6" borderWidth="1px" borderColor="cyan.500/20">
                  <Flex align="center" gap="3">
                    <Box w="2.5" h="2.5" bg="cyan.400" borderRadius="full" shadow="0 0 10px rgba(6, 182, 212, 0.6)" />
                    <Text color="cyan.300" fontSize="md">
                      Enter final stacks for all players and ensure totals match before viewing settlement.
                    </Text>
                  </Flex>
                </Box>
              ) : (
                <>
                  <Box 
                    bg="rgba(255,255,255,0.03)" 
                    borderColor="whiteAlpha.100" 
                    borderWidth="1px"
                    borderRadius="2xl"
                    p={{ base: "5", md: "8" }}
                  >
                    <Heading size="md" color="white" mb="6">Player Results</Heading>
                    <VStack gap="3">
                      {settlement.players
                        .sort((a, b) => (b.net || 0) - (a.net || 0))
                        .map((p) => (
                          <Flex 
                            key={p.player.id}
                            w="full"
                            justify="space-between"
                            align="center"
                            p="5"
                            borderRadius="xl"
                            bg={p.net && p.net > 0 ? 'rgba(34, 197, 94, 0.1)' : p.net && p.net < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)'}
                            borderWidth="1px"
                            borderColor={p.net && p.net > 0 ? 'green.500/30' : p.net && p.net < 0 ? 'red.500/30' : 'whiteAlpha.100'}
                            transition="all 0.2s"
                            _hover={{ transform: 'translateX(4px)' }}
                          >
                            <HStack gap="4">
                              <Flex 
                                w="10" 
                                h="10" 
                                borderRadius="lg" 
                                bg={p.net && p.net > 0 ? 'rgba(34, 197, 94, 0.2)' : p.net && p.net < 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)'}
                                align="center"
                                justify="center"
                              >
                                {p.net && p.net > 0 && <TrendUp size={22} weight="bold" color="#22c55e" />}
                                {p.net && p.net < 0 && <TrendDown size={22} weight="bold" color="#ef4444" />}
                                {(!p.net || p.net === 0) && <Text fontWeight="bold" color="whiteAlpha.500">=</Text>}
                              </Flex>
                              <Text fontWeight="semibold" fontSize="lg" color="white">{p.player.displayName}</Text>
                            </HStack>
                            <Box textAlign="right">
                              <Text 
                                fontFamily="mono" 
                                fontSize="xl" 
                                fontWeight="bold"
                                color={p.net && p.net > 0 ? 'green.400' : p.net && p.net < 0 ? 'red.400' : 'white'}
                              >
                                {p.net && p.net > 0 ? '+' : ''}{p.net || 0} THB
                              </Text>
                              <Text fontSize="xs" color="whiteAlpha.400">
                                {p.finalStack} - {p.investedTotal}
                              </Text>
                            </Box>
                          </Flex>
                        ))}
                    </VStack>
                  </Box>

                  <Box 
                    bg="rgba(255,255,255,0.03)" 
                    borderColor="whiteAlpha.100" 
                    borderWidth="1px"
                    borderRadius="2xl"
                    p={{ base: "5", md: "8" }}
                  >
                    <Heading size="md" color="white" mb="6">Required Transfers</Heading>
                    {settlement.transfers.length === 0 ? (
                      <Box py="10" textAlign="center">
                        <Box 
                          w="16" 
                          h="16" 
                          borderRadius="2xl" 
                          bg="rgba(34, 197, 94, 0.1)" 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center"
                          mx="auto"
                          mb="4"
                        >
                          <Check size={32} weight="bold" color="#22c55e" />
                        </Box>
                        <Text color="whiteAlpha.600" fontSize="lg">No transfers needed</Text>
                        <Text color="whiteAlpha.400" fontSize="sm">Everyone broke even!</Text>
                      </Box>
                    ) : (
                      <VStack gap="4">
                        {settlement.transfers.map((t) => (
                          <Flex 
                            key={t.id}
                            w="full"
                            justify="space-between"
                            align="center"
                            p="6"
                            borderRadius="xl"
                            bg="linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)"
                            borderWidth="1px"
                            borderColor="purple.500/30"
                            transition="all 0.2s"
                            _hover={{ borderColor: 'purple.400/50', transform: 'translateY(-2px)', shadow: '0 8px 25px rgba(168, 85, 247, 0.15)' }}
                          >
                            <Box>
                              <HStack gap="3" mb="1">
                                <Text fontWeight="bold" fontSize="lg" color="purple.300">{t.fromName}</Text>
                                <Text color="whiteAlpha.400">→</Text>
                                <Text fontWeight="bold" fontSize="lg" color="cyan.300">{t.toName}</Text>
                              </HStack>
                              <Text fontSize="sm" color="whiteAlpha.400">
                                Transfer payment
                              </Text>
                            </Box>
                            <Text fontFamily="mono" fontSize="2xl" fontWeight="bold" color="cyan.400">
                              {t.amount} THB
                            </Text>
                          </Flex>
                        ))}
                      </VStack>
                    )}
                  </Box>

                  {!isClosed && (
                    <Button
                      h="16"
                      bg="linear-gradient(135deg, #eab308 0%, #f59e0b 100%)"
                      color="black"
                      fontSize="lg"
                      fontWeight="bold"
                      borderRadius="2xl"
                      shadow="0 4px 20px rgba(234, 179, 8, 0.3)"
                      _hover={{ shadow: '0 6px 30px rgba(234, 179, 8, 0.4)', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                      onClick={() => setIsCloseDialogOpen(true)}
                    >
                      <Check size={24} weight="bold" />
                      Close Game
                    </Button>
                  )}

                  {isClosed && (
                    <Box bg="rgba(34, 197, 94, 0.1)" borderRadius="2xl" p="5" borderWidth="1px" borderColor="green.500/30">
                      <Flex align="center" gap="3">
                        <Check size={20} weight="bold" color="#22c55e" />
                        <Text color="green.300">
                          This game has been closed. Take a screenshot of the settlement for your records.
                        </Text>
                      </Flex>
                    </Box>
                  )}
                </>
              )}
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </Container>

      {/* Close Game Dialog */}
      <Dialog.Root open={isCloseDialogOpen} onOpenChange={(e) => setIsCloseDialogOpen(e.open)}>
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
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="1px"
                bg="linear-gradient(90deg, transparent, #eab308, #f59e0b, transparent)"
              />
              <Dialog.Header pt="8">
                <Dialog.Title>
                  <Heading size="xl" color="white">Close Game?</Heading>
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger color="whiteAlpha.500" _hover={{ color: 'white' }} top="6" right="6" />
              <Dialog.Body>
                <Text color="whiteAlpha.600" lineHeight="tall">
                  This will finalize the settlement and prevent any further changes to this game.
                  Make sure everyone has recorded the payment details.
                </Text>
              </Dialog.Body>
              <Dialog.Footer gap="3" pb="8">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCloseDialogOpen(false)}
                  borderColor="whiteAlpha.200"
                  color="whiteAlpha.700"
                  borderRadius="xl"
                  h="12"
                  _hover={{ bg: 'whiteAlpha.100' }}
                >Cancel</Button>
                <Button 
                  bg="linear-gradient(135deg, #eab308 0%, #f59e0b 100%)"
                  color="black"
                  fontWeight="semibold"
                  borderRadius="xl"
                  h="12"
                  px="8"
                  onClick={handleCloseGame}
                  loading={isClosing}
                  shadow="0 4px 15px rgba(234, 179, 8, 0.3)"
                  _hover={{ shadow: '0 6px 20px rgba(234, 179, 8, 0.4)' }}
                >
                  {isClosing ? 'Closing...' : 'Close Game'}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <ChipDistributionDialog 
        isOpen={isChipCalcOpen}
        onClose={() => setIsChipCalcOpen(false)}
        chipsPerBuyin={game.chipsPerBuyin}
        expectedPlayers={game.expectedPlayers || 6}
        actualPlayers={players.length}
        chipSet={chipSets.find(s => s.id === game.chipSetId) || null}
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
              borderRadius="2xl"
              shadow="0 25px 50px rgba(0, 0, 0, 0.5)"
              maxW="md"
              mx="4"
            >
              <Dialog.Header pt="6" pb="2" px={{ base: "4", md: "6" }}>
                <Dialog.Title color="white" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                  Delete Session?
                </Dialog.Title>
                <Dialog.Description color="whiteAlpha.500" fontSize="sm" mt="1">
                  This will permanently delete the session, players, and all buy-ins.
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
                    onClick={handleDeleteGame}
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

      {/* Delete Player Dialog */}
      <Dialog.Root open={isDeletePlayerDialogOpen} onOpenChange={(e) => setIsDeletePlayerDialogOpen(e.open)}>
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
                  Remove Player?
                </Dialog.Title>
                <Dialog.Description color="whiteAlpha.500" fontSize="sm" mt="1">
                  {deletePlayerTarget ? `Remove ${deletePlayerTarget.name} from this session.` : 'Remove player from this session.'}
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
                    onClick={() => setIsDeletePlayerDialogOpen(false)}
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
                    onClick={handleDeletePlayer}
                    _hover={{
                      bg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'
                    }}
                    transition="all 0.2s"
                  >
                    Remove Player
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Delete Chip Set Dialog */}
      <Dialog.Root open={isDeleteChipSetDialogOpen} onOpenChange={(e) => setIsDeleteChipSetDialogOpen(e.open)}>
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
                  Delete Chip Set?
                </Dialog.Title>
                <Dialog.Description color="whiteAlpha.500" fontSize="sm" mt="1">
                  This will permanently delete the chip set and its denominations.
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
                    onClick={() => setIsDeleteChipSetDialogOpen(false)}
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
                    onClick={handleDeleteChipSet}
                    _hover={{
                      bg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'
                    }}
                    transition="all 0.2s"
                  >
                    Delete Chip Set
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Edit Session Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={(e) => setIsEditDialogOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(10px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="#1a1a2e"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              borderRadius={{ base: "xl", md: "2xl" }}
              shadow="0 25px 50px rgba(0, 0, 0, 0.5)"
              maxW="md"
              w="full"
              mx="4"
              maxH="90vh"
              display="flex"
              flexDirection="column"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="1px"
                bg="linear-gradient(90deg, transparent, #a855f7, #06b6d4, transparent)"
              />
              
              <Dialog.Header pt="6" pb="2" px={{ base: "4", md: "6" }}>
                <Dialog.Title color="white" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                  Edit Session
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body px={{ base: "4", md: "6" }} pb="4" overflowY="auto" flex="1">
                <Stack gap="4">
                  <Field.Root>
                    <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                      Session Title
                    </Field.Label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. Friday Night Poker"
                      bg="rgba(255, 255, 255, 0.03)"
                      borderColor="whiteAlpha.100"
                      borderRadius="xl"
                      color="white"
                      h="12"
                      px="4"
                      _placeholder={{ color: 'whiteAlpha.300' }}
                      _hover={{ borderColor: 'whiteAlpha.200' }}
                      _focus={{ borderColor: 'purple.500' }}
                    />
                  </Field.Root>

                  <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="4">
                    <Field.Root>
                      <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                        Session Date
                      </Field.Label>
                      <DatePicker
                        selected={editSessionDate}
                        onChange={(date) => setEditSessionDate(date as Date | null)}
                        customInput={<DateTimeInput placeholder="Select date" />}
                        dateFormat="MMM d, yyyy"
                        popperPlacement="bottom-start"
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                        Session Time
                      </Field.Label>
                      <DatePicker
                        selected={editSessionTime}
                        onChange={(date) => setEditSessionTime(date as Date | null)}
                        customInput={<DateTimeInput placeholder="Select time" />}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={30}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        popperPlacement="bottom-start"
                      />
                    </Field.Root>
                  </Grid>

                  <Field.Root>
                    <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                      Buy-in Amount ({game?.currency})
                    </Field.Label>
                    <Input
                      type="number"
                      value={editBuyinAmount}
                      onChange={(e) => setEditBuyinAmount(e.target.value)}
                      bg="rgba(255, 255, 255, 0.03)"
                      borderColor="whiteAlpha.100"
                      borderRadius="xl"
                      color="white"
                      h="12"
                      px="4"
                      fontFamily="mono"
                      fontSize="lg"
                      fontWeight="bold"
                      _hover={{ borderColor: 'whiteAlpha.200' }}
                      _focus={{ borderColor: 'purple.500' }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                      Chips per Buy-in
                    </Field.Label>
                    <Input
                      type="number"
                      value={editChipsPerBuyin}
                      onChange={(e) => setEditChipsPerBuyin(e.target.value)}
                      bg="rgba(255, 255, 255, 0.03)"
                      borderColor="whiteAlpha.100"
                      borderRadius="xl"
                      color="white"
                      h="12"
                      px="4"
                      fontFamily="mono"
                      fontSize="lg"
                      fontWeight="bold"
                      _hover={{ borderColor: 'whiteAlpha.200' }}
                      _focus={{ borderColor: 'purple.500' }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                      Expected Players
                    </Field.Label>
                    <Input
                      type="number"
                      value={editExpectedPlayers}
                      onChange={(e) => setEditExpectedPlayers(e.target.value)}
                      min="1"
                      max="20"
                      bg="rgba(255, 255, 255, 0.03)"
                      borderColor="whiteAlpha.100"
                      borderRadius="xl"
                      color="white"
                      h="12"
                      px="4"
                      fontFamily="mono"
                      fontSize="lg"
                      fontWeight="bold"
                      _hover={{ borderColor: 'whiteAlpha.200' }}
                      _focus={{ borderColor: 'purple.500' }}
                    />
                    <Text fontSize="xs" color="whiteAlpha.400" mt="1">
                      Used to calculate chip distribution per player
                    </Text>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                      Blinds
                    </Field.Label>
                    <MenuRoot>
                      <MenuTrigger asChild>
                        <Button
                          variant="outline"
                          bg="rgba(255, 255, 255, 0.03)"
                          borderColor="whiteAlpha.100"
                          borderRadius="xl"
                          color="white"
                          h="12"
                          px="4"
                          fontSize="md"
                          justifyContent="space-between"
                          w="full"
                          _hover={{ borderColor: 'whiteAlpha.200' }}
                        >
                          <Text color="white">
                            {BLIND_OPTIONS.find(o => o.small.toString() === editSmallBlind && o.big.toString() === editBigBlind)?.label || `${editSmallBlind} / ${editBigBlind}`}
                          </Text>
                          <CaretDown size={16} weight="bold" />
                        </Button>
                      </MenuTrigger>
                      <MenuContent
                        bg="#16172b"
                        borderColor="whiteAlpha.200"
                        borderRadius="lg"
                        py="2"
                        px="1"
                        minW="240px"
                        boxShadow="lg"
                      >
                        {BLIND_OPTIONS.map((option) => (
                          <MenuItem
                            key={option.label}
                            value={option.label}
                            onClick={() => {
                              setEditSmallBlind(option.small.toString())
                              setEditBigBlind(option.big.toString())
                            }}
                            bg="transparent"
                            color="white"
                            borderRadius="md"
                            px="3"
                            py="2.5"
                            fontSize="md"
                            fontWeight="medium"
                            cursor="pointer"
                            _hover={{ bg: 'purple.500/20' }}
                            _active={{ bg: 'purple.500/30' }}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </MenuContent>
                    </MenuRoot>
                    <Text fontSize="xs" color="whiteAlpha.400" mt="1">
                      Static blinds for the session
                    </Text>
                  </Field.Root>

                  {/* Chip Set Section */}
                  {!isCreatingNewSet ? (
                    <Field.Root>
                      <Flex align="center" justify="space-between" mb="2">
                        <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                          Chip Set (Optional)
                        </Field.Label>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorPalette="purple"
                          onClick={() => setIsCreatingNewSet(true)}
                          gap="1"
                          px="3"
                          h="7"
                        >
                          <Plus size={14} weight="bold" />
                          New Set
                        </Button>
                      </Flex>
                      {chipSets.length > 0 && (
                        <Text fontSize="sm" color="whiteAlpha.600" mb="2" fontWeight="medium">
                          {chipSets.length} chip {chipSets.length !== 1 ? 'sets' : 'set'} available
                        </Text>
                      )}
                      
                      <MenuRoot>
                        <MenuTrigger asChild>
                          <Button
                            variant="outline"
                            bg="rgba(255, 255, 255, 0.03)"
                            borderColor="whiteAlpha.100"
                            borderRadius="xl"
                            color="white"
                            h="12"
                            px="4"
                            fontSize="md"
                            justifyContent="space-between"
                            w="full"
                            _hover={{ borderColor: 'whiteAlpha.200' }}
                          >
                            <Text color={editChipSetId ? 'white' : 'whiteAlpha.500'}>
                              {editChipSetId 
                                ? chipSets.find(s => s.id === editChipSetId)?.name || 'Select chip set'
                                : 'Select chip set'
                              }
                            </Text>
                            <CaretDown size={16} weight="bold" />
                          </Button>
                        </MenuTrigger>
                        <MenuContent
                          bg="#16172b"
                          borderColor="whiteAlpha.200"
                          borderRadius="lg"
                          py="2"
                          px="1"
                          minW="240px"
                          boxShadow="lg"
                        >
                          <MenuItem
                             value="none"
                             onClick={() => setEditChipSetId('')}
                             bg="transparent"
                             color="whiteAlpha.500"
                             borderRadius="md"
                             px="3"
                             py="2.5"
                             fontSize="md"
                             fontWeight="medium"
                             cursor="pointer"
                             _hover={{ bg: 'purple.500/20' }}
                           >
                            No chip set
                          </MenuItem>
                          {chipSets.map((set) => (
                            <MenuItem
                              key={set.id}
                              value={set.id}
                              onClick={() => setEditChipSetId(set.id)}
                              bg="transparent"
                              color="white"
                              borderRadius="md"
                              px="3"
                              py="2.5"
                              fontSize="md"
                              fontWeight="medium"
                              cursor="pointer"
                              _hover={{ bg: 'purple.500/20' }}
                              _active={{ bg: 'purple.500/30' }}
                            >
                              {set.name}
                            </MenuItem>
                          ))}
                        </MenuContent>
                      </MenuRoot>

                      {/* Display selected chip set details */}
                      {editChipSetId && !isEditingSet && (() => {
                        const set = chipSets.find(s => s.id === editChipSetId)
                        if (!set) return null
                        return (
                          <Box
                            mt="3"
                            p="3"
                            bg="rgba(168, 85, 247, 0.05)"
                            borderColor="purple.500/30"
                            borderWidth="1px"
                            borderRadius="lg"
                          >
                            <Flex justify="space-between" align="center" mb="2">
                              <Text fontSize="sm" fontWeight="semibold" color="purple.300">
                                {set.name}
                              </Text>
                              <Flex gap="2">
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  colorPalette="purple"
                                  onClick={() => {
                                    setIsEditingSet(true)
                                    setNewChipSetName(set.name)
                                    setDenominations(set.denominations.length > 0 
                                      ? set.denominations.map(d => ({ value: d.value, quantity: d.quantity }))
                                      : DEFAULT_DENOMS
                                    )
                                  }}
                                  px="2"
                                  h="6"
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  colorPalette="red"
                                  onClick={() => setIsDeleteChipSetDialogOpen(true)}
                                  px="2"
                                  h="6"
                                >
                                  Delete
                                </Button>
                              </Flex>
                            </Flex>
                            <Grid gridTemplateColumns="repeat(3, 1fr)" gap="2">
                              {set.denominations.map((denom) => (
                                <Flex
                                  key={denom.id}
                                  align="center"
                                  gap="1"
                                  fontSize="xs"
                                  color="whiteAlpha.700"
                                >
                                  <Text fontFamily="mono" fontWeight="bold" color="purple.400">
                                    {denom.value}
                                  </Text>
                                  <Text color="whiteAlpha.500">×</Text>
                                  <Text fontFamily="mono">{denom.quantity}</Text>
                                </Flex>
                              ))}
                            </Grid>
                          </Box>
                        )
                      })()}

                      {/* Edit chip set form */}
                      {editChipSetId && isEditingSet && (
                        <Box mt="3">
                          <Flex align="center" justify="space-between" mb="3">
                            <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                              Edit Chip Set
                            </Text>
                            <Button
                              size="sm"
                              variant="ghost"
                              colorPalette="white"
                              color="whiteAlpha.600"
                              onClick={() => {
                                setIsEditingSet(false)
                                setNewChipSetName('')
                                setDenominations(DEFAULT_DENOMS)
                              }}
                              _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                              px="4"
                            >
                              Cancel
                            </Button>
                          </Flex>
                          <Stack gap="3">
                            <Input
                              placeholder="Chip set name"
                              value={newChipSetName}
                              onChange={(e) => setNewChipSetName(e.target.value)}
                              bg="rgba(255, 255, 255, 0.03)"
                              borderColor="whiteAlpha.100"
                              borderRadius="xl"
                              color="white"
                              h="10"
                              px="3"
                              fontSize="sm"
                              _placeholder={{ color: 'whiteAlpha.300' }}
                              _hover={{ borderColor: 'whiteAlpha.200' }}
                              _focus={{ borderColor: 'purple.500' }}
                            />
                            <Text fontSize="xs" color="whiteAlpha.500" mb="1">
                              Chip quantities per denomination:
                            </Text>
                            <Grid gridTemplateColumns="repeat(3, 1fr)" gap="2">
                              {denominations.map((denom, idx) => (
                                <Flex key={idx} gap="1" align="center">
                                  <Input
                                    type="number"
                                    value={denom.value}
                                    onChange={(e) => handleDenomChange(idx, 'value', e.target.value)}
                                    size="xs"
                                    w="45px"
                                    bg="rgba(168, 85, 247, 0.1)"
                                    borderColor="purple.500/30"
                                    color="purple.400"
                                    fontFamily="mono"
                                    fontWeight="bold"
                                    textAlign="center"
                                  />
                                  <Text color="whiteAlpha.500" fontSize="xs">×</Text>
                                  <Input
                                    type="number"
                                    value={denom.quantity}
                                    onChange={(e) => handleDenomChange(idx, 'quantity', e.target.value)}
                                    size="xs"
                                    flex="1"
                                    bg="rgba(255, 255, 255, 0.03)"
                                    borderColor="whiteAlpha.100"
                                    color="white"
                                    fontFamily="mono"
                                  />
                                </Flex>
                              ))}
                            </Grid>
                            <Button
                              size="sm"
                              bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                              color="white"
                              onClick={handleUpdateChipSet}
                              w="full"
                            >
                              Update Set
                            </Button>
                          </Stack>
                        </Box>
                      )}
                    </Field.Root>
                  ) : (
                    <Box>
                      <Flex align="center" justify="space-between" mb="3">
                        <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                          Create New Chip Set
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorPalette="white"
                          color="whiteAlpha.600"
                          onClick={() => {
                            setIsCreatingNewSet(false)
                            setNewChipSetName('')
                            setDenominations(DEFAULT_DENOMS)
                          }}
                          _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                          px="4"
                        >
                          Cancel
                        </Button>
                      </Flex>
                      <Stack gap="3">
                        <Input
                          placeholder="Chip set name"
                          value={newChipSetName}
                          onChange={(e) => setNewChipSetName(e.target.value)}
                          bg="rgba(255, 255, 255, 0.03)"
                          borderColor="whiteAlpha.100"
                          borderRadius="xl"
                          color="white"
                          h="10"
                          px="3"
                          fontSize="sm"
                          _placeholder={{ color: 'whiteAlpha.300' }}
                          _hover={{ borderColor: 'whiteAlpha.200' }}
                          _focus={{ borderColor: 'purple.500' }}
                        />
                        <Text fontSize="xs" color="whiteAlpha.500" mb="1">
                          Chip quantities per denomination:
                        </Text>
                        <Grid gridTemplateColumns="repeat(3, 1fr)" gap="2">
                          {denominations.map((denom, idx) => (
                            <Flex key={idx} gap="1" align="center">
                              <Input
                                type="number"
                                value={denom.value}
                                onChange={(e) => handleDenomChange(idx, 'value', e.target.value)}
                                size="xs"
                                w="45px"
                                bg="rgba(168, 85, 247, 0.1)"
                                borderColor="purple.500/30"
                                color="purple.400"
                                fontFamily="mono"
                                fontWeight="bold"
                                textAlign="center"
                              />
                              <Text color="whiteAlpha.500" fontSize="xs">×</Text>
                              <Input
                                type="number"
                                value={denom.quantity}
                                onChange={(e) => handleDenomChange(idx, 'quantity', e.target.value)}
                                size="xs"
                                flex="1"
                                bg="rgba(255, 255, 255, 0.03)"
                                borderColor="whiteAlpha.100"
                                color="white"
                                fontFamily="mono"
                              />
                            </Flex>
                          ))}
                        </Grid>
                        <Button
                          size="sm"
                          bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                          color="white"
                          onClick={handleCreateChipSet}
                          w="full"
                        >
                          Create Set
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Dialog.Body>

              <Dialog.Footer pb="6" px={{ base: "4", md: "6" }}>
                <Flex gap="3" w="full" direction="column">
                  <Button
                    w="full"
                    h="12"
                    bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                    color="white"
                    fontSize="md"
                    fontWeight="semibold"
                    borderRadius="xl"
                    onClick={handleUpdateGame}
                    shadow="0 4px 20px rgba(168, 85, 247, 0.4)"
                    _hover={{
                      bg: 'linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)',
                      transform: 'translateY(-1px)',
                      shadow: '0 6px 30px rgba(168, 85, 247, 0.5)'
                    }}
                    transition="all 0.2s"
                  >
                    Save Changes
                  </Button>
                  <Dialog.CloseTrigger asChild>
                    <Button
                      w="full"
                      h="12"
                      variant="ghost"
                      colorPalette="gray"
                      color="whiteAlpha.600"
                      fontSize="md"
                      fontWeight="medium"
                      borderRadius="xl"
                      _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                    >
                      Cancel
                    </Button>
                  </Dialog.CloseTrigger>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Edit Session Dialog */}
      <CreateSessionDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => loadGame()}
        editGame={game}
      />
    </Box>
  )
}
