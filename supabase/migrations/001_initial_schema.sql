create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.teams (
  id text primary key,
  name text not null,
  leader_name text not null,
  members_count integer not null default 3 check (members_count > 0),
  service_label text not null default 'EXECUÇÃO DE SONDAGEM SPT E ENSAIOS',
  default_location text not null default 'VARIADOS',
  valor_metro_spt numeric(10, 2) not null default 60.00,
  valor_metro_trado numeric(10, 2) not null default 50.00,
  valor_metro_rotativa numeric(10, 2) not null default 120.00,
  valor_diaria numeric(10, 2) not null default 1050.00,
  valor_km_mobilizacao numeric(10, 2) not null default 2.80,
  percentual_desconto_equip_spt numeric(5, 2) not null default 0.00,
  taxa_rastreador_mensal numeric(10, 2) not null default 0.00,
  folha_clt_padrao_mensal numeric(10, 2) not null default 0.00,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id text primary key,
  pasta_code text not null,
  client_name text not null,
  os_code text,
  city text not null,
  state char(2) not null,
  service_type text not null default 'Sondagem SPT e Ensaios',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_entries (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  entry_date date not null,
  project_id text references public.projects(id) on delete set null,
  status text not null check (status in ('em_obra', 'mobilizacao', 'parado_diaria', 'em_casa', 'folga', 'manutencao')),
  activity_type text not null check (activity_type in ('spt', 'trado', 'rotativa', 'ensaio', 'coleta', 'misto', 'viagem', 'parado', 'ocioso')),
  holes jsonb not null default '[]'::jsonb,
  test_description text,
  uses_spt_equipment boolean not null default false,
  billing_override text not null default 'auto' check (billing_override in ('auto', 'metro', 'diaria', 'meia_diaria', 'sem_cobranca')),
  override_reason text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (team_id, entry_date)
);

create table if not exists public.mobilizations (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  reference_month char(7) not null,
  entry_date date not null,
  origin text not null,
  destination text not null,
  distance_km numeric(10, 2) not null check (distance_km > 0),
  kind text not null check (kind in ('mobilizacao', 'desmobilizacao', 'deslocamento')),
  paid_in_advance boolean not null default false,
  advance_amount numeric(12, 2) not null default 0.00,
  advance_date date,
  advance_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_adjustments (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  reference_month char(7) not null,
  code text not null,
  category text not null check (category in ('mobilizacao_paga', 'compra_veiculo', 'equipamento_spt', 'rastreador', 'folha_clt', 'reembolso', 'outro_desconto')),
  direction text not null check (direction in ('desconto', 'reembolso')),
  description text not null,
  details text,
  entry_date date,
  amount numeric(12, 2) not null check (amount > 0),
  receipt_ref text,
  receipt_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.asset_financings (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  asset_name text not null,
  total_value numeric(12, 2) not null check (total_value > 0),
  down_payment numeric(12, 2) not null default 0.00,
  monthly_deduction_percent numeric(5, 2) not null default 7.00,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.asset_amortizations (
  id text primary key,
  financing_id text not null references public.asset_financings(id) on delete cascade,
  reference_month char(7) not null,
  label text not null,
  discount_amount numeric(12, 2) not null,
  accumulated_paid numeric(12, 2) not null,
  remaining_balance numeric(12, 2) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.measurements (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  reference_month char(7) not null,
  status text not null default 'aberta' check (status in ('aberta', 'revisao', 'fechada', 'paga')),
  service_title text,
  location_label text,
  notes text,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (team_id, reference_month)
);

create table if not exists public.historical_summaries (
  id text primary key,
  reference_month char(7) not null,
  team_id text not null references public.teams(id) on delete cascade,
  spt_meters numeric(10, 2) not null default 0,
  trado_meters numeric(10, 2) not null default 0,
  rotativa_meters numeric(10, 2) not null default 0,
  daily_units numeric(10, 2) not null default 0,
  mobilization_km numeric(10, 2) not null default 0,
  mobilization_value numeric(12, 2) not null default 0,
  gross_value numeric(12, 2) not null default 0,
  deductions_value numeric(12, 2) not null default 0,
  reimbursements_value numeric(12, 2) not null default 0,
  net_value numeric(12, 2) not null default 0,
  productive_days integer not null default 0,
  standby_days integer not null default 0,
  idle_days integer not null default 0,
  maintenance_days integer not null default 0
);

create table if not exists public.signatory_settings (
  id text primary key default 'default',
  company_name text not null default 'Terra Sol',
  company_subtitle text not null default 'engenharia geotécnica',
  engineer_name text not null default 'Catherine Irina Pascoal Gouveia',
  engineer_title text not null default 'Engenheira de Minas',
  engineer_crea text not null default '',
  include_legal_representative boolean not null default false,
  legal_rep_name text not null default 'Eng. Damiana Tavares',
  legal_rep_role text not null default 'Representante Legal',
  legal_rep_cpf text not null default '121.647.064-20',
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_daily_entries_team_date on public.daily_entries(team_id, entry_date desc);
create index if not exists idx_mobilizations_team_month on public.mobilizations(team_id, reference_month);
create index if not exists idx_adjustments_team_month on public.financial_adjustments(team_id, reference_month);
create index if not exists idx_measurements_team_month on public.measurements(team_id, reference_month);

drop trigger if exists trg_teams_updated_at on public.teams;
create trigger trg_teams_updated_at before update on public.teams for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();

drop trigger if exists trg_daily_entries_updated_at on public.daily_entries;
create trigger trg_daily_entries_updated_at before update on public.daily_entries for each row execute function public.set_updated_at();

drop trigger if exists trg_mobilizations_updated_at on public.mobilizations;
create trigger trg_mobilizations_updated_at before update on public.mobilizations for each row execute function public.set_updated_at();

drop trigger if exists trg_adjustments_updated_at on public.financial_adjustments;
create trigger trg_adjustments_updated_at before update on public.financial_adjustments for each row execute function public.set_updated_at();

drop trigger if exists trg_measurements_updated_at on public.measurements;
create trigger trg_measurements_updated_at before update on public.measurements for each row execute function public.set_updated_at();

alter table public.teams enable row level security;
alter table public.projects enable row level security;
alter table public.daily_entries enable row level security;
alter table public.mobilizations enable row level security;
alter table public.financial_adjustments enable row level security;
alter table public.asset_financings enable row level security;
alter table public.asset_amortizations enable row level security;
alter table public.measurements enable row level security;
alter table public.historical_summaries enable row level security;
alter table public.signatory_settings enable row level security;

create policy "teneur_authenticated_all_teams" on public.teams for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));
create policy "teneur_authenticated_all_projects" on public.projects for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));
create policy "teneur_authenticated_all_daily_entries" on public.daily_entries for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));
create policy "teneur_authenticated_all_mobilizations" on public.mobilizations for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));
create policy "teneur_authenticated_all_adjustments" on public.financial_adjustments for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));
create policy "teneur_authenticated_all_financings" on public.asset_financings for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));
create policy "teneur_authenticated_all_amortizations" on public.asset_amortizations for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));
create policy "teneur_authenticated_all_measurements" on public.measurements for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));
create policy "teneur_authenticated_all_history" on public.historical_summaries for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));
create policy "teneur_authenticated_all_signatory" on public.signatory_settings for all using (auth.role() in ('authenticated', 'anon', 'service_role')) with check (auth.role() in ('authenticated', 'anon', 'service_role'));

alter publication supabase_realtime add table public.daily_entries;
alter publication supabase_realtime add table public.mobilizations;
alter publication supabase_realtime add table public.financial_adjustments;
alter publication supabase_realtime add table public.measurements;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.projects;

grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
