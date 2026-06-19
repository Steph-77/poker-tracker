-- Allow equal blinds (e.g. 10/10) while still enforcing positive values.
ALTER TABLE games
DROP CONSTRAINT IF EXISTS games_blinds_positive;

ALTER TABLE games
ADD CONSTRAINT games_blinds_positive CHECK (small_blind > 0 AND big_blind >= small_blind);
