import crypto from 'node:crypto';
import { TERRA_SOL_SEED } from '@/data/terra-sol-seed';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  CompanyProfile,
  DailyEntry,
  FinancialAdjustment,
  MeasurementRecord,
  MeasurementStatus,
  MobilizationRecord,
  Project,
  SignatoryConfig,
  Team,
  TeneurDataset,
} from '@/domain/types';

function cloneSeed(): TeneurDataset {
  return JSON.parse(JSON.stringify(TERRA_SOL_SEED)) as TeneurDataset;
}

const globalStore = globalThis as unknown as {
  __teneurMemoryDataset?: TeneurDataset;
};

function getMemoryDataset(): TeneurDataset {
  if (!globalStore.__teneurMemoryDataset) {
    globalStore.__teneurMemoryDataset = cloneSeed();
  }
  return globalStore.__teneurMemoryDataset;
}

export function resetMemoryDataset(): void {
  globalStore.__teneurMemoryDataset = cloneSeed();
}

export async function getDataset(): Promise<{
  dataset: TeneurDataset;
  storageMode: 'supabase' | 'local';
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { dataset: getMemoryDataset(), storageMode: 'local' };
  }

  const [
    teamsRes,
    projectsRes,
    entriesRes,
    mobsRes,
    adjsRes,
    finsRes,
    amortsRes,
    measRes,
    histRes,
    sigRes,
  ] = await Promise.all([
    supabase.from('teams').select('*').order('name'),
    supabase.from('projects').select('*').order('pasta_code'),
    supabase.from('daily_entries').select('*').order('entry_date', { ascending: true }),
    supabase.from('mobilizations').select('*').order('entry_date', { ascending: true }),
    supabase.from('financial_adjustments').select('*').order('code'),
    supabase.from('asset_financings').select('*'),
    supabase.from('asset_amortizations').select('*').order('sort_order'),
    supabase.from('measurements').select('*'),
    supabase.from('historical_summaries').select('*').order('reference_month'),
    supabase.from('signatory_settings').select('*').order('updated_at', { ascending: true }),
  ]);

  if (teamsRes.error || !teamsRes.data || teamsRes.data.length === 0) {
    return { dataset: getMemoryDataset(), storageMode: 'local' };
  }

  const amortsByFin = new Map<string, TeneurDataset['financings'][number]['history']>();
  for (const row of amortsRes.data ?? []) {
    const list = amortsByFin.get(row.financing_id) ?? [];
    list.push({
      id: row.id,
      financingId: row.financing_id,
      referenceMonth: row.reference_month,
      label: row.label,
      discountAmount: Number(row.discount_amount),
      accumulatedPaid: Number(row.accumulated_paid),
      remainingBalance: Number(row.remaining_balance),
      sortOrder: Number(row.sort_order),
    });
    amortsByFin.set(row.financing_id, list);
  }

  const allSignatoryRows = sigRes.data ?? [];
  const defaultRow = allSignatoryRows.find((r) => r.id === 'default');
  const companyRows = allSignatoryRows.filter((r) => r.id !== 'default');

  const companies: CompanyProfile[] = [
    ...TERRA_SOL_SEED.companies.filter(
      (seedComp) =>
        !companyRows.some(
          (r) =>
            r.id === seedComp.id ||
            String(r.company_name).toLowerCase() === seedComp.companyName.toLowerCase()
        )
    ),
    ...companyRows.map((r) => ({
      id: r.id,
      companyName: r.company_name,
      companySubtitle: r.company_subtitle,
      includeLegalRepresentative: Boolean(r.include_legal_representative),
      legalRepName: r.legal_rep_name,
      legalRepRole: r.legal_rep_role,
      legalRepCpf: r.legal_rep_cpf,
    })),
  ];

  const activeSignatory: SignatoryConfig = defaultRow
    ? {
        activeCompanyId:
          companies.find(
            (c) => c.companyName.toLowerCase() === String(defaultRow.company_name).toLowerCase()
          )?.id ?? companies[0]?.id,
        companyName: defaultRow.company_name,
        companySubtitle: defaultRow.company_subtitle,
        engineerName: defaultRow.engineer_name,
        engineerTitle: defaultRow.engineer_title,
        engineerCrea: defaultRow.engineer_crea ?? '',
        includeLegalRepresentative: Boolean(defaultRow.include_legal_representative),
        legalRepName: defaultRow.legal_rep_name,
        legalRepRole: defaultRow.legal_rep_role,
        legalRepCpf: defaultRow.legal_rep_cpf,
      }
    : TERRA_SOL_SEED.signatory;

  const dataset: TeneurDataset = {
    teams: teamsRes.data.map((r) => ({
      id: r.id,
      name: r.name,
      leaderName: r.leader_name,
      membersCount: Number(r.members_count),
      serviceLabel: r.service_label,
      defaultLocation: r.default_location,
      valorMetroSpt: Number(r.valor_metro_spt),
      valorMetroTrado: Number(r.valor_metro_trado),
      valorMetroRotativa: Number(r.valor_metro_rotativa),
      valorDiaria: Number(r.valor_diaria),
      valorKmMobilizacao: Number(r.valor_km_mobilizacao),
      percentualDescontoEquipSpt: Number(r.percentual_desconto_equip_spt),
      taxaRastreadorMensal: Number(r.taxa_rastreador_mensal),
      folhaCltPadraoMensal: Number(r.folha_clt_padrao_mensal),
      active: Boolean(r.active),
    })),
    projects: (projectsRes.data ?? []).map((r) => ({
      id: r.id,
      pastaCode: r.pasta_code,
      clientName: r.client_name,
      osCode: r.os_code,
      city: r.city,
      state: String(r.state).trim(),
      serviceType: r.service_type,
      active: Boolean(r.active),
    })),
    dailyEntries: (entriesRes.data ?? []).map((r) => ({
      id: r.id,
      teamId: r.team_id,
      date: r.entry_date,
      projectId: r.project_id,
      status: r.status,
      activityType: r.activity_type,
      holes: Array.isArray(r.holes) ? r.holes : [],
      testDescription: r.test_description,
      usesSptEquipment: Boolean(r.uses_spt_equipment),
      billingOverride: r.billing_override,
      overrideReason: r.override_reason,
      notes: r.notes,
    })),
    mobilizations: (mobsRes.data ?? []).map((r) => ({
      id: r.id,
      teamId: r.team_id,
      referenceMonth: r.reference_month,
      date: r.entry_date,
      origin: r.origin,
      destination: r.destination,
      distanceKm: Number(r.distance_km),
      kind: r.kind,
      paidInAdvance: Boolean(r.paid_in_advance),
      advanceAmount: Number(r.advance_amount),
      advanceDate: r.advance_date,
      advanceNotes: r.advance_notes,
    })),
    adjustments: (adjsRes.data ?? []).map((r) => ({
      id: r.id,
      teamId: r.team_id,
      referenceMonth: r.reference_month,
      code: r.code,
      category: r.category,
      direction: r.direction,
      description: r.description,
      details: r.details,
      date: r.entry_date,
      amount: Number(r.amount),
      receiptRef: r.receipt_ref,
      receiptUrl: r.receipt_url,
    })),
    financings: (finsRes.data ?? []).map((r) => ({
      id: r.id,
      teamId: r.team_id,
      assetName: r.asset_name,
      totalValue: Number(r.total_value),
      downPayment: Number(r.down_payment),
      monthlyDeductionPercent: Number(r.monthly_deduction_percent),
      active: Boolean(r.active),
      history: amortsByFin.get(r.id) ?? [],
    })),
    measurements: (measRes.data ?? []).map((r) => ({
      id: r.id,
      teamId: r.team_id,
      referenceMonth: r.reference_month,
      status: r.status,
      serviceTitle: r.service_title,
      locationLabel: r.location_label,
      notes: r.notes,
      closedAt: r.closed_at,
    })),
    historicalSummaries: (histRes.data ?? []).map((r) => ({
      referenceMonth: r.reference_month,
      teamId: r.team_id,
      sptMeters: Number(r.spt_meters),
      tradoMeters: Number(r.trado_meters),
      rotativaMeters: Number(r.rotativa_meters),
      dailyUnits: Number(r.daily_units),
      mobilizationKm: Number(r.mobilization_km),
      mobilizationValue: Number(r.mobilization_value),
      grossValue: Number(r.gross_value),
      deductionsValue: Number(r.deductions_value),
      reimbursementsValue: Number(r.reimbursements_value),
      netValue: Number(r.net_value),
      productiveDays: Number(r.productive_days),
      standbyDays: Number(r.standby_days),
      idleDays: Number(r.idle_days),
      maintenanceDays: Number(r.maintenance_days),
    })),
    signatory: activeSignatory,
    companies,
  };

  return { dataset, storageMode: 'supabase' };
}

