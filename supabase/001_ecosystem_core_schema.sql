-- Applied to Supabase project "dragon-pyre-strike" as migration `ecosystem_core_schema`.

-- ============ Shared helpers ============
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ============ Game catalog ============
create table public.games (
  slug text primary key,
  title text not null,
  category text not null,
  score_direction text not null default 'high' check (score_direction in ('high','low')),
  score_unit text not null default 'pts',
  has_score boolean not null default true,
  external_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.games (slug, title, category, score_direction, score_unit, has_score, external_url, sort_order) values
  ('dragon-strike',       'Dragon Strike',          'action',   'high', 'pts',     true,  null, 1),
  ('ember-wyrm',          'Ember Wyrm',             'arcade',   'high', 'pts',     true,  'https://emberwyrmsite.vercel.app', 2),
  ('dragons-hoard',       'Dragon''s Hoard',        'puzzle',   'high', 'pts',     true,  null, 3),
  ('drakebreaker',        'Drakebreaker',           'action',   'high', 'pts',     true,  'https://dragonbreaker-site.vercel.app', 4),
  ('dragon-flight',       'Dragon Flight',          'arcade',   'high', 'pts',     true,  'https://dragon-flight-site.vercel.app', 5),
  ('dragons-lair',        'Dragon''s Lair',         'strategy', 'low',  'sec',     true,  null, 6),
  ('dragons-memory',      'Dragon''s Memory',       'puzzle',   'low',  'moves',   true,  null, 7),
  ('dragon-knight-mage',  'Dragon, Knight & Mage',  'casual',   'high', 'pts',     false, null, 8),
  ('dragons-realm',       'Dragon''s Realm',        'strategy', 'high', 'pts',     false, null, 9),
  ('dragons-riddle',      'Dragon''s Riddle',       'casual',   'low',  'guesses', true,  null, 10);

-- ============ Player profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name text check (display_name is null or char_length(display_name) <= 40),
  avatar text not null default 'ember' check (char_length(avatar) <= 32),
  xp integer not null default 0 check (xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_username_lower_key on public.profiles (lower(username));
create index profiles_xp_idx on public.profiles (xp desc);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============ Per-player, per-game stats (written only through submit_score) ============
create table public.game_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_slug text not null references public.games(slug) on update cascade on delete cascade,
  best_score numeric,
  last_score numeric,
  plays integer not null default 0,
  best_at timestamptz,
  last_played_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);
create index game_stats_game_best_idx on public.game_stats (game_slug, best_score);

-- ============ Run history ============
create table public.score_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_slug text not null references public.games(slug) on update cascade on delete cascade,
  score numeric not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index score_runs_user_game_idx on public.score_runs (user_id, game_slug, created_at desc);

-- ============ Cloud saves ============
create table public.game_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_slug text not null references public.games(slug) on update cascade on delete cascade,
  slot text not null default 'main' check (char_length(slot) <= 32),
  version integer not null default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_slug, slot),
  constraint game_saves_size check (octet_length(data::text) <= 262144)
);
create trigger game_saves_set_updated_at before update on public.game_saves
  for each row execute function public.set_updated_at();

-- ============ Favorites ============
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_slug text not null references public.games(slug) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);

-- ============ Player settings ============
create table public.player_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint player_settings_size check (octet_length(data::text) <= 16384)
);
create trigger player_settings_set_updated_at before update on public.player_settings
  for each row execute function public.set_updated_at();

-- ============ Leaderboard view ============
create view public.leaderboard with (security_invoker = true) as
select
  gs.game_slug, gs.user_id, p.username, p.display_name, p.avatar, gs.best_score, gs.plays, gs.best_at,
  rank() over (
    partition by gs.game_slug
    order by case when g.score_direction = 'high' then -gs.best_score else gs.best_score end, gs.best_at
  ) as rank
from public.game_stats gs
join public.profiles p on p.id = gs.user_id
join public.games g on g.slug = gs.game_slug
where gs.best_score is not null;

-- ============ Auto-create profile on signup ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base text;
  candidate text;
  n integer := 0;
