import { forwardRef, useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Grid,
  Heading,
  Input,
  type InputProps,
  Portal,
  Stack,
  Text,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from '@chakra-ui/react'
import DatePicker from 'react-datepicker'
import { CaretDown } from '@phosphor-icons/react'
import { PokerChip, Plus } from '@phosphor-icons/react'
import { createGame, updateGame, listChipSets, createChipSet, updateChipSet, deleteChipSet } from '@/lib/db'
import { ChipSetWithDenominations, Game } from '@/lib/types'
import { toaster } from './ui/toaster'

interface CreateSessionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (gameId: string) => void
  editGame?: Game | null
}

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

const roundToHalfHour = (date: Date) => {
  const rounded = new Date(date)
  const minutes = rounded.getMinutes()
  const roundedMinutes = Math.round(minutes / 30) * 30
  rounded.setMinutes(roundedMinutes, 0, 0)
  if (roundedMinutes === 60) {
    rounded.setHours(rounded.getHours() + 1)
    rounded.setMinutes(0, 0, 0)
  }
  return rounded
}

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

export default function CreateSessionDialog({ isOpen, onClose, onSuccess, editGame }: CreateSessionDialogProps) {
  const isEditMode = !!editGame
  const [title, setTitle] = useState('')
  const [sessionDate, setSessionDate] = useState<Date | null>(null)
  const [sessionTime, setSessionTime] = useState<Date | null>(null)
  const [buyinAmount, setBuyinAmount] = useState('500')
  const [chipsPerBuyin, setChipsPerBuyin] = useState('1000')
  const [expectedPlayers, setExpectedPlayers] = useState('6')
  const [blindOption, setBlindOption] = useState(BLIND_OPTIONS[0])
  const [isCreating, setIsCreating] = useState(false)
  
  // Chip set management
  const [chipSets, setChipSets] = useState<ChipSetWithDenominations[]>([])
  const [selectedChipSetId, setSelectedChipSetId] = useState<string>('')
  const [isCreatingNewSet, setIsCreatingNewSet] = useState(false)
  const [isEditingSet, setIsEditingSet] = useState(false)
  const [newChipSetName, setNewChipSetName] = useState('')
  const [denominations, setDenominations] = useState(DEFAULT_DENOMS)
  const [isDeleteChipSetOpen, setIsDeleteChipSetOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (editGame) {
        // Populate with existing game data
        setTitle(editGame.title)
        const gameDate = new Date(editGame.createdAt)
        setSessionDate(gameDate)
        setSessionTime(gameDate)
        setBuyinAmount(editGame.buyinAmount.toString())
        setChipsPerBuyin(editGame.chipsPerBuyin.toString())
        setExpectedPlayers(editGame.expectedPlayers.toString())
        const matchingBlind = BLIND_OPTIONS.find(opt => 
          opt.small === editGame.smallBlind && opt.big === editGame.bigBlind
        )
        if (matchingBlind) {
          setBlindOption(matchingBlind)
        }
        setSelectedChipSetId(editGame.chipSetId || '')
      } else {
        // Reset for new game
        const now = new Date()
        setSessionDate(now)
        const defaultTime = new Date()
        defaultTime.setHours(19, 0, 0, 0) // 7:00 PM
        setSessionTime(defaultTime)
      }
      loadChipSets()
    }
  }, [isOpen, editGame])

  const loadChipSets = async () => {
    try {
      const sets = await listChipSets()
      console.log('Loaded chip sets:', sets)
      setChipSets(sets)
    } catch (error) {
      console.error('Failed to load chip sets:', error)
      toaster.create({ title: 'Failed to load chip sets', type: 'error', duration: 3000 })
    }
  }

  const selectedChipSet = chipSets.find(s => s.id === selectedChipSetId)

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
      const chipSet = await createChipSet({
        name: newChipSetName,
        denominations: denominations.filter(d => d.quantity > 0)
      })
      await loadChipSets()
      setSelectedChipSetId(chipSet.id)
      setIsCreatingNewSet(false)
      setNewChipSetName('')
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

    if (!selectedChipSetId) return

    try {
      await updateChipSet({
        chipSetId: selectedChipSetId,
        name: newChipSetName,
        denominations
      })
      await loadChipSets()
      setIsEditingSet(false)
      setNewChipSetName('')
      setDenominations(DEFAULT_DENOMS)
      toaster.create({ title: 'Chip set updated!', type: 'success', duration: 2000 })
    } catch (error) {
      console.error('Failed to update chip set:', error)
      toaster.create({ title: 'Failed to update chip set', type: 'error', duration: 3000 })
    }
  }

  const handleDeleteChipSet = async () => {
    if (!selectedChipSetId) return
    try {
      await deleteChipSet(selectedChipSetId)
      await loadChipSets()
      setSelectedChipSetId('')
      setIsDeleteChipSetOpen(false)
      toaster.create({ title: 'Chip set deleted', type: 'success', duration: 2000 })
    } catch (error) {
      console.error('Failed to delete chip set:', error)
      toaster.create({ title: 'Failed to delete chip set', type: 'error', duration: 3000 })
    }
  }

  const handleSubmit = async () => {
    if (!buyinAmount) return
    setIsCreating(true)
    try {
      const createdAtDate = sessionDate ? new Date(sessionDate) : null
      if (createdAtDate && sessionTime) {
        createdAtDate.setHours(sessionTime.getHours(), sessionTime.getMinutes(), 0, 0)
      }
      const createdAt = createdAtDate ? createdAtDate.toISOString() : undefined
      
      if (isEditMode && editGame) {
        // Update existing game
        await updateGame(editGame.id, {
          title: title || undefined,
          buyinAmount: parseInt(buyinAmount) || 500,
          chipsPerBuyin: parseInt(chipsPerBuyin) || 1000,
          expectedPlayers: parseInt(expectedPlayers) || 6,
          smallBlind: blindOption.small,
          bigBlind: blindOption.big,
          chipSetId: selectedChipSetId || undefined,
          createdAt
        })
        toaster.create({
          title: 'Session updated!',
          type: 'success',
          duration: 2000,
        })
        onClose()
        onSuccess(editGame.id)
      } else {
        // Create new game
        const game = await createGame({
          title: title || undefined,
          buyinAmount: parseInt(buyinAmount) || 500,
          chipsPerBuyin: parseInt(chipsPerBuyin) || 1000,
          expectedPlayers: parseInt(expectedPlayers) || 6,
          smallBlind: blindOption.small,
          bigBlind: blindOption.big,
          currency: 'THB',
          chipSetId: selectedChipSetId || undefined,
          createdAt
        })
        toaster.create({
          title: 'Game created!',
          type: 'success',
          duration: 2000,
        })
        onClose()
        onSuccess(game.id)
        // Reset form
        setTitle('')
        setSessionDate(null)
        setSessionTime(null)
        setBuyinAmount('500')
        setChipsPerBuyin('1000')
        setExpectedPlayers('6')
        setBlindOption(BLIND_OPTIONS[0])
        setSelectedChipSetId('')
        setIsCreatingNewSet(false)
      }
    } catch (error) {
      console.error('Failed to save game:', error)
      toaster.create({
        title: `Failed to ${isEditMode ? 'update' : 'create'} game`,
        type: 'error',
        duration: 3000,
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="center">
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
              mx="4"
              my="auto"
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
                {isEditMode ? 'Edit Session' : 'New Session'}
              </Dialog.Title>
              <Dialog.Description color="whiteAlpha.500" fontSize="sm" mt="1">
                {isEditMode ? 'Update your session settings.' : 'Set up your poker night in seconds.'}
              </Dialog.Description>
            </Dialog.Header>

            <Dialog.Body py="4" px={{ base: "4", md: "6" }}>
              <Stack gap="4">
                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                    Session Name
                  </Field.Label>
                  <Input
                    placeholder="e.g. Friday Night Poker"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    bg="rgba(255, 255, 255, 0.03)"
                    borderColor="whiteAlpha.100"
                    borderRadius="xl"
                    color="white"
                    h="12"
                    px="4"
                    fontSize="md"
                    _placeholder={{ color: 'whiteAlpha.300' }}
                    _hover={{ borderColor: 'whiteAlpha.200' }}
                    _focus={{ 
                      borderColor: 'purple.500', 
                      boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)',
                      bg: 'rgba(255, 255, 255, 0.05)'
                    }}
                  />
                </Field.Root>

                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="4">
                  <Field.Root>
                    <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                      Session Date
                    </Field.Label>
                    <DatePicker
                      selected={sessionDate}
                      onChange={(date) => setSessionDate(date as Date | null)}
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
                      selected={sessionTime}
                      onChange={(date) => setSessionTime(date as Date | null)}
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
                    Buy-in Amount (THB)
                  </Field.Label>
                  <Flex align="center" gap="2">
                    <Flex
                      align="center"
                      justify="center"
                      w="12"
                      h="12"
                      borderRadius="xl"
                      bg="rgba(6, 182, 212, 0.1)"
                      borderWidth="1px"
                      borderColor="cyan.500/30"
                      flexShrink="0"
                    >
                      <Text color="cyan.400" fontSize="lg" fontWeight="bold">฿</Text>
                    </Flex>
                    <Input
                      type="number"
                      value={buyinAmount}
                      onChange={(e) => setBuyinAmount(e.target.value)}
                      bg="rgba(255, 255, 255, 0.03)"
                      borderColor="whiteAlpha.100"
                      borderRadius="xl"
                      color="white"
                      h="12"
                      px="4"
                      flex="1"
                      fontFamily="mono"
                      fontSize="lg"
                      fontWeight="bold"
                      _placeholder={{ color: 'whiteAlpha.300' }}
                      _hover={{ borderColor: 'whiteAlpha.200' }}
                      _focus={{ 
                        borderColor: 'purple.500', 
                        boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)',
                        bg: 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </Flex>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                    Chips per Buy-in
                  </Field.Label>
                  <Flex align="center" gap="2">
                    <Flex
                      align="center"
                      justify="center"
                      w="12"
                      h="12"
                      borderRadius="xl"
                      bg="rgba(168, 85, 247, 0.1)"
                      borderWidth="1px"
                      borderColor="purple.500/30"
                      flexShrink="0"
                    >
                      <PokerChip size={20} weight="fill" color="#a855f7" />
                    </Flex>
                    <Input
                      type="number"
                      value={chipsPerBuyin}
                      onChange={(e) => setChipsPerBuyin(e.target.value)}
                      placeholder="1000"
                      bg="rgba(255, 255, 255, 0.03)"
                      borderColor="whiteAlpha.100"
                      borderRadius="xl"
                      color="white"
                      h="12"
                      px="4"
                      flex="1"
                      fontFamily="mono"
                      fontSize="lg"
                      fontWeight="bold"
                      _placeholder={{ color: 'whiteAlpha.300' }}
                      _hover={{ borderColor: 'whiteAlpha.200' }}
                      _focus={{ 
                        borderColor: 'purple.500', 
                        boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)',
                        bg: 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </Flex>
                  <Text fontSize="xs" color="whiteAlpha.400" mt="1">
                    How many chips each player gets for one buy-in
                  </Text>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                    Expected Players
                  </Field.Label>
                  <Input
                    type="number"
                    value={expectedPlayers}
                    onChange={(e) => setExpectedPlayers(e.target.value)}
                    placeholder="6"
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
                    _placeholder={{ color: 'whiteAlpha.300' }}
                    _hover={{ borderColor: 'whiteAlpha.200' }}
                    _focus={{ 
                      borderColor: 'purple.500', 
                      boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)',
                      bg: 'rgba(255, 255, 255, 0.05)'
                    }}
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
                          {blindOption.label}
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
                          onClick={() => setBlindOption(option)}
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
                          <Text color={selectedChipSetId ? 'white' : 'whiteAlpha.500'}>
                            {selectedChipSetId 
                              ? chipSets.find(s => s.id === selectedChipSetId)?.name || 'Select chip set'
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
                        {chipSets.map((set) => (
                          <MenuItem
                            key={set.id}
                            value={set.id}
                            onClick={() => setSelectedChipSetId(set.id)}
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
                    {selectedChipSet && !isEditingSet && (
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
                            {selectedChipSet.name}
                          </Text>
                          <Flex gap="2">
                            <Button
                              size="xs"
                              variant="ghost"
                              colorPalette="purple"
                              onClick={() => {
                                setIsEditingSet(true)
                                setNewChipSetName(selectedChipSet.name)
                                setDenominations(selectedChipSet.denominations.length > 0 
                                  ? selectedChipSet.denominations.map(d => ({ value: d.value, quantity: d.quantity }))
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
                              onClick={() => setIsDeleteChipSetOpen(true)}
                              px="2"
                              h="6"
                            >
                              Delete
                            </Button>
                          </Flex>
                        </Flex>
                        <Grid gridTemplateColumns="repeat(3, 1fr)" gap="2">
                          {selectedChipSet.denominations.map((denom) => (
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
                    )}

                    {/* Edit chip set form */}
                    {selectedChipSet && isEditingSet && (
                      <Box mt="3">
                        <Flex align="center" justify="space-between" mb="3">
                          <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                            Edit Chip Set
                          </Text>
                          <Button
                            size="xs"
                            variant="outline"
                            borderColor="whiteAlpha.300"
                            color="whiteAlpha.800"
                            onClick={() => {
                              setIsEditingSet(false)
                              setNewChipSetName('')
                              setDenominations(DEFAULT_DENOMS)
                            }}
                            _hover={{ borderColor: 'whiteAlpha.500', color: 'white' }}
                            px="3"
                            h="7"
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
                        size="xs"
                        variant="outline"
                        borderColor="whiteAlpha.300"
                        color="whiteAlpha.800"
                        onClick={() => {
                          setIsCreatingNewSet(false)
                          setNewChipSetName('')
                          setDenominations(DEFAULT_DENOMS)
                        }}
                        _hover={{ borderColor: 'whiteAlpha.500', color: 'white' }}
                        px="3"
                        h="7"
                      >
                        Cancel
                      </Button>
                    </Flex>
                    <Stack gap="3">
                      <Input
                        placeholder="Chip set name (e.g. Home Set)"
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
                        Save Set
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Stack>
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
                  onClick={onClose}
                  _hover={{ 
                    bg: 'whiteAlpha.50',
                    borderColor: 'whiteAlpha.300',
                    color: 'white'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  flex="1"
                  h="12"
                  bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                  color="white"
                  fontSize="md"
                  fontWeight="semibold"
                  borderRadius="xl"
                  onClick={handleSubmit}
                  loading={isCreating}
                  shadow="0 4px 20px rgba(168, 85, 247, 0.4)"
                  _hover={{ 
                    shadow: '0 6px 30px rgba(168, 85, 247, 0.5)',
                    transform: 'translateY(-1px)'
                  }}
                  transition="all 0.2s"
                >
                  {isCreating ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create')}
                </Button>
              </Flex>
            </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Delete Chip Set Dialog */}
      <Dialog.Root open={isDeleteChipSetOpen} onOpenChange={(e) => setIsDeleteChipSetOpen(e.open)}>
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
                    onClick={() => setIsDeleteChipSetOpen(false)}
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
    </>
  )
}
