-- Create chip_sets table
CREATE TABLE chip_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create chip_denominations table (flexible denominations per set)
CREATE TABLE chip_denominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_set_id UUID NOT NULL REFERENCES chip_sets(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value > 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add chip_set_id to games table
ALTER TABLE games
ADD COLUMN chip_set_id UUID REFERENCES chip_sets(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_games_chip_set_id ON games(chip_set_id);
CREATE INDEX idx_chip_denominations_chip_set_id ON chip_denominations(chip_set_id);
CREATE INDEX idx_chip_sets_owner_id ON chip_sets(owner_id);

-- Enable RLS
ALTER TABLE chip_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chip_denominations ENABLE ROW LEVEL SECURITY;

-- RLS policies for chip_sets
CREATE POLICY "Chip sets are viewable by everyone"
  ON chip_sets FOR SELECT
  USING (true);

CREATE POLICY "Chip sets are insertable by everyone"
  ON chip_sets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Chip sets are updatable by everyone"
  ON chip_sets FOR UPDATE
  USING (true);

CREATE POLICY "Chip sets are deletable by everyone"
  ON chip_sets FOR DELETE
  USING (true);

-- RLS policies for chip_denominations
CREATE POLICY "Chip denominations are viewable by everyone"
  ON chip_denominations FOR SELECT
  USING (true);

CREATE POLICY "Chip denominations are insertable by everyone"
  ON chip_denominations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Chip denominations are updatable by everyone"
  ON chip_denominations FOR UPDATE
  USING (true);

CREATE POLICY "Chip denominations are deletable by everyone"
  ON chip_denominations FOR DELETE
  USING (true);