export async function upsertDailyEntry(
  input: Omit<DailyEntry, 'id'> & { id?: string }
): Promise<DailyEntry> {
  const id = input.id || `de-${crypto.randomUUID().slice(0, 8)}`;
  const record: DailyEntry = { ...input, id };
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from('daily_entries').upsert(
      {
        id: record.id,
        team_id: record.teamId,
        entry_date: record.date,
        project_id: record.projectId,
        status: record.status,
        activity_type: record.activityType,
        holes: record.holes,
        test_description: record.testDescription,
        uses_spt_equipment: record.usesSptEquipment,
        billing_override: record.billingOverride,
        override_reason: record.overrideReason,
        notes: record.notes,
      },
      { onConflict: 'team_id,entry_date' }
    );
    if (!error) return record;
  }

  const mem = getMemoryDataset();
  const existingIdx = mem.dailyEntries.findIndex(
    (e) => e.id === record.id || (e.teamId === record.teamId && e.date === record.date)
  );
  if (existingIdx >= 0) {
    const preservedId = mem.dailyEntries[existingIdx]!.id;
    mem.dailyEntries[existingIdx] = { ...record, id: preservedId };
    return mem.dailyEntries[existingIdx]!;
  }
  mem.dailyEntries.push(record);
  return record;
}

