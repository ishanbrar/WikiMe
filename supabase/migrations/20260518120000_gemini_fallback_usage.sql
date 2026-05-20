-- Weekly spend cap for direct Gemini API (GEMINI_API_KEY backup), not OpenRouter.
create table public.gemini_fallback_usage (
  week_start date not null primary key,
  estimated_cost_usd numeric(12, 8) not null default 0 check (estimated_cost_usd >= 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.gemini_fallback_usage enable row level security;

-- Service role only (Next.js API). No anon/authenticated policies.

create or replace function public.can_use_gemini_fallback(
  p_week_start date,
  p_reserved_cost_usd numeric default 0,
  p_weekly_limit_usd numeric default 0.5
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  spent numeric;
begin
  select estimated_cost_usd into spent
  from public.gemini_fallback_usage
  where week_start = p_week_start;

  spent := coalesce(spent, 0);
  return spent + greatest(p_reserved_cost_usd, 0) <= p_weekly_limit_usd;
end;
$$;

create or replace function public.record_gemini_fallback_usage(
  p_week_start date,
  p_cost_usd numeric,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_weekly_limit_usd numeric default 0.5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  spent numeric;
  new_spent numeric;
begin
  if p_cost_usd < 0 then
    raise exception 'p_cost_usd must be non-negative';
  end if;

  insert into public.gemini_fallback_usage (week_start)
  values (p_week_start)
  on conflict (week_start) do nothing;

  select estimated_cost_usd into spent
  from public.gemini_fallback_usage
  where week_start = p_week_start
  for update;

  spent := coalesce(spent, 0);

  if spent + p_cost_usd > p_weekly_limit_usd then
    return jsonb_build_object(
      'recorded', false,
      'spent_usd', spent,
      'limit_usd', p_weekly_limit_usd
    );
  end if;

  update public.gemini_fallback_usage
  set
    estimated_cost_usd = estimated_cost_usd + p_cost_usd,
    input_tokens = input_tokens + greatest(p_input_tokens, 0),
    output_tokens = output_tokens + greatest(p_output_tokens, 0),
    request_count = request_count + 1,
    updated_at = now()
  where week_start = p_week_start
  returning estimated_cost_usd into new_spent;

  return jsonb_build_object(
    'recorded', true,
    'spent_usd', new_spent,
    'limit_usd', p_weekly_limit_usd
  );
end;
$$;

revoke all on function public.can_use_gemini_fallback(date, numeric, numeric) from public;
revoke all on function public.record_gemini_fallback_usage(date, numeric, bigint, bigint, numeric) from public;
grant execute on function public.can_use_gemini_fallback(date, numeric, numeric) to service_role;
grant execute on function public.record_gemini_fallback_usage(date, numeric, bigint, bigint, numeric) to service_role;
