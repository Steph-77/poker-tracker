# PokerSettle - Mobile-First Poker Cash Game Settlement App

A mobile-first poker cash game settlement tool to track buy-ins, final stacks, and automatically calculate optimal payment transfers between players.

**Experience Qualities**:
1. **Efficient** - Designed for quick interactions at the poker table with minimal taps required
2. **Clear** - Financial calculations and settlements displayed unambiguously with validation
3. **Mobile-native** - Single-column layout with large touch targets optimized for phone use

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused tool with CRUD operations for games/players/buy-ins, financial calculations, and settlement generation. Single-user ownership keeps the scope manageable.

## Essential Features

### 1. Game Management
- **Functionality**: Create new poker games with configurable buy-in amounts (default 500 THB)
- **Purpose**: Start tracking a new cash game session
- **Trigger**: User taps "New Game" button from games list
- **Progression**: Games list → Create game modal (set title, buy-in) → New game detail view
- **Success criteria**: Game persists with unique ID, appears in list, navigates to detail view

### 2. Player Management
- **Functionality**: Add players to a game by name only
- **Purpose**: Track who's playing in this session
- **Trigger**: User taps "Add Player" in game detail
- **Progression**: Game detail → Add player input → Player card appears with action buttons
- **Success criteria**: Player persists, displays with buy-in total starting at 0

### 3. Buy-in Tracking
- **Functionality**: Record initial buy-ins and rebuys for each player
- **Purpose**: Track total money invested per player
- **Trigger**: User taps "+ Buy-in" or "+ Rebuy" on player card
- **Progression**: Player card → Tap button → Buy-in recorded → Total updates instantly
- **Success criteria**: Count increments, invested total updates, transaction log persists

### 4. Final Stack Entry
- **Functionality**: Enter each player's final chip stack at game end
- **Purpose**: Capture who ended with what value
- **Trigger**: User switches to "Final Stacks" tab
- **Progression**: Final tab → Number inputs per player → Sum validation → Enable settlement
- **Success criteria**: Validates sum(finals) == sum(buyins), blocks settlement if mismatch

### 5. Settlement Calculation
- **Functionality**: Compute net winnings/losses and optimal transfers using greedy matching
- **Purpose**: Minimize number of payments needed to settle up
- **Trigger**: User taps "Calculate Settlement" after finals are valid
- **Progression**: Final stacks valid → Settlement tab → Net table → Transfer list → Close button
- **Success criteria**: Generates minimum transfers, displays screenshot-friendly receipt, allows game closure

### 6. Game Closure
- **Functionality**: Mark game as closed, prevent further edits
- **Purpose**: Finalize the session and preserve settlement record
- **Trigger**: User taps "Close Game" from settlement view
- **Progression**: Settlement view → Confirm close → Game status = closed → Read-only view
- **Success criteria**: Game cannot be modified, displays as "Closed" in list, settlement preserved

## Edge Case Handling

- **Empty States**: Show helpful prompts when no games exist or no players added yet
- **Validation Errors**: Display clear messages when final stacks don't match buy-ins total
- **Incomplete Data**: Prevent settlement calculation until all players have final stacks entered
- **Closed Game Protection**: Disable all edit actions (add player, buy-in, final stack changes) on closed games
- **Zero-sum Scenarios**: Handle cases where final stacks equal buy-ins (no transfers needed)

## Design Direction

The design should feel like a professional financial calculator meets a casual poker night - trustworthy for money tracking but approachable for social use. Bold, high-contrast colors for action states (winners in green, losers in red) with clean typography that's readable at the poker table. Mobile-first with generously sized touch targets.

## Color Selection

Professional poker aesthetic with strong visual hierarchy for financial data.

- **Primary Color**: Deep teal `oklch(0.45 0.12 210)` - Trustworthy and calm, used for primary actions and app chrome
- **Secondary Colors**: 
  - Charcoal `oklch(0.25 0.01 270)` for cards and elevated surfaces
  - Slate `oklch(0.55 0.02 260)` for secondary text
