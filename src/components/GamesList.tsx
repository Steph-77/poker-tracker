import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, ArrowRight } from '@phosphor-icons/react'
import { Game } from '@/lib/types'
import { createGame } from '@/lib/db'

export default function GamesList() {
  const navigate = useNavigate()
  const [games, setGames] = useKV<Game[]>('poker-games', [])
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [buyinAmount, setBuyinAmount] = useState('500')
  const [open, setOpen] = useState(false)

  const handleCreateGame = async () => {
    setIsCreating(true)
    try {
      const game = await createGame({
        title: title || undefined,
        buyinAmount: parseInt(buyinAmount) || 500,
        currency: 'THB'
      })
      setGames((currentGames) => [game, ...(currentGames || [])])
      setTitle('')
      setBuyinAmount('500')
      setOpen(false)
      navigate(`/game/${game.id}`)
    } catch (error) {
      console.error('Failed to create game:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">PokerSettle</h1>
          <p className="text-muted-foreground text-lg">Manage your poker cash games</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full mb-6 h-14 text-lg">
              <Plus className="mr-2" size={24} />
              New Game
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Game</DialogTitle>
              <DialogDescription>
                Set up a new poker cash game session
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Game Title (optional)</Label>
                <Input
                  id="title"
                  placeholder={`Poker Night ${new Date().toLocaleDateString()}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="buyin">Buy-in Amount (THB)</Label>
                <Input
                  id="buyin"
                  type="number"
                  inputMode="numeric"
                  value={buyinAmount}
                  onChange={(e) => setBuyinAmount(e.target.value)}
                  className="text-xl font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateGame} disabled={isCreating} className="w-full h-12">
                {isCreating ? 'Creating...' : 'Create Game'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!games || games.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-center mb-4">
                No games yet. Create your first poker game to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <Card 
                key={game.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/game/${game.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{game.title}</CardTitle>
                      <CardDescription>
                        Buy-in: <span className="font-mono font-semibold">{game.buyinAmount} {game.currency}</span>
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={game.status === 'active' ? 'default' : 'secondary'}
                      className={game.status === 'active' ? 'bg-primary' : ''}
                    >
                      {game.status === 'active' ? 'Active' : 'Closed'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0">
                  <p className="text-sm text-muted-foreground">
                    {new Date(game.createdAt).toLocaleDateString()} at {new Date(game.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <ArrowRight size={20} className="text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}