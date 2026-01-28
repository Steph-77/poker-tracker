# Multi-Table Support Plan

## Overview
Add support for multiple tables within a single poker session, allowing tournament-style games or parallel cash games to be tracked independently while sharing the same session context.

## Current Architecture

### Database Schema
```
sessions (games table)
  - id
  - title
  - buyin_amount
  - chips_per_buyin
  - expected_players
  - small_blind
  - big_blind
  - chip_set_id
  - created_at
  - closed_at

players
  - id
  - game_id (FK to sessions)
  - name
  - chip_count

buyins
  - id
  - player_id (FK to players)
  - game_id (FK to sessions)
  - type (buyin/rebuy)
  - created_at
```

### Current Flow
1. One session = One game table
2. All players in a session play at the same table
3. Settlement calculated per session

## Proposed Changes

### 1. Database Schema Updates

#### New Tables Structure
```sql
-- Rename 'games' to 'sessions' (or keep games as parent)
sessions
  - id
  - title
  - buyin_amount (shared across all tables)
  - chips_per_buyin (shared)
  - expected_players (total across all tables)
  - chip_set_id (shared chip set)
  - created_at
  - closed_at
  - currency

-- New: Individual tables within a session
tables
  - id
  - session_id (FK to sessions)
  - name (e.g., "Table 1", "Final Table", "Feature Table")
  - small_blind
  - big_blind
  - max_players (optional)
  - status (active/closed)
  - created_at
  - closed_at

-- Update players to reference table
players
  - id
  - session_id (FK to sessions)
  - table_id (FK to tables, nullable - for table transfers)
  - name
  - chip_count
  - current_table_id (FK to tables, current location)

-- Track player movements between tables
player_movements
  - id
  - player_id (FK to players)
  - from_table_id (FK to tables, nullable if first join)
  - to_table_id (FK to tables, nullable if eliminated)
  - chip_count (chips at time of movement)
  - moved_at

-- Update buyins to track per session (not per table)
buyins
  - id
  - player_id (FK to players)
  - session_id (FK to sessions)
  - table_id (FK to tables, where buyin occurred)
  - type (buyin/rebuy)
  - created_at
```

#### Migration Strategy
```sql
-- Migration 1: Add tables table
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  small_blind INTEGER NOT NULL,
  big_blind INTEGER NOT NULL,
  max_players INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Migration 2: Create default table for existing sessions
INSERT INTO tables (session_id, name, small_blind, big_blind, status)
SELECT id, 'Main Table', small_blind, big_blind, 
       CASE WHEN closed_at IS NULL THEN 'active' ELSE 'closed' END
FROM games;

-- Migration 3: Add table references to players
ALTER TABLE players ADD COLUMN table_id UUID REFERENCES tables(id);
ALTER TABLE players ADD COLUMN current_table_id UUID REFERENCES tables(id);

UPDATE players p
SET table_id = t.id, current_table_id = t.id
FROM tables t
WHERE p.game_id = t.session_id;

-- Migration 4: Update buyins
ALTER TABLE buyins ADD COLUMN table_id UUID REFERENCES tables(id);

UPDATE buyins b
SET table_id = p.table_id
FROM players p
WHERE b.player_id = p.id;

-- Migration 5: Create player_movements table
CREATE TABLE player_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  from_table_id UUID REFERENCES tables(id),
  to_table_id UUID REFERENCES tables(id),
  chip_count INTEGER NOT NULL,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration 6: Enable RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON tables
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON tables
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Similar policies for player_movements
```

### 2. UI/UX Changes

#### Session Overview (GamesList)
- Show number of active tables per session
- Badge showing: "3 tables • 24 players"

#### Session Detail Header
- Add "Tables" tab alongside "Players" and "Settlement"
- Show total players across all tables
- Quick stats: Active tables, total players, total chips in play

#### New: Tables Tab
```
┌─────────────────────────────────────────┐
│ Tables                    [+ New Table] │
├─────────────────────────────────────────┤
│                                         │
│ ┌─── Table 1 ─────────────────────────┐│
│ │ Small/Big: 5/10        8 players    ││
│ │ [View] [Move Players] [Close Table] ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─── Final Table ──────────────────────┐│
│ │ Small/Big: 10/20       6 players    ││
│ │ [View] [Move Players] [Close Table] ││
│ └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

#### Table View
- Filter players by table
- Show chip distribution for this table only
- Button to move player to another table
- Settlement calculated session-wide (not per table)

#### Create Session Flow
- Option: "Single table" or "Multiple tables"
- If multiple: 
  - Number of starting tables (default 1)
  - Option to set different blinds per table
  - Auto-name: Table 1, Table 2, etc.

#### Player Management
- Add player to session → Select which table
- Move player between tables (drag & drop or button)
- Show movement history

### 3. Code Changes

#### New Files
```
src/lib/tables.ts          - Table CRUD operations
src/lib/movements.ts       - Player movement tracking
src/components/TablesTab.tsx     - Tables management UI
src/components/TableCard.tsx     - Individual table display
src/components/MovePlayerDialog.tsx  - Move player between tables
```

#### Updated Files
```
src/lib/db.ts
  - Add table support to createGame
  - Update player queries to filter by table
  - Settlement calculations remain session-wide