export async function deleteDailyEntry(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    await supabase.from('daily_entries').delete().eq('id', id);
  }
  const mem = getMemoryDataset();
  mem.dailyEntries = mem.dailyEntries.filter((e) => e.id !== id);
}

export async function upsertMobilization(
  input: Omit<MobilizationRecord, 'id'> & { id?: string }
): Promise<MobilizationRecord> {
  const id = input.id || `mob-${crypto.randomUUID().slice(0, 8)}`;
  const record: MobilizationRecord = { ...input, id };
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from('mobilizations').upsert({
      id: record.id,
      team_id: record.teamId,
      reference_month: record.referenceMonth,
      entry_date: record.date,
      origin: record.origin,
      destination: record.destination,
      distance_km: record.distanceKm,
      kind: record.kind,
      paid_in_advance: record.paidInAdvance,
      advance_amount: record.advanceAmount,
      advance_date: record.advanceDate,
      advance_notes: record.advanceNotes,
    });
    if (!error) return record;
  }

  const mem = getMemoryDataset();
  const idx = mem.mobilizations.findIndex((m) => m.id === record.id);
  if (idx >= 0) mem.mobilizations[idx] = record;
  else mem.mobilizations.push(record);
  return record;
}

export async function deleteMobilization(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    await supabase.from('mobilizations').delete().eq('id', id);
  }
  const mem = getMemoryDataset();
  mem.mobilizations = mem.mobilizations.filter((m) => m.id !== id);
}

export async function upsertFinancialAdjustment(
  input: Omit<FinancialAdjustment, 'id'> & { id?: string }
): Promise<FinancialAdjustment> {
  const id = input.id || `adj-${crypto.randomUUID().slice(0, 8)}`;
  const record: FinancialAdjustment = { ...input, id };
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from('financial_adjustments').upsert({
      id: record.id,
      team_id: record.teamId,
      reference_month: record.referenceMonth,
      code: record.code,
      category: record.category,
      direction: record.direction,
      description: record.description,
      details: record.details,
      entry_date: record.date,
      amount: record.amount,
      receipt_ref: record.receiptRef,
      receipt_url: record.receiptUrl,
    });
    if (!error) return record;
  }

  const mem = getMemoryDataset();
  const idx = mem.adjustments.findIndex((a) => a.id === record.id);
  if (idx >= 0) mem.adjustments[idx] = record;
  else mem.adjustments.push(record);
  return record;
}

export async function deleteFinancialAdjustment(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    await supabase.from('financial_adjustments').delete().eq('id', id);
  }
  const mem = getMemoryDataset();
  mem.adjustments = mem.adjustments.filter((a) => a.id !== id);
}

