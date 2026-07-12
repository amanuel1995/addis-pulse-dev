-- Qualify driver bonus query columns that collide with RETURNS TABLE output
-- variables. Business rules, idempotency, and function security are unchanged.
create or replace function public.calculate_driver_bonuses_server(
  p_campaign_id uuid,
  p_base_fee_etb numeric default 0,
  p_bonus_per_verified_lead_etb numeric default 0,
  p_top_driver_prize_etb numeric default 0,
  p_compliance_threshold numeric default 80,
  p_compliance_deduction_etb numeric default 0
)
returns table(
  driver_bonus_id uuid,
  driver_id uuid,
  verified_leads_count integer,
  total_bonus_etb numeric
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_base_fee_etb < 0
     or p_bonus_per_verified_lead_etb < 0
     or p_top_driver_prize_etb < 0
     or p_compliance_deduction_etb < 0 then
    raise exception using errcode = '22023', message = 'bonus_amounts_must_be_non_negative';
  end if;
  if p_compliance_threshold < 0 or p_compliance_threshold > 100 then
    raise exception using errcode = '22023', message = 'invalid_compliance_threshold';
  end if;

  return query
  with driver_counts as (
    select
      d.id as driver_id,
      d.compliance_score,
      count(l.id)::integer as verified_count
    from public.driver_campaign_assignments a
    join public.drivers d on d.id = a.driver_id
    left join public.leads l
      on l.driver_id = d.id
     and l.campaign_id = a.campaign_id
     and l.verification_status in ('otp_verified', 'call_verified')
     and l.deleted_at is null
    left join public.lead_quality_decisions q
      on q.lead_id = l.id
     and q.is_current
    where a.campaign_id = p_campaign_id
      and a.status in ('active', 'completed')
      and coalesce(q.billable, true)
    group by d.id, d.compliance_score
  ),
  ranked as (
    select
      dc.driver_id,
      dc.compliance_score,
      dc.verified_count,
      rank() over (
        order by dc.verified_count desc, dc.compliance_score desc, dc.driver_id
      ) as driver_rank
    from driver_counts dc
  ),
  upserted as (
    insert into public.driver_bonuses (
      driver_id,
      campaign_id,
      base_fee_etb,
      lead_bonus_etb,
      top_driver_prize_etb,
      compliance_deduction_etb,
      verified_leads_count,
      compliance_score_at_close,
      calculation_snapshot,
      status,
      updated_at
    )
    select
      r.driver_id,
      p_campaign_id,
      p_base_fee_etb,
      p_bonus_per_verified_lead_etb * r.verified_count,
      case when r.driver_rank = 1 and r.verified_count > 0 then p_top_driver_prize_etb else 0 end,
      case when r.compliance_score < p_compliance_threshold then p_compliance_deduction_etb else 0 end,
      r.verified_count,
      r.compliance_score,
      jsonb_build_object(
        'campaign_id', p_campaign_id,
        'base_fee_etb', p_base_fee_etb,
        'bonus_per_verified_lead_etb', p_bonus_per_verified_lead_etb,
        'top_driver_prize_etb', p_top_driver_prize_etb,
        'compliance_threshold', p_compliance_threshold,
        'compliance_deduction_etb', p_compliance_deduction_etb,
        'driver_rank', r.driver_rank,
        'calculated_at', now()
      ),
      'pending',
      now()
    from ranked r
    on conflict on constraint driver_bonuses_driver_id_campaign_id_key
    do update set
      base_fee_etb = excluded.base_fee_etb,
      lead_bonus_etb = excluded.lead_bonus_etb,
      top_driver_prize_etb = excluded.top_driver_prize_etb,
      compliance_deduction_etb = excluded.compliance_deduction_etb,
      verified_leads_count = excluded.verified_leads_count,
      compliance_score_at_close = excluded.compliance_score_at_close,
      calculation_snapshot = excluded.calculation_snapshot,
      status = 'pending',
      updated_at = now()
    returning
      public.driver_bonuses.id,
      public.driver_bonuses.driver_id,
      public.driver_bonuses.verified_leads_count,
      (
        public.driver_bonuses.base_fee_etb
        + public.driver_bonuses.lead_bonus_etb
        + public.driver_bonuses.top_driver_prize_etb
        - public.driver_bonuses.compliance_deduction_etb
      ) as total_bonus_etb
  )
  select
    u.id,
    u.driver_id,
    u.verified_leads_count,
    u.total_bonus_etb
  from upserted u;
end;
$$;