- **Accent Color**: Amber `oklch(0.75 0.15 75)` - Warm highlight for active states and important CTAs like "Close Game"
- **Semantic Colors**:
  - Success/Winners: Emerald `oklch(0.65 0.18 155)` for positive net values
  - Destructive/Losers: Coral `oklch(0.65 0.18 25)` for negative net values

**Foreground/Background Pairings**:
- Background (Off-white #FAFAFA): Charcoal text (#404040) - Ratio 9.7:1 ✓
- Primary (Deep Teal): White text (#FFFFFF) - Ratio 6.8:1 ✓
- Accent (Amber): Charcoal text (#404040) - Ratio 7.2:1 ✓
- Success (Emerald): White text (#FFFFFF) - Ratio 4.9:1 ✓
- Destructive (Coral): White text (#FFFFFF) - Ratio 5.1:1 ✓
- Card (Charcoal): White text (#FFFFFF) - Ratio 12.8:1 ✓

## Font Selection

Use JetBrains Mono for numbers (conveys precision for financial data) paired with Inter for UI text (clean readability on mobile).

**Typographic Hierarchy**:
- H1 (Screen Titles): Inter Bold/32px/tight letter spacing/-0.02em
- H2 (Section Headers): Inter SemiBold/24px/normal spacing
- H3 (Player Names): Inter Medium/18px/normal spacing
- Body (General Text): Inter Regular/16px/1.5 line height
- Numbers (Buy-ins, Stacks): JetBrains Mono Medium/20px/tabular-nums for alignment
- Small (Labels, Meta): Inter Regular/14px/muted color

## Animations

Animations should feel responsive and provide immediate feedback for financial transactions. Quick, snappy transitions (150-200ms) for button presses and state changes. Smooth tab transitions with subtle slide motion. Celebration micro-interaction when settlement is generated (gentle scale + fade). No animations should delay user actions - everything should feel instant.

## Component Selection

**Components**: 
- **Card** from shadcn for game cards, player cards, and settlement receipt (add subtle shadow for depth on mobile)
- **Button** with variants: default (primary actions), secondary (cancel), destructive (close game) - minimum 48px height for touch
- **Tabs** for game detail navigation (Players / Final Stacks / Settlement)
- **Input** and **NumberInput** for player names and final stack amounts
- **Badge** for game status pills (Active in teal, Closed in slate)
- **Alert** for validation errors and success messages
- **Dialog** for confirmation on game closure
- **Separator** to divide sections within cards

**Customizations**:
- Larger button padding (px-6 py-4) for mobile touch targets
- Number inputs with increased font size (text-xl) and clear +/- steppers
- Custom settlement receipt component with table layout and print-friendly styling
- Player card component with inline action buttons (horizontal layout on mobile)

**States**:
- Buttons: default, hover (slight darken), active (pressed inset), disabled (opacity-50 + cursor-not-allowed)
- Inputs: default, focus (ring-2 ring-primary), error (ring-destructive), disabled
- Game cards: default, closed (opacity-75 + badge indicator)

**Icon Selection**:
- Plus (add player, buy-in, rebuy)
- ArrowRight (navigate to game)
- Check (settlement complete)
- X (close dialogs)
- TrendingUp/TrendingDown (winners/losers indicators)
- Camera (screenshot hint for settlement)

**Spacing**:
- Container padding: px-4 (mobile), max-w-2xl mx-auto
- Card padding: p-6
- Stack gaps: gap-4 (cards list), gap-3 (form fields), gap-6 (sections)
- Button spacing: gap-2 (icon + text)

**Mobile**:
- Single column layout throughout
- Sticky header with game title and back button
- Sticky bottom action bar for primary CTAs (positioned with safe-area-inset)
- Tabs stack vertically on very small screens (<375px)
- Number inputs use native mobile keyboards (inputMode="numeric")
- Settlement view optimized for screenshot: compact, high contrast, clear hierarchy