export async function upsertTeam(input: Omit<Team, 'id'> & { id?: string }): Promise<Team> {
  const id = input.id || `team-${crypto.randomUUID().slice(0, 8)}`;
  const record: Team = { ...input, id };
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from('teams').upsert({
      id: record.id,
      name: record.name,
      leader_name: record.leaderName,
      members_count: record.membersCount,
      service_label: record.serviceLabel,
      default_location: record.defaultLocation,
      valor_metro_spt: record.valorMetroSpt,
      valor_metro_trado: record.valorMetroTrado,
      valor_metro_rotativa: record.valorMetroRotativa,
      valor_diaria: record.valorDiaria,
      valor_km_mobilizacao: record.valorKmMobilizacao,
      percentual_desconto_equip_spt: record.percentualDescontoEquipSpt,
      taxa_rastreador_mensal: record.taxaRastreadorMensal,
      folha_clt_padrao_mensal: record.folhaCltPadraoMensal,
      active: record.active,
    });
    if (!error) return record;
  }

  const mem = getMemoryDataset();
  const idx = mem.teams.findIndex((t) => t.id === record.id);
  if (idx >= 0) mem.teams[idx] = record;
  else mem.teams.push(record);
  return record;
}

export async function upsertProject(
  input: Omit<Project, 'id'> & { id?: string }
): Promise<Project> {
  const id = input.id || `proj-${crypto.randomUUID().slice(0, 8)}`;
  const record: Project = { ...input, id };
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from('projects').upsert({
      id: record.id,
      pasta_code: record.pastaCode,
      client_name: record.clientName,
      os_code: record.osCode,
      city: record.city,
      state: record.state,
      service_type: record.serviceType,
      active: record.active,
    });
    if (!error) return record;
  }

  const mem = getMemoryDataset();
  const idx = mem.projects.findIndex((p) => p.id === record.id);
  if (idx >= 0) mem.projects[idx] = record;
  else mem.projects.push(record);
  return record;
}

export async function updateMeasurementStatus(params: {
  teamId: string;
  referenceMonth: string;
  status: MeasurementStatus;
  notes?: string | null;
}): Promise<MeasurementRecord> {
  const id = `meas-${params.teamId}-${params.referenceMonth}`;
  const closedAt =
    params.status === 'fechada' || params.status === 'paga' ? new Date().toISOString() : null;
  const record: MeasurementRecord = {
    id,
    teamId: params.teamId,
    referenceMonth: params.referenceMonth,
    status: params.status,
    serviceTitle: null,
    locationLabel: null,
    notes: params.notes ?? null,
    closedAt,
  };

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from('measurements').upsert(
      {
        id: record.id,
        team_id: record.teamId,
        reference_month: record.referenceMonth,
        status: record.status,
        notes: record.notes,
        closed_at: record.closedAt,
      },
      { onConflict: 'team_id,reference_month' }
    );
    if (!error) return record;
  }

  const mem = getMemoryDataset();
  const idx = mem.measurements.findIndex(
    (m) => m.teamId === params.teamId && m.referenceMonth === params.referenceMonth
  );
  if (idx >= 0) {
    mem.measurements[idx] = { ...mem.measurements[idx]!, status: params.status, closedAt };
    return mem.measurements[idx]!;
  }
  mem.measurements.push(record);
  return record;
}

export async function updateSignatorySettings(config: SignatoryConfig): Promise<SignatoryConfig> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from('signatory_settings').upsert({
      id: 'default',
      company_name: config.companyName,
      company_subtitle: config.companySubtitle,
      engineer_name: config.engineerName,
      engineer_title: config.engineerTitle,
      engineer_crea: config.engineerCrea,
      include_legal_representative: config.includeLegalRepresentative,
      legal_rep_name: config.legalRepName,
      legal_rep_role: config.legalRepRole,
      legal_rep_cpf: config.legalRepCpf,
    });
    if (!error) return config;
  }

  const mem = getMemoryDataset();
  mem.signatory = config;
  return config;
}

