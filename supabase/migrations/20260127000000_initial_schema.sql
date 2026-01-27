-- Create games table
create table games (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  buyin_amount numeric not null,
  currency text not null default 'THB',
  status text not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone
);

-- Create players table
create table players (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references games(id) on delete cascade not null,
  display_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create buyins table
create table buyins (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references games(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  amount numeric not null,
  type text not null check (type in ('buyin', 'rebuy')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create final_stacks table
create table final_stacks (
  game_id uuid references games(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  amount numeric not null,
  primary key (game_id, player_id)
);

-- Create indexes for better query performance
create index idx_players_game_id on players(game_id);
create index idx_buyins_game_id on buyins(game_id);
create index idx_buyins_player_id on buyins(player_id);
create index idx_final_stacks_game_id on final_stacks(game_id);
create index idx_final_stacks_player_id on final_stacks(player_id);

-- Enable Row Level Security (optional, enable if you add auth)
-- alter table games enable row level security;
-- alter table players enable row level security;
-- alter table buyins enable row level security;
-- alter table final_stacks enable row level security;
