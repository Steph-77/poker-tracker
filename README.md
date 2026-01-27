# PokerSettle

A mobile-first poker cash game settlement application built to track buy-ins, calculate final stacks, and generate optimal payment transfers to settle up after your poker night.

## Features

- **Game Management**: Create and manage multiple poker games with customizable buy-in amounts
- **Player Tracking**: Add players and track their buy-ins and rebuys throughout the session
- **Final Stack Entry**: Record each player's final chip count at the end of the game
- **Smart Settlement**: Automatically calculates net winnings/losses and generates the minimum number of transfers needed to settle
- **Game Closure**: Lock games after settlement to preserve the final state
- **Mobile-First**: Optimized for phone use at the poker table with large touch targets

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Routing**: React Router
- **UI Components**: shadcn/ui v4 + Tailwind CSS v4
- **Data Persistence**: Spark KV Store (key-value storage)
- **Icons**: Phosphor Icons
- **Notifications**: Sonner (toast notifications)

## Project Structure

```
src/
├── components/
│   ├── GamesList.tsx      # Main games list view
│   ├── GameDetail.tsx     # Game detail with tabs (Players, Final Stacks, Settlement)
│   └── ui/                # shadcn components
├── lib/
│   ├── types.ts           # TypeScript type definitions
│   ├── db.ts              # Data access layer (KV store wrapper)
│   ├── settlement.ts      # Settlement calculation algorithm
│   └── utils.ts           # Utility functions
├── App.tsx                # Main app with routing
└── index.css              # Theme and custom styles
```

## How It Works

### 1. Create a Game
- Tap "New Game" on the home screen
- Set a title (optional) and buy-in amount (default: 500 THB)
- The game opens in active status

### 2. Add Players & Track Buy-ins
- Add each player by name
- Use "+ Buy-in" or "+ Rebuy" buttons to record when players buy chips
- Each buy-in uses the game's default buy-in amount
- View real-time totals for buy-in count and total invested per player

### 3. Enter Final Stacks
- Switch to the "Final Stacks" tab
- Enter each player's final chip count
- The app validates that total final stacks match total buy-ins

### 4. Calculate Settlement
- Once final stacks are entered and valid, switch to the "Settlement" tab
- View each player's net result (profit/loss)
- See the optimized list of transfers required to settle up
- The algorithm uses greedy matching to minimize the number of payments

### 5. Close the Game
- Tap "Close Game" to finalize the settlement
- Closed games become read-only and are preserved for records
- Take a screenshot of the settlement for reference

## Settlement Algorithm

The app uses a greedy matching algorithm to minimize payment transfers:

1. Sort players by net balance (winners vs losers)
2. Match the largest creditor with the largest debtor
3. Create a transfer for the minimum of the two amounts
4. Continue until all balances are settled

This ensures the fewest possible transactions while settling the game completely.

## Data Model

### Games
- `id`: Unique identifier
- `title`: Game name
- `buyinAmount`: Buy-in amount per buy-in/rebuy
- `currency`: Currency code (THB)
- `status`: 'active' or 'closed'
- `createdAt`: Creation timestamp
- `closedAt`: Closure timestamp (if closed)

### Players
- `id`: Unique identifier
- `gameId`: Reference to game
- `displayName`: Player name
- `createdAt`: Creation timestamp

### Buy-ins
- `id`: Unique identifier
- `gameId`: Reference to game
- `playerId`: Reference to player
- `amount`: Buy-in amount
- `type`: 'buyin' or 'rebuy'
- `createdAt`: Creation timestamp

### Final Stacks
- `gameId`: Reference to game
- `playerId`: Reference to player
- `amount`: Final chip count

## Development

The app is built on the Spark template with:
- Hot module reloading via Vite
- TypeScript for type safety
- Tailwind CSS for styling
- Persistent storage via Spark KV

## Design Philosophy

**Mobile-First**: Every interaction is optimized for mobile use at the poker table:
- Large tap targets (minimum 48px height for buttons)
- Single-column layout for easy scrolling
- Sticky headers for context
- Clear visual hierarchy with bold typography
- High-contrast colors for financial data (green for winners, red for losers)

**Professional & Trustworthy**: Money tracking requires clarity:
- Monospace fonts for all numbers to ensure alignment
- Validation before allowing settlement
- Clear confirmation dialogs for irreversible actions
- Read-only mode for closed games

**Screenshot-Friendly**: Settlement view is designed to be captured and shared:
- Clean, compact layout
- All relevant information visible
- High contrast for readability

## Theme

The app uses a custom color palette designed for poker night:
- **Primary**: Deep teal for trust and calm
- **Accent**: Amber for important actions
- **Success**: Emerald for winners/profits
- **Destructive**: Coral for losers/losses
- **Card backgrounds**: Dark charcoal for contrast on mobile

Typography uses Inter for UI and JetBrains Mono for numbers.

## License

See LICENSE file for details.