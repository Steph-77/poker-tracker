-- Add blind settings to games table
ALTER TABLE games
ADD COLUMN small_blind INTEGER DEFAULT 5,
ADD COLUMN big_blind INTEGER DEFAULT 10;

-- Ensure sane values
ALTER TABLE games
ADD CONSTRAINT games_blinds_positive CHECK (small_blind > 0 AND big_blind > small_blind);
