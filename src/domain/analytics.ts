import { calculateMeasurement } from './billing-engine';
import { formatMonthShortPT, roundCurrency, roundMeters } from './formatters';
import type {
  MeasurementCalculation,
  TeneurDataset,
} from './types';

export interface ExecutiveAnalytics {
  referenceMonth: string;
  kpis: {
    totalGross: number;
    totalDeductions: number;
    totalReimbursements: number;
    totalNet: number;
    totalMeters: number;
    totalSptMeters: number;
    totalTradoMeters: number;
    totalDailyUnits: number;
    totalMobilizationKm: number;
    mobilizationSharePercent: number;
    occupancyRatePercent: number;
    activeTeamsCount: number;
  };
  productionByTeam: Array<{
    teamId: string;
    teamName: string;
    sptMeters: number;
    tradoMeters: number;
    totalMeters: number;
    dailyUnits: number;
    mobilizationKm: number;
    grossValue: number;
    netValue: number;
  }>;
  semestralEvolution: Array<{
    referenceMonth: string;
    label: string;
    totalMeters: number;
    dailyUnits: number;
    grossValue: number;
    deductionsValue: number;
    netValue: number;
    mobilizationValue: number;
    mobilizationSharePercent: number;
  }>;
  fleetOccupancy: {
    productiveDays: number;
    standbyDays: number;
    idleDays: number;
    maintenanceDays: number;
    travelDays: number;
    restDays: number;
    totalTrackedDays: number;
    items: Array<{
      key: string;
      label: string;
      days: number;
      percent: number;
      color: string;
    }>;
  };
  productivityByTeam: Array<{
    teamId: string;
    teamName: string;
    sptDays: number;
    sptAvgMetersPerDay: number;
    tradoDays: number;
    tradoAvgMetersPerDay: number;
    overallAvgMetersPerDay: number;
  }>;
  costByProject: Array<{
    projectId: string;
    pastaCode: string;
    clientName: string;
    location: string;
    totalMeters: number;
    dailyUnits: number;
    estimatedCost: number;
    daysCount: number;
  }>;
  measurements: MeasurementCalculation[];
}

