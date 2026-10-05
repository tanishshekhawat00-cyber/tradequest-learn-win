
create type public.experience_level as enum ('beginner','intermediate','advanced');
create type public.order_side as enum ('buy','sell');
create type public.order_type as enum ('market','limit','stop_loss','take_profit');
create type public.order_status as enum ('pending','filled','cancelled','rejected');

create table public.profiles (
  id uuid primary key,
  username text unique,
  display_name text,
  avatar_url text,
  experience public.experience_level not null default 'beginner',
  starting_balance numeric(16,2),
  cash numeric(16,2) not null default 0,
  xp integer not null default 0,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

-- prevent clients editing money / xp directly
create or replace function public.protect_profile_fields() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'authenticated' or auth.role() = 'authenticated' then
    new.cash := old.cash;
    new.xp := old.xp;
    new.starting_balance := old.starting_balance;
    new.onboarded := old.onboarded;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile_fields();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  symbol text not null,
  quantity numeric(18,4) not null default 0,
  avg_price numeric(16,4) not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, symbol)
);
grant select on public.holdings to authenticated;
grant all on public.holdings to service_role;
alter table public.holdings enable row level security;
create policy "own holdings" on public.holdings for select to authenticated using (auth.uid() = user_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  symbol text not null,
  side public.order_side not null,
  order_type public.order_type not null,
  quantity numeric(18,4) not null check (quantity > 0),
  trigger_price numeric(16,4),
  status public.order_status not null default 'pending',
  filled_price numeric(16,4),
  reject_reason text,
  created_at timestamptz not null default now(),
  filled_at timestamptz
);
create index orders_user_idx on public.orders(user_id, created_at desc);
create index orders_pending_idx on public.orders(user_id) where status = 'pending';
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders" on public.orders for select to authenticated using (auth.uid() = user_id);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_id uuid references public.orders(id) on delete set null,
  symbol text not null,
  side public.order_side not null,
  quantity numeric(18,4) not null,
  price numeric(16,4) not null,
  value numeric(18,2) not null,
  realized_pnl numeric(18,2),
  cost_basis numeric(16,4),
  created_at timestamptz not null default now()
);
create index trades_user_idx on public.trades(user_id, created_at desc);
grant select on public.trades to authenticated;
grant all on public.trades to service_role;
alter table public.trades enable row level security;
create policy "own trades" on public.trades for select to authenticated using (auth.uid() = user_id);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.watchlists to authenticated;
grant all on public.watchlists to service_role;
alter table public.watchlists enable row level security;
create policy "own watchlists" on public.watchlists for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  symbol text not null check (char_length(symbol) between 1 and 15),
  created_at timestamptz not null default now(),
  unique(watchlist_id, symbol)
);
grant select, insert, delete on public.watchlist_items to authenticated;
grant all on public.watchlist_items to service_role;
alter table public.watchlist_items enable row level security;
create policy "own watchlist items" on public.watchlist_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = auth.uid()));

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id text not null,
  quiz_score integer not null,
  completed_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);
grant select on public.lesson_progress to authenticated;
grant all on public.lesson_progress to service_role;
alter table public.lesson_progress enable row level security;
create policy "own progress" on public.lesson_progress for select to authenticated using (auth.uid() = user_id);

-- Atomic trade execution: only callable by the server (service_role)
create or replace function public.execute_fill(_order_id uuid, _price numeric) returns text
language plpgsql security definer set search_path=public as $$
declare o public.orders; p public.profiles; h public.holdings; v numeric; pnl numeric; first_trade boolean;
begin
  select * into o from public.orders where id = _order_id for update;
  if o is null or o.status <> 'pending' then return 'not_pending'; end if;
  select * into p from public.profiles where id = o.user_id for update;
  select * into h from public.holdings where user_id = o.user_id and symbol = o.symbol for update;
  v := round(o.quantity * _price, 2);
  select not exists(select 1 from public.trades where user_id = o.user_id) into first_trade;
  if o.side = 'buy' then
    if p.cash < v then
      update public.orders set status='rejected', reject_reason='Insufficient virtual cash' where id=o.id;
      return 'insufficient_cash';
    end if;
    update public.profiles set cash = cash - v, xp = xp + 10 + case when first_trade then 50 else 0 end where id = o.user_id;
    if h is null then
      insert into public.holdings(user_id, symbol, quantity, avg_price) values (o.user_id, o.symbol, o.quantity, _price);
    else
      update public.holdings set avg_price = ((quantity*avg_price) + (o.quantity*_price)) / (quantity + o.quantity), quantity = quantity + o.quantity, updated_at=now() where id = h.id;
    end if;
    insert into public.trades(user_id, order_id, symbol, side, quantity, price, value) values (o.user_id, o.id, o.symbol, 'buy', o.quantity, _price, v);
  else
    if h is null or h.quantity < o.quantity then
      update public.orders set status='rejected', reject_reason='Not enough shares held' where id=o.id;
      return 'insufficient_shares';
    end if;
    pnl := round((_price - h.avg_price) * o.quantity, 2);
    update public.profiles set cash = cash + v, xp = xp + 10 where id = o.user_id;
    if h.quantity = o.quantity then delete from public.holdings where id = h.id;
    else update public.holdings set quantity = quantity - o.quantity, updated_at=now() where id = h.id; end if;
    insert into public.trades(user_id, order_id, symbol, side, quantity, price, value, realized_pnl, cost_basis) values (o.user_id, o.id, o.symbol, 'sell', o.quantity, _price, v, pnl, h.avg_price);
  end if;
  update public.orders set status='filled', filled_price=_price, filled_at=now() where id=o.id;
  return 'filled';
end $$;
revoke all on function public.execute_fill(uuid, numeric) from public, anon, authenticated;
grant execute on function public.execute_fill(uuid, numeric) to service_role;
