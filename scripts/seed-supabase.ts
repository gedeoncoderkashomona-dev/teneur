import { createClient } from '@supabase/supabase-js';
import { TERRA_SOL_SEED } from '../src/data/terra-sol-seed';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de executar npm run db:seed.'
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error: teamsErr } = await supabase.from('teams').upsert(
    TERRA_SOL_SEED.teams.map((t) => ({
      id: t.id,
      name: t.name,
      leader_name: t.leaderName,
      members_count: t.membersCount,
      service_label: t.serviceLabel,
      default_location: t.defaultLocation,
      valor_metro_spt: t.valorMetroSpt,
      valor_metro_trado: t.valorMetroTrado,
      valor_metro_rotativa: t.valorMetroRotativa,
      valor_diaria: t.valorDiaria,
      valor_km_mobilizacao: t.valorKmMobilizacao,
      percentual_desconto_equip_spt: t.percentualDescontoEquipSpt,
      taxa_rastreador_mensal: t.taxaRastreadorMensal,
      folha_clt_padrao_mensal: t.folhaCltPadraoMensal,
      active: t.active,
    }))
  );
  if (teamsErr) throw teamsErr;

  const { error: projectsErr } = await supabase.from('projects').upsert(
    TERRA_SOL_SEED.projects.map((p) => ({
      id: p.id,
      pasta_code: p.pastaCode,
      client_name: p.clientName,
      os_code: p.osCode,
      city: p.city,
      state: p.state,
      service_type: p.serviceType,
      active: p.active,
    }))
  );
  if (projectsErr) throw projectsErr;

  const { error: finErr } = await supabase.from('asset_financings').upsert(
    TERRA_SOL_SEED.financings.map((f) => ({
      id: f.id,
      team_id: f.teamId,
      asset_name: f.assetName,
      total_value: f.totalValue,
      down_payment: f.downPayment,
      monthly_deduction_percent: f.monthlyDeductionPercent,
      active: f.active,
    }))
  );
  if (finErr) throw finErr;

  const amortizations = TERRA_SOL_SEED.financings.flatMap((f) =>
    f.history.map((h) => ({
      id: h.id,
      financing_id: h.financingId,
      reference_month: h.referenceMonth,
      label: h.label,
      discount_amount: h.discountAmount,
      accumulated_paid: h.accumulatedPaid,
      remaining_balance: h.remainingBalance,
      sort_order: h.sortOrder,
    }))
  );
  const { error: amortErr } = await supabase.from('asset_amortizations').upsert(amortizations);
  if (amortErr) throw amortErr;

  const { error: entriesErr } = await supabase.from('daily_entries').upsert(
    TERRA_SOL_SEED.dailyEntries.map((d) => ({
      id: d.id,
      team_id: d.teamId,
      entry_date: d.date,
      project_id: d.projectId,
      status: d.status,
      activity_type: d.activityType,
      holes: d.holes,
      test_description: d.testDescription,
      uses_spt_equipment: d.usesSptEquipment,
      billing_override: d.billingOverride,
      override_reason: d.overrideReason,
      notes: d.notes,
    }))
  );
  if (entriesErr) throw entriesErr;

  const { error: mobErr } = await supabase.from('mobilizations').upsert(
    TERRA_SOL_SEED.mobilizations.map((m) => ({
      id: m.id,
      team_id: m.teamId,
      reference_month: m.referenceMonth,
      entry_date: m.date,
      origin: m.origin,
      destination: m.destination,
      distance_km: m.distanceKm,
      kind: m.kind,
      paid_in_advance: m.paidInAdvance,
      advance_amount: m.advanceAmount,
      advance_date: m.advanceDate,
      advance_notes: m.advanceNotes,
    }))
  );
  if (mobErr) throw mobErr;

  const { error: adjErr } = await supabase.from('financial_adjustments').upsert(
    TERRA_SOL_SEED.adjustments.map((a) => ({
      id: a.id,
      team_id: a.teamId,
      reference_month: a.referenceMonth,
      code: a.code,
      category: a.category,
      direction: a.direction,
      description: a.description,
      details: a.details,
      entry_date: a.date,
      amount: a.amount,
      receipt_ref: a.receiptRef,
      receipt_url: a.receiptUrl,
    }))
  );
  if (adjErr) throw adjErr;

  const { error: measErr } = await supabase.from('measurements').upsert(
    TERRA_SOL_SEED.measurements.map((m) => ({
      id: m.id,
      team_id: m.teamId,
      reference_month: m.referenceMonth,
      status: m.status,
      service_title: m.serviceTitle,
      location_label: m.locationLabel,
      notes: m.notes,
      closed_at: m.closedAt,
    }))
  );
  if (measErr) throw measErr;

  const { error: histErr } = await supabase.from('historical_summaries').upsert(
    TERRA_SOL_SEED.historicalSummaries.map((h) => ({
      id: `hist-${h.teamId}-${h.referenceMonth}`,
      reference_month: h.referenceMonth,
      team_id: h.teamId,
      spt_meters: h.sptMeters,
      trado_meters: h.tradoMeters,
      rotativa_meters: h.rotativaMeters,
      daily_units: h.dailyUnits,
      mobilization_km: h.mobilizationKm,
      mobilization_value: h.mobilizationValue,
      gross_value: h.grossValue,
      deductions_value: h.deductionsValue,
      reimbursements_value: h.reimbursementsValue,
      net_value: h.netValue,
      productive_days: h.productiveDays,
      standby_days: h.standbyDays,
      idle_days: h.idleDays,
      maintenance_days: h.maintenanceDays,
    }))
  );
  if (histErr) throw histErr;

  const s = TERRA_SOL_SEED.signatory;
  const { error: sigErr } = await supabase.from('signatory_settings').upsert({
    id: 'default',
    company_name: s.companyName,
    company_subtitle: s.companySubtitle,
    engineer_name: s.engineerName,
    engineer_title: s.engineerTitle,
    engineer_crea: s.engineerCrea,
    include_legal_representative: s.includeLegalRepresentative,
    legal_rep_name: s.legalRepName,
    legal_rep_role: s.legalRepRole,
    legal_rep_cpf: s.legalRepCpf,
  });
  if (sigErr) throw sigErr;

  console.log('Seed Terra Sol concluído com sucesso no Supabase.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
