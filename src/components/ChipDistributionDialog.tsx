import { useMemo } from 'react'
import {
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  Portal,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Calculator, PokerChip, Warning, CheckCircle } from '@phosphor-icons/react'
import { ChipSetWithDenominations } from '@/lib/types'
import { calculateChipDistribution, canSupportPlayers } from '@/lib/chipDistribution'

interface ChipDistributionDialogProps {
  isOpen: boolean
  onClose: () => void
  chipsPerBuyin: number
  expectedPlayers: number
  chipSet?: ChipSetWithDenominations | null
}
export default function ChipDistributionDialog({ 
  isOpen, 
  onClose, 
  chipsPerBuyin, 
  expectedPlayers,
  chipSet 
}: ChipDistributionDialogProps) {
  const distribution = useMemo(() => {
    if (!chipSet || chipSet.denominations.length === 0) {
      return null
    }
    return calculateChipDistribution({
      denominations: chipSet.denominations,
      expectedPlayers,
      chipsPerBuyin
    })
  }, [chipSet, expectedPlayers, chipsPerBuyin])

  const supportCheck = useMemo(() => {
    if (!chipSet || chipSet.denominations.length === 0) {
      return null
    }
    return canSupportPlayers(chipSet.denominations, expectedPlayers, chipsPerBuyin)
  }, [chipSet, expectedPlayers, chipsPerBuyin])

  const hasChipSet = chipSet && chipSet.denominations.length > 0

  return (
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
              <Flex align="center" gap="3">
                <Box 
                  p="2.5" 
                  borderRadius="lg"
                  bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                >
                  <Calculator size={22} weight="bold" color="white" />
                </Box>
                <Box>
                  <Dialog.Title>
                    <Heading size={{ base: "lg", md: "xl" }} color="white">Chip Distribution</Heading>
                  </Dialog.Title>
                  <Dialog.Description color="whiteAlpha.500" fontSize="sm" mt="0.5">
                    {hasChipSet 
                      ? `${chipsPerBuyin.toLocaleString()} chips × ${expectedPlayers} players`
                      : `Breakdown for ${chipsPerBuyin.toLocaleString()} chips`
                    }
                  </Dialog.Description>
                </Box>
              </Flex>
            </Dialog.Header>

            <Dialog.Body py="4" px={{ base: "4", md: "6" }}>
              {!hasChipSet ? (
                <Box
                  bg="rgba(234, 179, 8, 0.1)"
                  borderWidth="1px"
                  borderColor="yellow.500/30"
                  borderRadius="xl"
                  p="4"
                >
                  <Flex align="center" gap="3">
                    <Warning size={24} weight="fill" color="#eab308" />
                    <Box>
                      <Text color="yellow.300" fontWeight="semibold">No Chip Set Selected</Text>
                      <Text color="whiteAlpha.600" fontSize="sm">
                        Select a chip set in session settings to calculate the optimal distribution.
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              ) : (
                <VStack gap="5" align="stretch">
                  {supportCheck && (
                    <Box
                      bg={supportCheck.canSupport ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
                      borderWidth="1px"
                      borderColor={supportCheck.canSupport ? "green.500/30" : "red.500/30"}
                      borderRadius="xl"
                      p="4"
                    >
                      <Flex align="center" gap="3">
                        {supportCheck.canSupport ? (
                          <CheckCircle size={24} weight="fill" color="#22c55e" />
                        ) : (
                          <Warning size={24} weight="fill" color="#ef4444" />
                        )}
                        <Box>
                          <Text color={supportCheck.canSupport ? "green.300" : "red.300"} fontWeight="semibold">
                            {supportCheck.canSupport 
                              ? `Can support up to ${supportCheck.maxPlayers} players`
                              : `Not enough chips for ${expectedPlayers} players`
                            }
                          </Text>
                          {!supportCheck.canSupport && (
                            <Text color="whiteAlpha.600" fontSize="sm">
                              Short by {supportCheck.shortfall.toLocaleString()} chips total
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    </Box>
                  )}

                  {distribution?.warning && (
                    <Box
                      bg="rgba(234, 179, 8, 0.1)"
                      borderWidth="1px"
                      borderColor="yellow.500/30"
                      borderRadius="xl"
                      p="3"
                    >
                      <Flex align="center" gap="2">
                        <Warning size={18} weight="fill" color="#eab308" />
                        <Text color="yellow.300" fontSize="sm">{distribution.warning}</Text>
                      </Flex>
                    </Box>
                  )}

                  {distribution && distribution.perPlayer.length > 0 && (
                    <Box>
                      <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium" mb="3">
                        Give each player:
                      </Text>
                      <Stack gap="2">
                        {distribution.perPlayer.map((item) => (
                          <Flex
                            key={item.value}
                            align="center"
                            justify="space-between"
                            bg="rgba(255, 255, 255, 0.03)"
                            borderWidth="1px"
                            borderColor="whiteAlpha.100"
                            borderRadius="xl"
                            px="4"
                            py="3"
                            _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                            transition="all 0.2s"
                          >
                            <Flex align="center" gap="3">
                              <Box 
                                p="2" 
                                borderRadius="lg"
                                bg="rgba(168, 85, 247, 0.1)"
                                borderWidth="1px"
                                borderColor="purple.500/30"
                              >
                                <PokerChip size={18} weight="fill" color="#a855f7" />
                              </Box>
                              <Box>
                                <Text color="white" fontWeight="semibold" fontSize="lg">
                                  {item.quantity}×
                                </Text>
                                <Text color="whiteAlpha.500" fontSize="xs">
                                  {item.value} chips
                                </Text>
                              </Box>
                            </Flex>
                            <Text 
                              color="purple.400" 
                              fontFamily="mono" 
                              fontSize="lg"
                              fontWeight="bold"
                            >
                              = {item.total.toLocaleString()}
                            </Text>
                          </Flex>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {distribution && (
                    <Box
                      bg="linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)"
                      borderWidth="1px"
                      borderColor="purple.500/30"
                      borderRadius="xl"
                      p="4"
                    >
                      <Flex justify="space-between" align="center">
                        <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                          Total per player:
                        </Text>
                        <Text 
                          color={distribution.isExact ? "white" : "yellow.300"} 
                          fontFamily="mono" 
                          fontSize="2xl"
                          fontWeight="bold"
                        >
                          {distribution.totalValuePerPlayer.toLocaleString()}
                        </Text>
                      </Flex>
                      {!distribution.isExact && (
                        <Text color="whiteAlpha.500" fontSize="xs" mt="1">
                          Target: {distribution.targetValue.toLocaleString()}
                        </Text>
                      )}
                    </Box>
                  )}

                  {distribution && distribution.remainingChips.length > 0 && (
                    <Box>
                      <Text color="whiteAlpha.500" fontSize="sm" fontWeight="medium" mb="2">
                        Remaining chips in set:
                      </Text>
                      <Flex gap="2" flexWrap="wrap">
                        {distribution.remainingChips.map((item) => (
                          <Box
                            key={item.value}
                            bg="rgba(255, 255, 255, 0.03)"
                            borderWidth="1px"
                            borderColor="whiteAlpha.100"
                            borderRadius="lg"
                            px="3"
                            py="1.5"
                          >
                            <Text color="whiteAlpha.600" fontSize="sm" fontFamily="mono">
                              <Text as="span" color="cyan.400" fontWeight="bold">{item.value}</Text>
                              <Text as="span" color="whiteAlpha.400"> × </Text>
                              {item.quantity}
                            </Text>
                          </Box>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer pb="6" px={{ base: "4", md: "6" }}>
              <Button
                w="full"
                h="12"
                bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                color="white"
                fontSize="md"
                fontWeight="semibold"
                borderRadius="xl"
                onClick={onClose}
                shadow="0 4px 20px rgba(168, 85, 247, 0.4)"
                _hover={{ 
                  shadow: '0 6px 30px rgba(168, 85, 247, 0.5)',
                  transform: 'translateY(-1px)'
                }}
                transition="all 0.2s"
              >
                Got it!
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
