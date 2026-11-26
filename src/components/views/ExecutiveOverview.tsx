'use client';

import React, { useMemo } from 'react';
import {
  Activity,
  ArrowUpRight,
  Compass,
  Download,
  FileSpreadsheet,
  Gauge,
  Layers,
  TrendingUp,
} from 'lucide-react';
import type { ApexOptions } from 'apexcharts';
import type { ExecutiveAnalytics } from '@/domain/analytics';
import {
  formatCurrencyBRL,
  formatDecimalBR,
  formatMonthYearPT,
} from '@/domain/formatters';
import { ApexChart } from '@/components/ui/ApexChart';

interface ExecutiveOverviewProps {
  analytics: ExecutiveAnalytics;
  isDark: boolean;
  includeLegalRep: boolean;
  onToggleLegalRep: (checked: boolean) => void;
  onSelectTeamForMeasurement: (teamId: string) => void;
  onSelectTeamForDiary: (teamId: string) => void;
}

export const ExecutiveOverview = React.memo(function ExecutiveOverview({
  analytics,
  isDark,
  includeLegalRep,
  onToggleLegalRep,
  onSelectTeamForMeasurement,
  onSelectTeamForDiary,
}: ExecutiveOverviewProps) {
  const monthLabel = formatMonthYearPT(analytics.referenceMonth);

  const chartPalette = useMemo(
    () => ({
      teal: isDark ? '#339DAA' : '#1F6E7A',
      tealSoft: isDark ? '#68BBC5' : '#649BA3',
      ochre: isDark ? '#E0A94B' : '#C48829',
      green: isDark ? '#3FB984' : '#1E7A56',
      ink: isDark ? '#EFF3F7' : '#181B20',
      label: isDark ? '#9AA5B4' : '#525B68',
      grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(24, 27, 32, 0.07)',
      donutStroke: isDark ? '#171C24' : '#FFFFFF',
      tooltipTheme: isDark ? ('dark' as const) : ('light' as const),
    }),
    [isDark]
  );

  const productionOptions = useMemo<ApexOptions>(
    () => ({
      theme: { mode: chartPalette.tooltipTheme },
      colors: [chartPalette.teal, chartPalette.ochre],
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '52%',
        },
      },
      dataLabels: { enabled: false },
      stroke: { width: [0, 0] },
      grid: {
        borderColor: chartPalette.grid,
        strokeDashArray: 4,
      },
      xaxis: {
        categories: analytics.productionByTeam.map((t) => t.teamName),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: chartPalette.label, fontSize: '12px' } },
      },
      yaxis: [
        {
          title: { text: 'Metros (m)', style: { color: chartPalette.label, fontWeight: 500 } },
          labels: {
            style: { colors: chartPalette.label, fontSize: '11px' },
            formatter: (v) => `${Math.round(v)} m`,
          },
        },
        {
          opposite: true,
          title: { text: 'Diárias (unid)', style: { color: chartPalette.ochre, fontWeight: 500 } },
          labels: {
            style: { colors: chartPalette.label, fontSize: '11px' },
            formatter: (v) => `${v.toFixed(1)}`,
          },
        },
      ],
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        labels: { colors: chartPalette.label },
      },
      tooltip: {
        theme: chartPalette.tooltipTheme,
        y: {
          formatter: (val, opts) =>
            opts.seriesIndex === 0
              ? `${formatDecimalBR(val)} m`
              : `${formatDecimalBR(val)} diárias`,
        },
      },
    }),
    [analytics.productionByTeam, chartPalette]
  );

  const productionSeries = useMemo(
    () => [
      {
        name: 'Metros Perfurados',
        data: analytics.productionByTeam.map((t) => t.totalMeters),
      },
      {
        name: 'Diárias de Campo',
        data: analytics.productionByTeam.map((t) => t.dailyUnits),
      },
    ],
    [analytics.productionByTeam]
  );

  const occupancyOptions = useMemo<ApexOptions>(
    () => ({
      theme: { mode: chartPalette.tooltipTheme },
      labels: analytics.fleetOccupancy.items.map((i) => i.label),
      colors: isDark
        ? ['#339DAA', '#E0A94B', '#798596', '#E06C6C']
        : analytics.fleetOccupancy.items.map((i) => i.color),
      stroke: { width: 2, colors: [chartPalette.donutStroke] },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: { color: chartPalette.label, fontSize: '12px' },
              value: {
                color: chartPalette.ink,
                fontSize: '20px',
                fontWeight: 600,
                formatter: (val) => `${val}d`,
              },
              total: {
                show: true,
                label: 'Ocupação',
                color: chartPalette.label,
                fontSize: '12px',
                formatter: () => `${formatDecimalBR(analytics.kpis.occupancyRatePercent, 1)}%`,
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      legend: {
        position: 'bottom',
        fontSize: '12px',
        labels: { colors: chartPalette.label },
      },
      tooltip: {
        theme: chartPalette.tooltipTheme,
        y: {
          formatter: (val) => `${val} dias registrados`,
        },
      },
    }),
    [analytics.fleetOccupancy.items, analytics.kpis.occupancyRatePercent, chartPalette, isDark]
  );

  const occupancySeries = useMemo(
    () => analytics.fleetOccupancy.items.map((i) => i.days),
    [analytics.fleetOccupancy.items]
  );

  const financialOptions = useMemo<ApexOptions>(
    () => ({
      theme: { mode: chartPalette.tooltipTheme },
      colors: [chartPalette.teal, chartPalette.green, chartPalette.ochre],
      stroke: { width: [0, 0, 2.5], curve: 'smooth' },
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: '46%',
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: chartPalette.grid,
        strokeDashArray: 4,
      },
      xaxis: {
        categories: analytics.semestralEvolution.map((m) => m.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: chartPalette.label, fontSize: '12px' } },
      },
      yaxis: [
        {
          title: { text: 'Valores (R$)', style: { color: chartPalette.label, fontWeight: 500 } },
          labels: {
            style: { colors: chartPalette.label, fontSize: '11px' },
            formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k`,
          },
        },
        {
          opposite: true,
          max: 45,
          title: { text: 'Peso Mob. (%)', style: { color: chartPalette.ochre, fontWeight: 500 } },
          labels: {
            style: { colors: chartPalette.ochre, fontSize: '11px' },
            formatter: (v) => `${v.toFixed(0)}%`,
          },
        },
      ],
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        labels: { colors: chartPalette.label },
      },
      tooltip: {
        theme: chartPalette.tooltipTheme,
        shared: true,
        intersect: false,
        y: {
          formatter: (val, opts) =>
            opts.seriesIndex === 2
              ? `${formatDecimalBR(val, 1)}% do bruto`
              : formatCurrencyBRL(val),
        },
      },
    }),
    [analytics.semestralEvolution, chartPalette]
  );

  const financialSeries = useMemo(
    () => [
      {
        name: 'Bruto Consolidado',
        type: 'column',
        data: analytics.semestralEvolution.map((m) => m.grossValue),
      },
      {
        name: 'Líquido Pago',
        type: 'column',
        data: analytics.semestralEvolution.map((m) => m.netValue),
      },
      {
        name: 'Peso Mobilização (%)',
        type: 'line',
        data: analytics.semestralEvolution.map((m) => m.mobilizationSharePercent),
      },
    ],
    [analytics.semestralEvolution]
  );

  const productivityOptions = useMemo<ApexOptions>(
    () => ({
      theme: { mode: chartPalette.tooltipTheme },
      colors: [chartPalette.teal, chartPalette.tealSoft],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 5,
          barHeight: '58%',
        },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '11px', colors: [chartPalette.ink] },
        offsetX: 6,
        formatter: (v) => (Number(v) > 0 ? `${formatDecimalBR(Number(v), 1)} m/d` : ''),
      },
      grid: {
        borderColor: chartPalette.grid,
        strokeDashArray: 4,
      },
      xaxis: {
        categories: analytics.productivityByTeam.map((p) => p.teamName),
        labels: { style: { colors: chartPalette.label, fontSize: '11px' } },
      },
      yaxis: {
        labels: { style: { colors: chartPalette.ink, fontSize: '12px', fontWeight: 500 } },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        labels: { colors: chartPalette.label },
      },
      tooltip: {
        theme: chartPalette.tooltipTheme,
        y: {
          formatter: (v) => `${formatDecimalBR(v)} m/dia`,
        },
      },
    }),
    [analytics.productivityByTeam, chartPalette]
  );

  const productivitySeries = useMemo(
    () => [
      {
        name: 'SPT (m/dia)',
        data: analytics.productivityByTeam.map((p) => p.sptAvgMetersPerDay),
      },
      {
        name: 'Trado (m/dia)',
        data: analytics.productivityByTeam.map((p) => p.tradoAvgMetersPerDay),
      },
    ],
    [analytics.productivityByTeam]
  );

  const nbrPdfUrl = `/api/pdf/relatorio-nbr?month=${encodeURIComponent(analytics.referenceMonth)}&includeLegalRep=${includeLegalRep ? 'true' : 'false'}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wider uppercase text-[var(--accent-mineral)]">
            Painel Executivo · {monthLabel}
          </p>
          <h1 className="mt-0.5 text-2xl font-light tracking-tight text-[var(--ink-primary)]">
            Inteligência Operacional & Medições
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="glass-panel inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--ink-secondary)]">
            <input
              type="checkbox"
              checked={includeLegalRep}
              onChange={(e) => onToggleLegalRep(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-[var(--accent-mineral)]"
            />
            <span>Assinatura Eng. Damiana</span>
          </label>

          <a
            href={nbrPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="download-nbr-pdf"
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm"
          >
            <Download className="h-4 w-4" strokeWidth={1.6} />
            <span>Baixar Relatório NBR (PDF)</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--ink-secondary)]">Medição Bruta</span>
            <TrendingUp className="h-4 w-4 text-[var(--accent-mineral)]" strokeWidth={1.5} />
          </div>
          <p className="tabular-nums mt-2.5 text-2xl font-light tracking-tight text-[var(--ink-primary)]">
            {formatCurrencyBRL(analytics.kpis.totalGross)}
          </p>
          <p className="mt-1.5 text-xs text-[var(--ink-secondary)]">
            Mobilização:{' '}
            <span className="tabular-nums font-medium text-[var(--accent-ochre)]">
              {formatDecimalBR(analytics.kpis.mobilizationSharePercent, 1)}%
            </span>{' '}
            do bruto
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--ink-secondary)]">Líquido a Pagar</span>
            <FileSpreadsheet className="h-4 w-4 text-[var(--status-meter)]" strokeWidth={1.5} />
          </div>
          <p className="tabular-nums mt-2.5 text-2xl font-light tracking-tight text-[var(--ink-primary)]">
            {formatCurrencyBRL(analytics.kpis.totalNet)}
          </p>
          <p className="mt-1.5 text-xs text-[var(--ink-secondary)]">
            Descontos:{' '}
            <span className="tabular-nums font-medium text-[var(--ink-primary)]">
              {formatCurrencyBRL(analytics.kpis.totalDeductions)}
            </span>
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--ink-secondary)]">Produção de Campo</span>
            <Layers className="h-4 w-4 text-[var(--accent-mineral)]" strokeWidth={1.5} />
          </div>
          <p className="tabular-nums mt-2.5 text-2xl font-light tracking-tight text-[var(--ink-primary)]">
            {formatDecimalBR(analytics.kpis.totalMeters)}{' '}
            <span className="text-base text-[var(--ink-secondary)]">m</span>
          </p>
          <p className="tabular-nums mt-1.5 text-xs text-[var(--ink-secondary)]">
            {formatDecimalBR(analytics.kpis.totalDailyUnits)} diárias ·{' '}
            {formatDecimalBR(analytics.kpis.totalMobilizationKm, 0)} km
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--ink-secondary)]">Ocupação da Frota</span>
            <Gauge className="h-4 w-4 text-[var(--accent-ochre)]" strokeWidth={1.5} />
          </div>
          <p className="tabular-nums mt-2.5 text-2xl font-light tracking-tight text-[var(--ink-primary)]">
            {formatDecimalBR(analytics.kpis.occupancyRatePercent, 1)}%
          </p>
          <p className="tabular-nums mt-1.5 text-xs text-[var(--ink-secondary)]">
            {analytics.fleetOccupancy.productiveDays + analytics.fleetOccupancy.travelDays}d produtivos ·{' '}
            {analytics.fleetOccupancy.idleDays}d em casa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="glass-panel rounded-2xl p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-[var(--ink-primary)]">Produção por Equipe</h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Metros perfurados vs. diárias faturadas em {monthLabel}
              </p>
            </div>
            <Activity className="h-4 w-4 text-[var(--ink-muted)]" strokeWidth={1.5} />
          </div>
          <ApexChart options={productionOptions} series={productionSeries} type="bar" height={280} />
        </section>

        <section className="glass-panel rounded-2xl p-5 lg:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-[var(--ink-primary)]">
                Taxa de Ocupação da Frota
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Produtivo vs. Parado Cliente vs. Em Casa vs. Manutenção
              </p>
            </div>
            <Compass className="h-4 w-4 text-[var(--ink-muted)]" strokeWidth={1.5} />
          </div>
          <ApexChart options={occupancyOptions} series={occupancySeries} type="donut" height={280} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="glass-panel rounded-2xl p-5 lg:col-span-7">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-[var(--ink-primary)]">
              Financeiro Consolidado & Evolução Semestral
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Comparativo Bruto vs. Líquido e peso percentual da mobilização nos últimos 6 meses
            </p>
          </div>
          <ApexChart options={financialOptions} series={financialSeries} type="line" height={280} />
        </section>

        <section className="glass-panel rounded-2xl p-5 lg:col-span-5">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-[var(--ink-primary)]">
              Produtividade Média (m/dia) por Sondagem
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Rendimento médio diário em SPT e Trado por equipe
            </p>
          </div>
          <ApexChart
            options={productivityOptions}
            series={productivitySeries}
            type="bar"
            height={280}
          />
        </section>
      </div>

      <section className="glass-panel rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="text-sm font-medium text-[var(--ink-primary)]">
            Termômetro de Produção em Tempo Real — {monthLabel}
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Acompanhamento acumulado por equipe para consulta imediata no campo ou em reunião
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {analytics.measurements.map((m) => (
            <div key={m.team.id} className="surface-card-inner rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--ink-primary)]">{m.team.name}</h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">{m.locationsSummary}</p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
                  style={{
                    backgroundColor:
                      m.status === 'fechada' || m.status === 'paga'
                        ? 'var(--status-meter-soft)'
                        : 'var(--accent-mineral-soft)',
                    color:
                      m.status === 'fechada' || m.status === 'paga'
                        ? 'var(--status-meter)'
                        : 'var(--accent-mineral)',
                  }}
                >
                  {m.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-y border-[var(--border-hairline)] py-2.5 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                    Metros
                  </p>
                  <p className="tabular-nums text-sm font-medium text-[var(--ink-primary)]">
                    {formatDecimalBR(
                      m.totals.sptMeters + m.totals.tradoMeters + m.totals.rotativaMeters
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                    Diárias
                  </p>
                  <p className="tabular-nums text-sm font-medium text-[var(--ink-primary)]">
                    {formatDecimalBR(m.totals.dailyUnits)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                    Mobiliz.
                  </p>
                  <p className="tabular-nums text-sm font-medium text-[var(--ink-primary)]">
                    {formatDecimalBR(m.totals.mobilizationKm, 0)} km
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                    Líquido Estimado
                  </p>
                  <p className="tabular-nums text-base font-semibold text-[var(--ink-primary)]">
                    {formatCurrencyBRL(m.totals.netPayable)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectTeamForDiary(m.team.id)}
                    className="btn-secondary px-2.5 py-1.5 text-xs"
                  >
                    Diário
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTeamForMeasurement(m.team.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent-mineral-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--accent-mineral)] transition hover:opacity-85"
                  >
                    <span>Boletim</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
});