export async function upsertCompanyProfile(
  input: Omit<CompanyProfile, 'id'> & { id?: string }
): Promise<CompanyProfile> {
  const id = input.id || `comp-${crypto.randomUUID().slice(0, 8)}`;
  const record: CompanyProfile = { ...input, id };
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data: currentDefault } = await supabase
      .from('signatory_settings')
      .select('engineer_name, engineer_title, engineer_crea')
      .eq('id', 'default')
      .maybeSingle();

    const engineerName = currentDefault?.engineer_name ?? TERRA_SOL_SEED.signatory.engineerName;
    const engineerTitle = currentDefault?.engineer_title ?? TERRA_SOL_SEED.signatory.engineerTitle;
    const engineerCrea = currentDefault?.engineer_crea ?? TERRA_SOL_SEED.signatory.engineerCrea;

    await supabase.from('signatory_settings').upsert([
      {
        id: record.id,
        company_name: record.companyName,
        company_subtitle: record.companySubtitle,
        engineer_name: engineerName,
        engineer_title: engineerTitle,
        engineer_crea: engineerCrea,
        include_legal_representative: record.includeLegalRepresentative,
        legal_rep_name: record.legalRepName,
        legal_rep_role: record.legalRepRole,
        legal_rep_cpf: record.legalRepCpf,
      },
      {
        id: 'default',
        company_name: record.companyName,
        company_subtitle: record.companySubtitle,
        engineer_name: engineerName,
        engineer_title: engineerTitle,
        engineer_crea: engineerCrea,
        include_legal_representative: record.includeLegalRepresentative,
        legal_rep_name: record.legalRepName,
        legal_rep_role: record.legalRepRole,
        legal_rep_cpf: record.legalRepCpf,
      },
    ]);
  }

  const mem = getMemoryDataset();
  const idx = mem.companies.findIndex((c) => c.id === record.id);
  if (idx >= 0) mem.companies[idx] = record;
  else mem.companies.push(record);
  mem.signatory = {
    ...mem.signatory,
    activeCompanyId: record.id,
    companyName: record.companyName,
    companySubtitle: record.companySubtitle,
    includeLegalRepresentative: record.includeLegalRepresentative,
    legalRepName: record.legalRepName,
    legalRepRole: record.legalRepRole,
    legalRepCpf: record.legalRepCpf,
  };
  return record;
}

export async function activateCompanyProfile(companyId: string): Promise<SignatoryConfig | null> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data: rows } = await supabase
      .from('signatory_settings')
      .select('*')
      .in('id', ['default', companyId]);

    const defaultRow = rows?.find((r) => r.id === 'default');
    const targetRow = rows?.find((r) => r.id === companyId);
    const seedFallback = TERRA_SOL_SEED.companies.find((c) => c.id === companyId);
    if (!targetRow && !seedFallback) return null;

    const updated: SignatoryConfig = {
      activeCompanyId: companyId,
      companyName: targetRow?.company_name ?? seedFallback!.companyName,
      companySubtitle: targetRow?.company_subtitle ?? seedFallback!.companySubtitle,
      engineerName: defaultRow?.engineer_name ?? TERRA_SOL_SEED.signatory.engineerName,
      engineerTitle: defaultRow?.engineer_title ?? TERRA_SOL_SEED.signatory.engineerTitle,
      engineerCrea: defaultRow?.engineer_crea ?? TERRA_SOL_SEED.signatory.engineerCrea,
      includeLegalRepresentative: targetRow
        ? Boolean(targetRow.include_legal_representative)
        : seedFallback!.includeLegalRepresentative,
      legalRepName: targetRow?.legal_rep_name ?? seedFallback!.legalRepName,
      legalRepRole: targetRow?.legal_rep_role ?? seedFallback!.legalRepRole,
      legalRepCpf: targetRow?.legal_rep_cpf ?? seedFallback!.legalRepCpf,
    };
    return updateSignatorySettings(updated);
  }

  const mem = getMemoryDataset();
  const target = mem.companies.find((c) => c.id === companyId);
  if (!target) return null;

  const updated: SignatoryConfig = {
    ...mem.signatory,
    activeCompanyId: target.id,
    companyName: target.companyName,
    companySubtitle: target.companySubtitle,
    includeLegalRepresentative: target.includeLegalRepresentative,
    legalRepName: target.legalRepName,
    legalRepRole: target.legalRepRole,
    legalRepCpf: target.legalRepCpf,
  };
  return updateSignatorySettings(updated);
}
