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
  includeLegalRep: boolean;
  onToggleLegalRep: (checked: boolean) => void;
  onSelectTeamForMeasurement: (teamId: string) => void;
  onSelectTeamForDiary: (teamId: string) => void;
}

export function ExecutiveOverview({
  analytics,
  includeLegalRep,
  onToggleLegalRep,
  onSelectTeamForMeasurement,
  onSelectTeamForDiary,
}: ExecutiveOverviewProps) {
  const monthLabel = formatMonthYearPT(analytics.referenceMonth);

  const productionOptions = useMemo<ApexOptions>(
    () => ({
      colors: ['#1F6E7A', '#C48829'],
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '52%',
        },
      },
      dataLabels: { enabled: false },
      stroke: { width: [0, 0] },
      grid: {
        borderColor: 'rgba(24, 27, 32, 0.07)',
        strokeDashArray: 4,
      },
      xaxis: {
        categories: analytics.productionByTeam.map((t) => t.teamName),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#525B68', fontSize: '12px' } },
      },
      yaxis: [
        {
          title: { text: 'Metros (m)', style: { color: '#525B68', fontWeight: 500 } },
          labels: {
            style: { colors: '#525B68', fontSize: '11px' },
            formatter: (v) => `${Math.round(v)} m`,
          },
        },
        {
          opposite: true,
          title: { text: 'Diárias (unid)', style: { color: '#C48829', fontWeight: 500 } },
          labels: {
            style: { colors: '#525B68', fontSize: '11px' },
            formatter: (v) => `${v.toFixed(1)}`,
          },
        },
      ],
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        labels: { colors: '#525B68' },
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (val, opts) =>
            opts.seriesIndex === 0 ? `${formatDecimalBR(val)} m` : `${formatDecimalBR(val)} diárias`,
        },
      },
    }),
    [analytics.productionByTeam]
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
      labels: analytics.fleetOccupancy.items.map((i) => i.label),
      colors: analytics.fleetOccupancy.items.map((i) => i.color),
      stroke: { width: 2, colors: ['#FFFFFF'] },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: { color: '#525B68', fontSize: '12px' },
              value: {
                color: '#181B20',
                fontSize: '20px',
                fontWeight: 600,
                formatter: (val) => `${val}d`,
              },
              total: {
                show: true,
                label: 'Ocupação',
                color: '#525B68',
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
        labels: { colors: '#525B68' },
      },
      tooltip: {
        y: {
          formatter: (val) => `${val} dias registrados`,
        },
      },
    }),
    [analytics.fleetOccupancy.items, analytics.kpis.occupancyRatePercent]
  );

  const occupancySeries = useMemo(
    () => analytics.fleetOccupancy.items.map((i) => i.days),
    [analytics.fleetOccupancy.items]
  );

  const financialOptions = useMemo<ApexOptions>(
    () => ({
      colors: ['#1F6E7A', '#1E7A56', '#C48829'],
      stroke: { width: [0, 0, 2.5], curve: 'smooth' },
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: '46%',
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: 'rgba(24, 27, 32, 0.07)',
        strokeDashArray: 4,
      },
      xaxis: {
        categories: analytics.semestralEvolution.map((m) => m.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#525B68', fontSize: '12px' } },
      },
      yaxis: [
        {
          title: { text: 'Valores (R$)', style: { color: '#525B68', fontWeight: 500 } },
          labels: {
            style: { colors: '#525B68', fontSize: '11px' },
            formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k`,
          },
        },
        {
          opposite: true,
          max: 45,
          title: { text: 'Peso Mob. (%)', style: { color: '#C48829', fontWeight: 500 } },
          labels: {
            style: { colors: '#C48829', fontSize: '11px' },
            formatter: (v) => `${v.toFixed(0)}%`,
          },
        },
      ],
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        labels: { colors: '#525B68' },
      },
      tooltip: {
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
    [analytics.semestralEvolution]
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
      colors: ['#1F6E7A', '#649BA3'],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 5,
          barHeight: '58%',
        },
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '11px', colors: ['#181B20'] },
        offsetX: 6,
        formatter: (v) => (Number(v) > 0 ? `${formatDecimalBR(Number(v), 1)} m/d` : ''),
      },
      grid: {
        borderColor: 'rgba(24, 27, 32, 0.07)',
        strokeDashArray: 4,
      },
      xaxis: {
        categories: analytics.productivityByTeam.map((p) => p.teamName),
        labels: { style: { colors: '#525B68', fontSize: '11px' } },
      },
      yaxis: {
        labels: { style: { colors: '#181B20', fontSize: '12px', fontWeight: 500 } },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        labels: { colors: '#525B68' },
      },
      tooltip: {
        y: {
          formatter: (v) => `${formatDecimalBR(v)} m/dia`,
        },
      },
    }),
    [analytics.productivityByTeam]
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
          <p className="text-xs font-medium tracking-wider uppercase text-[#1F6E7A]">
            Painel Executivo · {monthLabel}
          </p>
          <h1 className="mt-0.5 text-2xl font-light tracking-tight text-[#181B20]">
            Inteligência Operacional & Medições
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="glass-panel inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#525B68]">
            <input
              type="checkbox"
              checked={includeLegalRep}
              onChange={(e) => onToggleLegalRep(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-[#1F6E7A]"
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
            <span className="text-xs font-medium text-[#525B68]">Medição Bruta</span>
            <TrendingUp className="h-4 w-4 text-[#1F6E7A]" strokeWidth={1.5} />
          </div>
          <p className="tabular-nums mt-2.5 text-2xl font-light tracking-tight text-[#181B20]">
            {formatCurrencyBRL(analytics.kpis.totalGross)}
          </p>
          <p className="mt-1.5 text-xs text-[#525B68]">
            Mobilização:{' '}
            <span className="tabular-nums font-medium text-[#C48829]">
              {formatDecimalBR(analytics.kpis.mobilizationSharePercent, 1)}%
            </span>{' '}
            do bruto
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#525B68]">Líquido a Pagar</span>
            <FileSpreadsheet className="h-4 w-4 text-[#1E7A56]" strokeWidth={1.5} />
          </div>
          <p className="tabular-nums mt-2.5 text-2xl font-light tracking-tight text-[#181B20]">
            {formatCurrencyBRL(analytics.kpis.totalNet)}
          </p>
          <p className="mt-1.5 text-xs text-[#525B68]">
            Descontos:{' '}
            <span className="tabular-nums font-medium text-[#181B20]">
              {formatCurrencyBRL(analytics.kpis.totalDeductions)}
            </span>
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#525B68]">Produção de Campo</span>
            <Layers className="h-4 w-4 text-[#1F6E7A]" strokeWidth={1.5} />
          </div>
          <p className="tabular-nums mt-2.5 text-2xl font-light tracking-tight text-[#181B20]">
            {formatDecimalBR(analytics.kpis.totalMeters)} <span className="text-base text-[#525B68]">m</span>
          </p>
          <p className="tabular-nums mt-1.5 text-xs text-[#525B68]">
            {formatDecimalBR(analytics.kpis.totalDailyUnits)} diárias ·{' '}
            {formatDecimalBR(analytics.kpis.totalMobilizationKm, 0)} km
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#525B68]">Ocupação da Frota</span>
            <Gauge className="h-4 w-4 text-[#C48829]" strokeWidth={1.5} />
          </div>
          <p className="tabular-nums mt-2.5 text-2xl font-light tracking-tight text-[#181B20]">
            {formatDecimalBR(analytics.kpis.occupancyRatePercent, 1)}%
          </p>
          <p className="tabular-nums mt-1.5 text-xs text-[#525B68]">
            {analytics.fleetOccupancy.productiveDays + analytics.fleetOccupancy.travelDays}d produtivos ·{' '}
            {analytics.fleetOccupancy.idleDays}d em casa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="glass-panel rounded-2xl p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-[#181B20]">Produção por Equipe</h2>
              <p className="text-xs text-[#7C8594]">Metros perfurados vs. diárias faturadas em {monthLabel}</p>
            </div>
            <Activity className="h-4 w-4 text-[#7C8594]" strokeWidth={1.5} />
          </div>
          <ApexChart options={productionOptions} series={productionSeries} type="bar" height={280} />
        </section>

        <section className="glass-panel rounded-2xl p-5 lg:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-[#181B20]">Taxa de Ocupação da Frota</h2>
              <p className="text-xs text-[#7C8594]">Produtivo vs. Parado Cliente vs. Em Casa vs. Manutenção</p>
            </div>
            <Compass className="h-4 w-4 text-[#7C8594]" strokeWidth={1.5} />
          </div>
          <ApexChart options={occupancyOptions} series={occupancySeries} type="donut" height={280} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="glass-panel rounded-2xl p-5 lg:col-span-7">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-[#181B20]">
              Financeiro Consolidado & Evolução Semestral
            </h2>
            <p className="text-xs text-[#7C8594]">
              Comparativo Bruto vs. Líquido e peso percentual da mobilização nos últimos 6 meses
            </p>
          </div>
          <ApexChart options={financialOptions} series={financialSeries} type="line" height={280} />
        </section>

        <section className="glass-panel rounded-2xl p-5 lg:col-span-5">
          <div className="mb-3">
            <h2 className="text-sm font-medium text-[#181B20]">
              Produtividade Média (m/dia) por Sondagem
            </h2>
            <p className="text-xs text-[#7C8594]">Rendimento médio diário em SPT e Trado por equipe</p>
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
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-[#181B20]">
              Termômetro de Produção em Tempo Real — {monthLabel}
            </h2>
            <p className="text-xs text-[#7C8594]">
              Acompanhamento acumulado por equipe para consulta imediata no campo ou em reunião
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {analytics.measurements.map((m) => (
            <div
              key={m.team.id}
              className="rounded-xl border border-[#181B20]/8 bg-white/75 p-4 transition hover:border-[#1F6E7A]/35 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#181B20]">{m.team.name}</h3>
                  <p className="text-[11px] text-[#7C8594]">{m.locationsSummary}</p>
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

              <div className="mt-3 grid grid-cols-3 gap-2 border-y border-[#181B20]/6 py-2.5 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#7C8594]">Metros</p>
                  <p className="tabular-nums text-sm font-medium text-[#181B20]">
                    {formatDecimalBR(m.totals.sptMeters + m.totals.tradoMeters + m.totals.rotativaMeters)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#7C8594]">Diárias</p>
                  <p className="tabular-nums text-sm font-medium text-[#181B20]">
                    {formatDecimalBR(m.totals.dailyUnits)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#7C8594]">Mobiliz.</p>
                  <p className="tabular-nums text-sm font-medium text-[#181B20]">
                    {formatDecimalBR(m.totals.mobilizationKm, 0)} km
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#7C8594]">Líquido Estimado</p>
                  <p className="tabular-nums text-base font-semibold text-[#181B20]">
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
                    className="inline-flex items-center gap-1 rounded-xl bg-[#1F6E7A]/10 px-2.5 py-1.5 text-xs font-medium text-[#1F6E7A] transition hover:bg-[#1F6E7A]/18"
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
}