src/lib/types.ts
  - Add Table interface
  - Add PlayerMovement interface
  - Update Player to include current_table_id

src/components/GameDetail.tsx
  - Add Tables tab
  - Pass table context to components
  - Filter data by active table

src/components/CreateSessionDialog.tsx
  - Add multi-table option
  - Create multiple tables on session creation
```

### 4. Features to Implement

#### Phase 1: Core Multi-Table
- [x] Database schema with tables support
- [ ] Create multiple tables in a session
- [ ] Assign players to specific tables
- [ ] View players filtered by table
- [ ] Basic table management (create, close)

#### Phase 2: Player Movement
- [ ] Move player between tables
- [ ] Track movement history
- [ ] Show movement log in UI
- [ ] Validate movements (can't have negative chips)

#### Phase 3: Enhanced Features
- [ ] Auto-balance tables (distribute players evenly)
- [ ] Consolidate tables (when players are eliminated)
- [ ] Different blinds per table (for progressive tournaments)
- [ ] Table-specific statistics
- [ ] Drag & drop player movement

#### Phase 4: Tournament Features
- [ ] Blind structure progression
- [ ] Auto-increase blinds at intervals
- [ ] Break timers
- [ ] Prize pool structure
- [ ] Payout distribution

### 5. Settlement Logic

**Important**: Settlement remains **session-wide**, not per-table.
- Players can move between tables with their chip stack
- Final settlement compares total chips across all tables to total buy-ins
- Movement between tables doesn't affect settlement
- Only buy-ins and final chip count matter

### 6. Backwards Compatibility

All existing sessions will:
1. Automatically get a "Main Table" created
2. All players assigned to that table
3. Continue working exactly as before
4. UI shows single-table view by default

No data loss, seamless migration.

### 7. API Changes

```typescript
// New functions
async function createTable(sessionId: string, params: CreateTableParams): Promise<Table>
async function listTables(sessionId: string): Promise<Table[]>
async function closeTable(tableId: string): Promise<void>
async function movePlayer(playerId: string, toTableId: string): Promise<PlayerMovement>
async function getPlayerMovements(sessionId: string): Promise<PlayerMovement[]>

// Updated functions
async function addPlayer(sessionId: string, name: string, tableId: string): Promise<Player>
async function getPlayers(sessionId: string, tableId?: string): Promise<Player[]>
```

### 8. Open Questions

1. **Blind Progression**: Should each table have independent blinds or session-wide?
   - Recommendation: Session-wide with override option per table

2. **Chip Distribution**: Calculate per table or session?
   - Recommendation: Session-wide (shared chip set)

3. **Table Limits**: Max tables per session?
   - Recommendation: Soft limit of 10 tables (UI warning)

4. **Auto-Balance**: Automatic or manual table balancing?
   - Recommendation: Phase 3 feature, start manual

5. **Player Elimination**: What happens to closed tables?
   - Recommendation: Archive but keep data for history

### 9. Performance Considerations

- Index on `tables.session_id`
- Index on `players.current_table_id`
- Index on `player_movements.player_id`
- Pagination for large player movements history

### 10. UI Polish

- Smooth animations for player movements
- Visual indicator of which table is currently viewed
- Quick switch between tables (dropdown or tabs)
- Mobile: Swipe between tables
- Desktop: Side-by-side table view option

---

## Implementation Priority

### Immediate (Phase 1)
Focus on getting basic multi-table working without breaking existing functionality.

### Medium Term (Phase 2-3)
Player movements and enhanced table management.

### Long Term (Phase 4)
Tournament-specific features and automation.

---

## Testing Checklist

- [ ] Create session with single table (backwards compat)
- [ ] Create session with multiple tables
- [ ] Add players to different tables
- [ ] Move player between tables
- [ ] Close individual tables
- [ ] Settlement calculation with multiple tables
- [ ] Migration from old schema works
- [ ] Mobile responsive for all new features
