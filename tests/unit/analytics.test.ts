import { describe, expect, it } from 'vitest';
import { computeExecutiveAnalytics } from '@/domain/analytics';
import { TERRA_SOL_SEED } from '@/data/terra-sol-seed';
import {
  dailyEntryInputSchema,
  financialAdjustmentInputSchema,
  projectInputSchema,
  teamInputSchema,
} from '@/domain/schemas';

describe('Teneur Executive Analytics & Zod Schemas', () => {
  it('calcula indicadores consolidados, taxa de ocupação, produtividade e evolução semestral', () => {
    const analytics = computeExecutiveAnalytics(TERRA_SOL_SEED, '2026-10');

    expect(analytics.kpis.activeTeamsCount).toBe(6);
    expect(analytics.kpis.totalGross).toBeGreaterThan(34000);
    expect(analytics.kpis.totalNet).toBeLessThan(analytics.kpis.totalGross);
    expect(analytics.kpis.totalSptMeters).toBeGreaterThanOrEqual(89.53);
    expect(analytics.kpis.totalTradoMeters).toBeGreaterThanOrEqual(86);
    expect(analytics.kpis.totalDailyUnits).toBeGreaterThanOrEqual(15.5);

    expect(analytics.semestralEvolution).toHaveLength(6);
    expect(analytics.semestralEvolution[5]?.referenceMonth).toBe('2026-10');

    const sumOccupancyPercents = analytics.fleetOccupancy.items.reduce(
      (acc, item) => acc + item.percent,
      0
    );
    expect(sumOccupancyPercents).toBeGreaterThan(99);
    expect(sumOccupancyPercents).toBeLessThanOrEqual(100.1);

    const ramonProd = analytics.productivityByTeam.find((p) => p.teamId === 'team-ramon');
    expect(ramonProd?.sptDays).toBe(3);
    expect(ramonProd?.sptAvgMetersPerDay).toBeCloseTo(29.84, 1);
    expect(ramonProd?.tradoDays).toBe(4);
  });

  it('valida corretamente schemas de entrada com Zod', () => {
    expect(
      dailyEntryInputSchema.safeParse({
        teamId: 'team-leonardo',
        date: '2026-11-12',
        projectId: 'proj-pasta-48',
        status: 'em_obra',
        activityType: 'spt',
        holes: [{ id: 'h1', code: 'SP-01', type: 'spt', depthMeters: 15.2 }],
      }).success
    ).toBe(true);

    expect(
      dailyEntryInputSchema.safeParse({
        teamId: '',
        date: '12/11/2026',
        projectId: null,
        status: 'em_obra',
        activityType: 'spt',
      }).success
    ).toBe(false);

    expect(
      financialAdjustmentInputSchema.safeParse({
        teamId: 'team-leonardo',
        referenceMonth: '2026-11',
        code: '4.7',
        category: 'reembolso',
        direction: 'reembolso',
        description: 'Cimento',
        amount: -50,
      }).success
    ).toBe(false);

    const parsedProject = projectInputSchema.safeParse({
      pastaCode: 'Pasta 61',
      clientName: 'Construtora Exemplo',
      city: 'Recife',
      state: 'pe',
    });
    expect(parsedProject.success).toBe(true);
    if (parsedProject.success) {
      expect(parsedProject.data.state).toBe('PE');
    }

    expect(
      teamInputSchema.safeParse({
        name: 'Nova Equipe',
        leaderName: 'Carlos',
        valorMetroSpt: 60,
        valorMetroTrado: 50,
        valorDiaria: 1050,
        valorKmMobilizacao: 2.8,
      }).success
    ).toBe(true);
  });
});