export function computeExecutiveAnalytics(
  dataset: TeneurDataset,
  referenceMonth: string
): ExecutiveAnalytics {
  const activeTeams = dataset.teams.filter((t) => t.active);

  const measurements = activeTeams.map((team) => {
    const financing = dataset.financings.find((f) => f.teamId === team.id && f.active) ?? null;
    const saved = dataset.measurements.find(
      (m) => m.teamId === team.id && m.referenceMonth === referenceMonth
    );
    return calculateMeasurement({
      team,
      referenceMonth,
      entries: dataset.dailyEntries,
      mobilizations: dataset.mobilizations,
      adjustments: dataset.adjustments,
      projects: dataset.projects,
      financing,
      status: saved?.status ?? 'aberta',
      locationOverride: saved?.locationLabel ?? null,
    });
  });

  const totalGross = roundCurrency(
    measurements.reduce((acc, m) => acc + m.totals.grossSubtotal, 0)
  );
  const totalDeductions = roundCurrency(
    measurements.reduce((acc, m) => acc + m.totals.deductionsTotal, 0)
  );
  const totalReimbursements = roundCurrency(
    measurements.reduce((acc, m) => acc + m.totals.reimbursementsTotal, 0)
  );
  const totalNet = roundCurrency(measurements.reduce((acc, m) => acc + m.totals.netPayable, 0));
  const totalSptMeters = roundMeters(
    measurements.reduce((acc, m) => acc + m.totals.sptMeters, 0)
  );
  const totalTradoMeters = roundMeters(
    measurements.reduce((acc, m) => acc + m.totals.tradoMeters, 0)
  );
  const totalRotativaMeters = roundMeters(
    measurements.reduce((acc, m) => acc + m.totals.rotativaMeters, 0)
  );
  const totalMeters = roundMeters(totalSptMeters + totalTradoMeters + totalRotativaMeters);
  const totalDailyUnits = roundMeters(
    measurements.reduce((acc, m) => acc + m.totals.dailyUnits, 0)
  );
  const totalMobilizationKm = roundMeters(
    measurements.reduce((acc, m) => acc + m.totals.mobilizationKm, 0)
  );
  const totalMobilizationValue = roundCurrency(
    measurements.reduce((acc, m) => acc + m.totals.mobilizationValue, 0)
  );
  const mobilizationSharePercent =
    totalGross > 0 ? roundMeters((totalMobilizationValue / totalGross) * 100) : 0;

  let productiveDays = 0;
  let standbyDays = 0;
  let idleDays = 0;
  let maintenanceDays = 0;
  let travelDays = 0;
  let restDays = 0;

  const projectAgg = new Map<
    string,
    {
      projectId: string;
      pastaCode: string;
      clientName: string;
      location: string;
      totalMeters: number;
      dailyUnits: number;
      estimatedCost: number;
      daysCount: number;
    }
  >();

  const projectMap = new Map(dataset.projects.map((p) => [p.id, p]));

  for (const m of measurements) {
    for (const day of m.evaluatedDays) {
      switch (day.entry.status) {
        case 'em_obra':
          productiveDays += 1;
          break;
        case 'parado_diaria':
          standbyDays += 1;
          break;
        case 'em_casa':
          idleDays += 1;
          break;
        case 'manutencao':
          maintenanceDays += 1;
          break;
        case 'mobilizacao':
          travelDays += 1;
          break;
        case 'folga':
          restDays += 1;
          break;
      }

      if (day.entry.projectId) {
        const proj = projectMap.get(day.entry.projectId);
        if (proj) {
          const existing = projectAgg.get(proj.id) ?? {
            projectId: proj.id,
            pastaCode: proj.pastaCode,
            clientName: proj.clientName,
            location: `${proj.city}/${proj.state}`,
            totalMeters: 0,
            dailyUnits: 0,
            estimatedCost: 0,
            daysCount: 0,
          };
          existing.totalMeters = roundMeters(existing.totalMeters + day.totalMeters);
          existing.dailyUnits = roundMeters(existing.dailyUnits + day.dailyUnits);
          existing.estimatedCost = roundCurrency(existing.estimatedCost + day.billedValue);
          existing.daysCount += 1;
          projectAgg.set(proj.id, existing);
        }
      }
    }
  }

  const operationalDays = productiveDays + standbyDays + idleDays + maintenanceDays + travelDays;
  const occupancyRatePercent =
    operationalDays > 0
      ? roundMeters(((productiveDays + travelDays) / operationalDays) * 100)
      : 0;

  const totalTrackedDays =
    productiveDays + standbyDays + idleDays + maintenanceDays + travelDays + restDays;

  const safePercent = (count: number) =>
    operationalDays > 0 ? roundMeters((count / operationalDays) * 100) : 0;

  const fleetOccupancy = {
    productiveDays,
    standbyDays,
    idleDays,
    maintenanceDays,
    travelDays,
    restDays,
    totalTrackedDays,
    items: [
      {
        key: 'produtivo',
        label: 'Produtivo em Obra',
        days: productiveDays + travelDays,
        percent: safePercent(productiveDays + travelDays),
        color: '#1F6E7A',
      },
      {
        key: 'parado',
        label: 'Parado (Cliente / Liberação)',
        days: standbyDays,
        percent: safePercent(standbyDays),
        color: '#C48829',
      },
      {
        key: 'ocioso',
        label: 'Em Casa / Ocioso',
        days: idleDays,
        percent: safePercent(idleDays),
        color: '#8B95A5',
      },
      {
        key: 'manutencao',
        label: 'Manutenção / Veículo',
        days: maintenanceDays,
        percent: safePercent(maintenanceDays),
        color: '#B53D3D',
      },
    ],
  };

  const productionByTeam = measurements
    .map((m) => ({
      teamId: m.team.id,
      teamName: m.team.name,
      sptMeters: m.totals.sptMeters,
      tradoMeters: m.totals.tradoMeters,
      totalMeters: roundMeters(
        m.totals.sptMeters + m.totals.tradoMeters + m.totals.rotativaMeters
      ),
      dailyUnits: m.totals.dailyUnits,
      mobilizationKm: m.totals.mobilizationKm,
      grossValue: m.totals.grossSubtotal,
      netValue: m.totals.netPayable,
    }))
    .sort((a, b) => b.grossValue - a.grossValue);

  const productivityByTeam = measurements.map((m) => {
    const sptDaysList = m.evaluatedDays.filter((d) => d.sptMeters > 0);
    const tradoDaysList = m.evaluatedDays.filter((d) => d.tradoMeters > 0);
    const drillingDaysList = m.evaluatedDays.filter((d) => d.totalMeters > 0);

    const totalSptRaw = sptDaysList.reduce((acc, d) => acc + d.sptMeters, 0);
    const totalTradoRaw = tradoDaysList.reduce((acc, d) => acc + d.tradoMeters, 0);
    const totalAllRaw = drillingDaysList.reduce((acc, d) => acc + d.totalMeters, 0);

    return {
      teamId: m.team.id,
      teamName: m.team.name,
      sptDays: sptDaysList.length,
      sptAvgMetersPerDay:
        sptDaysList.length > 0 ? roundMeters(totalSptRaw / sptDaysList.length) : 0,
      tradoDays: tradoDaysList.length,
      tradoAvgMetersPerDay:
        tradoDaysList.length > 0 ? roundMeters(totalTradoRaw / tradoDaysList.length) : 0,
      overallAvgMetersPerDay:
        drillingDaysList.length > 0 ? roundMeters(totalAllRaw / drillingDaysList.length) : 0,
    };
  });

  const historicalByMonth = new Map<
    string,
    {
      totalMeters: number;
      dailyUnits: number;
      grossValue: number;
      deductionsValue: number;
      netValue: number;
      mobilizationValue: number;
    }
  >();

  for (const h of dataset.historicalSummaries) {
    if (h.referenceMonth === referenceMonth) continue;
    const prev = historicalByMonth.get(h.referenceMonth) ?? {
      totalMeters: 0,
      dailyUnits: 0,
      grossValue: 0,
      deductionsValue: 0,
      netValue: 0,
      mobilizationValue: 0,
    };
    prev.totalMeters = roundMeters(
      prev.totalMeters + h.sptMeters + h.tradoMeters + h.rotativaMeters
    );
    prev.dailyUnits = roundMeters(prev.dailyUnits + h.dailyUnits);
    prev.grossValue = roundCurrency(prev.grossValue + h.grossValue);
    prev.deductionsValue = roundCurrency(prev.deductionsValue + h.deductionsValue);
    prev.netValue = roundCurrency(prev.netValue + h.netValue);
    prev.mobilizationValue = roundCurrency(prev.mobilizationValue + h.mobilizationValue);
    historicalByMonth.set(h.referenceMonth, prev);
  }

  historicalByMonth.set(referenceMonth, {
    totalMeters,
    dailyUnits: totalDailyUnits,
    grossValue: totalGross,
    deductionsValue: totalDeductions,
    netValue: totalNet,
    mobilizationValue: totalMobilizationValue,
  });

  const semestralEvolution = Array.from(historicalByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      referenceMonth: month,
      label: formatMonthShortPT(month),
      totalMeters: data.totalMeters,
      dailyUnits: data.dailyUnits,
      grossValue: data.grossValue,
      deductionsValue: data.deductionsValue,
      netValue: data.netValue,
      mobilizationValue: data.mobilizationValue,
      mobilizationSharePercent:
        data.grossValue > 0 ? roundMeters((data.mobilizationValue / data.grossValue) * 100) : 0,
    }));

  return {
    referenceMonth,
    kpis: {
      totalGross,
      totalDeductions,
      totalReimbursements,
      totalNet,
      totalMeters,
      totalSptMeters,
      totalTradoMeters,
      totalDailyUnits,
      totalMobilizationKm,
      mobilizationSharePercent,
      occupancyRatePercent,
      activeTeamsCount: activeTeams.length,
    },
    productionByTeam,
    semestralEvolution,
    fleetOccupancy,
    productivityByTeam,
    costByProject: Array.from(projectAgg.values()).sort(
      (a, b) => b.estimatedCost - a.estimatedCost
    ),
    measurements,
  };
}
