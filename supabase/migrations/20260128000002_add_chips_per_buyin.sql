
-- Add chips_per_buyin column to games table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'chips_per_buyin') THEN 
        ALTER TABLE games ADD COLUMN chips_per_buyin INTEGER DEFAULT 1000;
    END IF; 
END $$;