begin
  base := regexp_replace(
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(coalesce(new.email, ''), '@', 1)),
    '[^A-Za-z0-9_]', '', 'g');
  if char_length(base) < 3 then base := 'dragon' || base; end if;
  base := left(base, 16);
  candidate := base;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    n := n + 1;
    candidate := base || '_' || substr(md5(random()::text || n::text), 1, 3);
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, nullif(left(new.raw_user_meta_data->>'display_name', 40), ''));
  insert into public.player_settings (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Server-side score submission ============
create or replace function public.submit_score(p_game text, p_score numeric, p_meta jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  g public.games%rowtype;
  prev numeric;
  is_best boolean;
  gained integer := 10;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select * into g from public.games where slug = p_game;
  if not found then raise exception 'unknown game'; end if;
  if not g.has_score then raise exception 'this game does not record scores'; end if;
  if p_score is null or p_score < 0 or p_score > 1000000000 then raise exception 'invalid score'; end if;
  if octet_length(coalesce(p_meta, '{}'::jsonb)::text) > 2048 then raise exception 'meta too large'; end if;
  if exists (
    select 1 from public.score_runs
    where user_id = uid and game_slug = p_game and created_at > now() - interval '3 seconds'
  ) then
    raise exception 'slow down' using errcode = '54000';
  end if;

  insert into public.score_runs (user_id, game_slug, score, meta)
  values (uid, p_game, p_score, coalesce(p_meta, '{}'::jsonb));

  select best_score into prev from public.game_stats where user_id = uid and game_slug = p_game;
  is_best := prev is null
    or (g.score_direction = 'high' and p_score > prev)
    or (g.score_direction = 'low' and p_score < prev);

  insert into public.game_stats (user_id, game_slug, best_score, last_score, plays, best_at, last_played_at)
  values (uid, p_game, p_score, p_score, 1, now(), now())
  on conflict (user_id, game_slug) do update set
    plays = public.game_stats.plays + 1,
    last_score = p_score,
    last_played_at = now(),
    best_score = case when is_best then p_score else public.game_stats.best_score end,
    best_at = case when is_best then now() else public.game_stats.best_at end;

  if is_best then gained := gained + 15; end if;
  update public.profiles set xp = xp + gained where id = uid;

  return jsonb_build_object('is_best', is_best, 'best', case when is_best then p_score else prev end, 'xp_gained', gained);
end $$;

create or replace function public.touch_game(p_game text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.games where slug = p_game) then
    raise exception 'unknown game';
  end if;
  insert into public.game_stats (user_id, game_slug, plays, last_played_at)
  values (uid, p_game, 0, now())
  on conflict (user_id, game_slug) do update set last_played_at = now();
end $$;

-- ============ Privileges ============
revoke all on public.games, public.profiles, public.game_stats, public.score_runs,
  public.game_saves, public.favorites, public.player_settings, public.leaderboard
  from anon, authenticated;

grant select on public.games, public.profiles, public.game_stats, public.leaderboard to anon, authenticated;
grant update (username, display_name, avatar) on public.profiles to authenticated;
grant select on public.score_runs to authenticated;
grant select, insert, update, delete on public.game_saves, public.favorites, public.player_settings to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.submit_score(text, numeric, jsonb) from public, anon;
revoke execute on function public.touch_game(text) from public, anon;
grant execute on function public.submit_score(text, numeric, jsonb) to authenticated;
grant execute on function public.touch_game(text) to authenticated;

-- ============ Row Level Security ============
alter table public.games enable row level security;
alter table public.profiles enable row level security;
alter table public.game_stats enable row level security;
alter table public.score_runs enable row level security;
alter table public.game_saves enable row level security;
alter table public.favorites enable row level security;
alter table public.player_settings enable row level security;

create policy "games are public" on public.games for select to anon, authenticated using (true);
create policy "profiles are public" on public.profiles for select to anon, authenticated using (true);
create policy "players update own profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "stats are public" on public.game_stats for select to anon, authenticated using (true);
create policy "players read own runs" on public.score_runs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "players read own saves" on public.game_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "players insert own saves" on public.game_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "players update own saves" on public.game_saves for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "players delete own saves" on public.game_saves for delete to authenticated using ((select auth.uid()) = user_id);

create policy "players read own favorites" on public.favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy "players insert own favorites" on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "players delete own favorites" on public.favorites for delete to authenticated using ((select auth.uid()) = user_id);

create policy "players read own settings" on public.player_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "players insert own settings" on public.player_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "players update own settings" on public.player_settings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
