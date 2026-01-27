import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Trash, TrendUp, TrendDown, Check } from '@phosphor-icons/react'
import { Game, PlayerWithStats, SettlementResult } from '@/lib/types'
import { getGameWithStats, addPlayer, addBuyin, setFinalStack, calculateGameSettlement, closeGame, deletePlayer } from '@/lib/db'
import { toast } from 'sonner'

export default function GameDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [settlement, setSettlement] = useState<SettlementResult | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [finalStackInputs, setFinalStackInputs] = useState<Record<string, string>>({})
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    loadGameData()
  }, [id])

  useEffect(() => {
    if (players.length > 0) {
      calculateSettlement()
    }
  }, [finalStackInputs])

  const loadGameData = async () => {
    if (!id) return
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
  }

  const calculateSettlement = async () => {
    if (!id) return
    const result = await calculateGameSettlement(id)
    if (result) {
      setSettlement(result)
    }
  }

  const handleAddPlayer = async () => {
    if (!id || !newPlayerName.trim()) return
    setIsAddingPlayer(true)
    try {
      await addPlayer(id, newPlayerName.trim())
      await loadGameData()
      setNewPlayerName('')
      toast.success(`${newPlayerName} added to game`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to add player')
    } finally {
      setIsAddingPlayer(false)
    }
  }

  const handleAddBuyin = async (playerId: string, playerName: string, type: 'buyin' | 'rebuy') => {
    if (!id) return
    try {
      await addBuyin(id, playerId, type)
      await loadGameData()
      toast.success(`${type === 'buyin' ? 'Buy-in' : 'Rebuy'} added for ${playerName}`)
    } catch (error: any) {
      toast.error(error.message || `Failed to add ${type}`)
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
      setShowCloseDialog(false)
      toast.success('Game closed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to close game')
    } finally {
      setIsClosing(false)
    }
  }

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!id || !confirm(`Remove ${playerName} from this game?`)) return
    try {
      await deletePlayer(id, playerId)
      await loadGameData()
      toast.success(`${playerName} removed from game`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove player')
    }
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const isClosed = game.status === 'closed'

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={24} />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{game.title}</h1>
            </div>
            <Badge variant={isClosed ? 'secondary' : 'default'} className={!isClosed ? 'bg-primary' : ''}>
              {isClosed ? 'Closed' : 'Active'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            Buy-in: <span className="font-mono font-semibold">{game.buyinAmount} {game.currency}</span>
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="final">Final Stacks</TabsTrigger>
            <TabsTrigger value="settlement">Settlement</TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-4">
            {!isClosed && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Add Player</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Player name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    className="text-lg"
                  />
                  <Button 
                    onClick={handleAddPlayer}
                    disabled={!newPlayerName.trim() || isAddingPlayer}
                    className="w-full h-12"
                  >
                    <Plus className="mr-2" size={20} />
                    Add Player
                  </Button>
                </CardContent>
              </Card>
            )}

            {players.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">
                    No players yet. Add players to start tracking buy-ins.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {players.map((p) => (
                  <Card key={p.player.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{p.player.displayName}</CardTitle>
                        {!isClosed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePlayer(p.player.id, p.player.displayName)}
                            className="h-8 w-8"
                          >
                            <Trash size={18} />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Buy-ins</span>
                        <span className="font-mono text-lg font-semibold">{p.buyinCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Invested</span>
                        <span className="font-mono text-xl font-bold">{p.investedTotal} THB</span>
                      </div>
                      {!isClosed && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-12"
                            onClick={() => handleAddBuyin(p.player.id, p.player.displayName, 'buyin')}
                          >
                            <Plus className="mr-2" size={18} />
                            Buy-in
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 h-12"
                            onClick={() => handleAddBuyin(p.player.id, p.player.displayName, 'rebuy')}
                          >
                            <Plus className="mr-2" size={18} />
                            Rebuy
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="final" className="space-y-4">
            {players.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Add players first before entering final stacks.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Enter Final Chip Stacks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {players.map((p) => (
                      <div key={p.player.id} className="space-y-2">
                        <Label htmlFor={`final-${p.player.id}`} className="text-base">
                          {p.player.displayName}
                        </Label>
                        <Input
                          id={`final-${p.player.id}`}
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
                          value={finalStackInputs[p.player.id] || ''}
                          onChange={(e) => handleFinalStackChange(p.player.id, e.target.value)}
                          disabled={isClosed}
                          className="text-xl font-mono h-12"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {settlement && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Buy-ins</span>
                          <span className="font-mono text-lg font-bold">{settlement.totalBuyins} THB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Final Stacks</span>
                          <span className="font-mono text-lg font-bold">{settlement.totalFinalStacks} THB</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm font-medium">Difference</span>
                          <span className={`font-mono text-lg font-bold ${
                            settlement.totalBuyins === settlement.totalFinalStacks 
                              ? 'text-success' 
                              : 'text-destructive'
                          }`}>
                            {settlement.totalFinalStacks - settlement.totalBuyins} THB
                          </span>
                        </div>
                      </div>
                      {!settlement.isValid && (
                        <Alert className="mt-4 border-destructive">
                          <AlertDescription>
                            Final stacks must equal total buy-ins to calculate settlement.
                          </AlertDescription>
                        </Alert>
                      )}
                      {settlement.isValid && (
                        <Alert className="mt-4 border-success bg-success/10">
                          <Check className="h-4 w-4" />
                          <AlertDescription>
                            Totals match! Go to Settlement tab to close the game.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="settlement" className="space-y-4">
            {!settlement || !settlement.isValid ? (
              <Alert>
                <AlertDescription>
                  Enter final stacks for all players and ensure totals match before viewing settlement.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Player Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {settlement.players
                      .sort((a, b) => (b.net || 0) - (a.net || 0))
                      .map((p) => (
                        <div 
                          key={p.player.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            {p.net && p.net > 0 && <TrendUp size={20} className="text-success" />}
                            {p.net && p.net < 0 && <TrendDown size={20} className="text-destructive" />}
                            <span className="font-medium">{p.player.displayName}</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono text-xl font-bold ${
                              p.net && p.net > 0 ? 'text-success' : p.net && p.net < 0 ? 'text-destructive' : ''
                            }`}>
                              {p.net && p.net > 0 ? '+' : ''}{p.net || 0} THB
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {p.finalStack} - {p.investedTotal}
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Required Transfers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {settlement.transfers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No transfers needed - everyone broke even!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {settlement.transfers.map((t) => (
                          <div 
                            key={t.id}
                            className="flex items-center justify-between p-4 rounded-lg border-2 bg-card"
                          >
                            <div>
                              <div className="font-medium text-lg">
                                {t.fromName} → {t.toName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Transfer payment
                              </div>
                            </div>
                            <div className="font-mono text-2xl font-bold text-accent-foreground">
                              {t.amount} THB
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!isClosed && (
                  <Button
                    size="lg"
                    className="w-full h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => setShowCloseDialog(true)}
                  >
                    <Check className="mr-2" size={24} />
                    Close Game
                  </Button>
                )}

                {isClosed && (
                  <Alert className="border-success bg-success/10">
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      This game has been closed. Take a screenshot of the settlement for your records.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Game?</DialogTitle>
            <DialogDescription>
              This will finalize the settlement and prevent any further changes to this game.
              Make sure everyone has recorded the payment details.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloseGame} disabled={isClosing} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {isClosing ? 'Closing...' : 'Close Game'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}