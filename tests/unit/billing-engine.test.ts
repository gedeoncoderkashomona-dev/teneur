import { describe, expect, it } from 'vitest';
import { calculateMeasurement, evaluateDailyEntry } from '@/domain/billing-engine';
import { TERRA_SOL_SEED } from '@/data/terra-sol-seed';
import type { DailyEntry } from '@/domain/types';

describe('Teneur Billing Engine — Regressão dos Boletins Reais (Outubro/2026)', () => {
  it('reproduz no centavo o Boletim de Medição do Leonardo (Outubro/2026 = R$ 14.045,76)', () => {
    const leonardo = TERRA_SOL_SEED.teams.find((t) => t.id === 'team-leonardo')!;
    const financing = TERRA_SOL_SEED.financings.find((f) => f.teamId === 'team-leonardo')!;

    const result = calculateMeasurement({
      team: leonardo,
      referenceMonth: '2026-10',
      entries: TERRA_SOL_SEED.dailyEntries,
      mobilizations: TERRA_SOL_SEED.mobilizations,
      adjustments: TERRA_SOL_SEED.adjustments,
      projects: TERRA_SOL_SEED.projects,
      financing,
      status: 'fechada',
    });

    expect(result.totals.mobilizationKm).toBe(2039);
    expect(result.totals.mobilizationValue).toBe(5709.2);
    expect(result.totals.dailyUnits).toBe(13.5);
    expect(result.totals.dailyValue).toBe(14175);
    expect(result.totals.grossSubtotal).toBe(19884.2);

    const vehiclePayment = result.paymentItems.find((p) => p.category === 'compra_veiculo');
    expect(vehiclePayment?.amount).toBe(1391.89);

    const sptEquipPayment = result.paymentItems.find((p) => p.category === 'equipamento_spt');
    expect(sptEquipPayment?.amount).toBe(472.5);

    expect(result.totals.reimbursementsTotal).toBe(117);
    expect(result.totals.netPaymentsSubtotal).toBe(5838.44);
    expect(result.totals.netPayable).toBe(14045.76);

    expect(result.financingSnapshot?.remainingBalance).toBe(88769.6);
    expect(result.financingSnapshot?.rows).toHaveLength(10);
  });

  it('reproduz no centavo o Boletim de Medição do Ramon (Outubro/2026 = R$ 12.283,40)', () => {
    const ramon = TERRA_SOL_SEED.teams.find((t) => t.id === 'team-ramon')!;

    const result = calculateMeasurement({
      team: ramon,
      referenceMonth: '2026-10',
      entries: TERRA_SOL_SEED.dailyEntries,
      mobilizations: TERRA_SOL_SEED.mobilizations,
      adjustments: TERRA_SOL_SEED.adjustments,
      projects: TERRA_SOL_SEED.projects,
      status: 'fechada',
    });

    expect(result.totals.mobilizationKm).toBe(897);
    expect(result.totals.mobilizationValue).toBe(2511.6);
    expect(result.totals.sptMeters).toBe(89.53);
    expect(result.totals.sptValue).toBe(5371.8);
    expect(result.totals.tradoMeters).toBe(86);
    expect(result.totals.tradoValue).toBe(4300);
    expect(result.totals.dailyUnits).toBe(2);
    expect(result.totals.dailyValue).toBe(2100);
    expect(result.totals.grossSubtotal).toBe(14283.4);
    expect(result.totals.netPaymentsSubtotal).toBe(2000);
    expect(result.totals.netPayable).toBe(12283.4);
  });

  it('converte automaticamente sondagem abaixo da diária mínima para diária e fatura por metro quando >= diária mínima', () => {
    const team = TERRA_SOL_SEED.teams.find((t) => t.id === 'team-ramon')!;

    const lowProductionDay: DailyEntry = {
      id: 'test-low',
      teamId: team.id,
      date: '2026-11-05',
      projectId: null,
      status: 'em_obra',
      activityType: 'spt',
      holes: [{ id: 'h1', code: 'SP-01', type: 'spt', depthMeters: 12 }],
      testDescription: null,
      usesSptEquipment: false,
      billingOverride: 'auto',
      overrideReason: null,
      notes: null,
    };

    const evaluatedLow = evaluateDailyEntry(lowProductionDay, team);
    expect(evaluatedLow.resolvedMode).toBe('diaria');
    expect(evaluatedLow.triggeredMinimumDaily).toBe(true);
    expect(evaluatedLow.billedValue).toBe(1050);

    const exactThresholdDay: DailyEntry = {
      ...lowProductionDay,
      id: 'test-exact',
      holes: [{ id: 'h2', code: 'SP-02', type: 'spt', depthMeters: 17.5 }],
    };

    const evaluatedExact = evaluateDailyEntry(exactThresholdDay, team);
    expect(evaluatedExact.resolvedMode).toBe('metro');
    expect(evaluatedExact.triggeredMinimumDaily).toBe(false);
    expect(evaluatedExact.billedValue).toBe(1050);

    const highProductionDay: DailyEntry = {
      ...lowProductionDay,
      id: 'test-high',
      holes: [{ id: 'h3', code: 'SP-03', type: 'spt', depthMeters: 24.5 }],
    };

    const evaluatedHigh = evaluateDailyEntry(highProductionDay, team);
    expect(evaluatedHigh.resolvedMode).toBe('metro');
    expect(evaluatedHigh.billedValue).toBe(1470);
  });

  it('respeita dias ociosos sem cobrança e overrides manuais de meia diária', () => {
    const team = TERRA_SOL_SEED.teams[0]!;

    const idleDay: DailyEntry = {
      id: 'test-idle',
      teamId: team.id,
      date: '2026-11-06',
      projectId: null,
      status: 'em_casa',
      activityType: 'ocioso',
      holes: [],
      testDescription: null,
      usesSptEquipment: false,
      billingOverride: 'auto',
      overrideReason: null,
      notes: null,
    };

    expect(evaluateDailyEntry(idleDay, team).billedValue).toBe(0);
    expect(evaluateDailyEntry(idleDay, team).resolvedMode).toBe('sem_cobranca');

    const halfDay: DailyEntry = {
      ...idleDay,
      id: 'test-half',
      status: 'mobilizacao',
      billingOverride: 'meia_diaria',
      overrideReason: 'Viagem intermunicipal',
    };

    const evaluatedHalf = evaluateDailyEntry(halfDay, team);
    expect(evaluatedHalf.resolvedMode).toBe('meia_diaria');
    expect(evaluatedHalf.dailyUnits).toBe(0.5);
    expect(evaluatedHalf.billedValue).toBe(525);
  });
});
