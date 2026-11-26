'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { calculateMeasurement, evaluateDailyEntry } from '@/domain/billing-engine';
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDecimalBR,
  formatMonthYearPT,
  getMonthDateBounds,
} from '@/domain/formatters';
import type {
  AssetFinancing,
  BillingMode,
  BoreholeRecord,
  BoreholeType,
  DailyEntry,
  FieldActivityType,
  FieldDayStatus,
  FinancialAdjustment,
  MobilizationRecord,
  Project,
  Team,
} from '@/domain/types';

interface FieldDiaryViewProps {
  teams: Team[];
  projects: Project[];
  entries: DailyEntry[];
  mobilizations: MobilizationRecord[];
  adjustments: FinancialAdjustment[];
  financings: AssetFinancing[];
  referenceMonth: string;
  selectedTeamId: string;
  onSelectTeamId: (id: string) => void;
  onSaveEntry: (entry: Omit<DailyEntry, 'id'> & { id?: string }) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

const STATUS_META: Record<
  FieldDayStatus,
  { label: string; badgeBg: string; badgeColor: string; dotColor: string }
> = {
  em_obra: {
    label: 'Em Obra',
    badgeBg: 'var(--status-meter-soft)',
    badgeColor: 'var(--status-meter)',
    dotColor: 'var(--status-meter)',
  },
  mobilizacao: {
    label: 'Mobilização / Viagem',
    badgeBg: 'var(--status-daily-soft)',
    badgeColor: 'var(--status-daily)',
    dotColor: 'var(--status-daily)',
  },
  parado_diaria: {
    label: 'Parado c/ Diária',
    badgeBg: 'var(--status-standby-soft)',
    badgeColor: 'var(--status-standby)',
    dotColor: 'var(--status-standby)',
  },
  em_casa: {
    label: 'Em Casa / Ocioso',
    badgeBg: 'var(--status-idle-soft)',
    badgeColor: 'var(--status-idle)',
    dotColor: 'var(--status-idle)',
  },
  folga: {
    label: 'Domingo / Feriado',
    badgeBg: 'var(--surface-chip)',
    badgeColor: 'var(--ink-muted)',
    dotColor: 'var(--ink-muted)',
  },
  manutencao: {
    label: 'Manutenção',
    badgeBg: 'var(--status-danger-soft)',
    badgeColor: 'var(--status-danger)',
    dotColor: 'var(--status-danger)',
  },
};

export const FieldDiaryView = React.memo(function FieldDiaryView({
  teams,
  projects,
  entries,
  mobilizations,
  adjustments,
  financings,
  referenceMonth,
  selectedTeamId,
  onSelectTeamId,
  onSaveEntry,
  onDeleteEntry,
}: FieldDiaryViewProps) {
  const team = teams.find((t) => t.id === selectedTeamId) ?? teams[0]!;
  const financing = financings.find((f) => f.teamId === team.id && f.active) ?? null;

  const calculation = useMemo(
    () =>
      calculateMeasurement({
        team,
        referenceMonth,
        entries,
        mobilizations,
        adjustments,
        projects,
        financing,
      }),
    [team, referenceMonth, entries, mobilizations, adjustments, projects, financing]
  );

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const entryByDate = useMemo(() => {
    const map = new Map<string, (typeof calculation.evaluatedDays)[number]>();
    for (const d of calculation.evaluatedDays) {
      map.set(d.entry.date, d);
    }
    return map;
  }, [calculation.evaluatedDays]);

  const { daysInMonth } = getMonthDateBounds(referenceMonth);
  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, idx) => {
      const dayNum = idx + 1;
      const dateStr = `${referenceMonth}-${String(dayNum).padStart(2, '0')}`;
      return { dayNum, dateStr, evaluated: entryByDate.get(dateStr) ?? null };
    });
  }, [daysInMonth, referenceMonth, entryByDate]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(`${referenceMonth}-01`);
  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<FieldDayStatus>('em_obra');
  const [activityType, setActivityType] = useState<FieldActivityType>('spt');
  const [holes, setHoles] = useState<BoreholeRecord[]>([]);
  const [testDescription, setTestDescription] = useState('');
  const [usesSptEquipment, setUsesSptEquipment] = useState(false);
  const [billingOverride, setBillingOverride] = useState<BillingMode>('auto');
  const [overrideReason, setOverrideReason] = useState('');
  const [notes, setNotes] = useState('');

  const [newHoleCode, setNewHoleCode] = useState('SP-01');
  const [newHoleType, setNewHoleType] = useState<BoreholeType>('spt');
  const [newHoleDepth, setNewHoleDepth] = useState('');

  function openDrawerForDate(targetDate: string) {
    const existing = entryByDate.get(targetDate)?.entry;
    if (existing) {
      setEditingId(existing.id);
      setDate(existing.date);
      setProjectId(existing.projectId ?? '');
      setStatus(existing.status);
      setActivityType(existing.activityType);
      setHoles(existing.holes);
      setTestDescription(existing.testDescription ?? '');
      setUsesSptEquipment(existing.usesSptEquipment);
      setBillingOverride(existing.billingOverride);
      setOverrideReason(existing.overrideReason ?? '');
      setNotes(existing.notes ?? '');
    } else {
      setEditingId(undefined);
      setDate(targetDate);
      setProjectId(projects[0]?.id ?? '');
      setStatus('em_obra');
      setActivityType('spt');
      setHoles([]);
      setTestDescription('');
      setUsesSptEquipment(team.percentualDescontoEquipSpt > 0);
      setBillingOverride('auto');
      setOverrideReason('');
      setNotes('');
    }
    setNewHoleCode('SP-01');
    setNewHoleDepth('');
    setDrawerOpen(true);
  }

  function handleAddHole() {
    const parsedDepth = Number(newHoleDepth.replace(',', '.'));
    if (!newHoleCode.trim() || !Number.isFinite(parsedDepth) || parsedDepth <= 0) return;
    setHoles((prev) => [
      ...prev,
      {
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: newHoleCode.trim().toUpperCase(),
        type: newHoleType,
        depthMeters: parsedDepth,
      },
    ]);
    const match = newHoleCode.match(/^([A-Za-z-]+)(\d+)$/);
    if (match) {
      const nextNum = String(Number(match[2]) + 1).padStart(match[2]!.length, '0');
      setNewHoleCode(`${match[1]}${nextNum}`);
    }
    setNewHoleDepth('');
  }

  const livePreview = useMemo(() => {
    const draft: DailyEntry = {
      id: editingId ?? 'draft',
      teamId: team.id,
      date,
      projectId: projectId || null,
      status,
      activityType,
      holes,
      testDescription: testDescription.trim() || null,
      usesSptEquipment,
      billingOverride,
      overrideReason: overrideReason.trim() || null,
      notes: notes.trim() || null,
    };
    return evaluateDailyEntry(draft, team);
  }, [
    editingId,
    team,
    date,
    projectId,
    status,
    activityType,
    holes,
    testDescription,
    usesSptEquipment,
    billingOverride,
    overrideReason,
    notes,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveEntry({
        id: editingId,
        teamId: team.id,
        date,
        projectId: projectId || null,
        status,
        activityType,
        holes,
        testDescription: testDescription.trim() || null,
        usesSptEquipment,
        billingOverride,
        overrideReason: overrideReason.trim() || null,
        notes: notes.trim() || null,
      });
      setDrawerOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wider uppercase text-[var(--accent-mineral)]">
            Diário de Campo · {formatMonthYearPT(referenceMonth)}
          </p>
          <h1 className="mt-0.5 text-2xl font-light tracking-tight text-[var(--ink-primary)]">
            Controle Diário das Equipes
          </h1>
        </div>

        <button
          type="button"
          data-testid="new-daily-entry-btn"
          onClick={() => openDrawerForDate(`${referenceMonth}-15`)}
          className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          <span>Apontar Dia</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {teams.map((t) => {
          const active = t.id === team.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTeamId(t.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-medium transition ${
                active
                  ? 'bg-[var(--accent-mineral)] text-white shadow-xs'
                  : 'glass-panel text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[11px] text-[var(--ink-muted)]">Metros Faturados</p>
          <p className="tabular-nums mt-1 text-xl font-light text-[var(--ink-primary)]">
            {formatDecimalBR(
              calculation.totals.sptMeters +
                calculation.totals.tradoMeters +
                calculation.totals.rotativaMeters
            )}{' '}
            <span className="text-xs text-[var(--ink-muted)]">m</span>
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[11px] text-[var(--ink-muted)]">Diárias Acumuladas</p>
          <p className="tabular-nums mt-1 text-xl font-light text-[var(--ink-primary)]">
            {formatDecimalBR(calculation.totals.dailyUnits)}{' '}
            <span className="text-xs text-[var(--ink-muted)]">unid</span>
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[11px] text-[var(--ink-muted)]">Mobilização</p>
          <p className="tabular-nums mt-1 text-xl font-light text-[var(--ink-primary)]">
            {formatDecimalBR(calculation.totals.mobilizationKm, 0)}{' '}
            <span className="text-xs text-[var(--ink-muted)]">km</span>
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[11px] text-[var(--ink-muted)]">Bruto Parcial</p>
          <p className="tabular-nums mt-1 text-xl font-medium text-[var(--accent-mineral)]">
            {formatCurrencyBRL(calculation.totals.grossSubtotal)}
          </p>
        </div>
        <div className="glass-panel col-span-2 rounded-2xl p-4 lg:col-span-1">
          <p className="text-[11px] text-[var(--ink-muted)]">Cobertura do Mês</p>
          <p className="tabular-nums mt-1 text-sm font-medium text-[var(--ink-primary)]">
            {calculation.totals.daysWithEntries} dias lançados
          </p>
          {calculation.totals.missingDaysCount > 0 && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--accent-ochre)]">
              <AlertCircle className="h-3 w-3" />
              {calculation.totals.missingDaysCount} sem registro
            </p>
          )}
        </div>
      </div>

      <section className="glass-panel rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--accent-mineral)]" strokeWidth={1.6} />
            <h2 className="text-sm font-medium text-[var(--ink-primary)]">
              Mapa Mensal — {team.name} (toque em qualquer dia para apontar)
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--ink-secondary)]">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--status-meter)]" /> Metro
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--status-daily)]" /> Diária
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--status-standby)]" /> Parado
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--status-idle)]" /> Em Casa
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {calendarDays.map(({ dayNum, dateStr, evaluated }) => {
            const dotColor = !evaluated
              ? 'transparent'
              : evaluated.resolvedMode === 'metro'
                ? 'var(--status-meter)'
                : evaluated.resolvedMode === 'diaria' || evaluated.resolvedMode === 'meia_diaria'
                  ? evaluated.entry.status === 'parado_diaria'
                    ? 'var(--status-standby)'
                    : 'var(--status-daily)'
                  : STATUS_META[evaluated.entry.status].dotColor;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => openDrawerForDate(dateStr)}
                className={`flex min-h-[72px] flex-col justify-between rounded-xl border p-2 text-left transition ${
                  evaluated
                    ? 'surface-card-inner hover:border-[var(--accent-mineral)]'
                    : 'border-dashed border-[var(--border-strong)] bg-[var(--surface-hover)] hover:bg-[var(--surface-inner)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="tabular-nums text-xs font-medium text-[var(--ink-primary)]">
                    {String(dayNum).padStart(2, '0')}
                  </span>
                  {evaluated && (
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
                  )}
                </div>

                {evaluated ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="truncate text-[10px] font-medium text-[var(--ink-primary)]">
                      {evaluated.resolvedMode === 'metro'
                        ? `${formatDecimalBR(evaluated.totalMeters)} m`
                        : evaluated.resolvedMode === 'diaria'
                          ? '1,0 Diária'
                          : evaluated.resolvedMode === 'meia_diaria'
                            ? '0,5 Diária'
                            : STATUS_META[evaluated.entry.status].label}
                    </p>
                    <p className="tabular-nums text-[10px] text-[var(--ink-muted)]">
                      {evaluated.billedValue > 0 ? formatCurrencyBRL(evaluated.billedValue) : '—'}
                    </p>
                  </div>
                ) : (
                  <span className="text-[10px] text-[var(--ink-muted)]">Sem registro</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <h2 className="mb-3 text-sm font-medium text-[var(--ink-primary)]">
          Lançamentos Cronológicos — {team.name}
        </h2>
        {calculation.evaluatedDays.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--ink-muted)]">
            Nenhum apontamento registrado neste mês para {team.name}. Toque em um dia acima ou em
            &ldquo;Apontar Dia&rdquo;.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)]">
            {calculation.evaluatedDays.map((item) => {
              const proj = item.entry.projectId ? projectMap.get(item.entry.projectId) : null;
              const meta = STATUS_META[item.entry.status];
              return (
                <div
                  key={item.entry.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tabular-nums text-xs font-semibold text-[var(--ink-primary)]">
                        {formatDateBR(item.entry.date)}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: meta.badgeBg, color: meta.badgeColor }}
                      >
                        {meta.label}
                      </span>
                      {item.triggeredMinimumDaily && (
                        <span className="rounded-full bg-[var(--accent-ochre-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-ochre)]">
                          Auto → Diária Mínima
                        </span>
                      )}
                      {item.entry.usesSptEquipment && (
                        <span className="rounded-full bg-[var(--accent-mineral-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-mineral)]">
                          Equip. SPT
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--ink-primary)]">
                      {proj
                        ? `${proj.pastaCode} · ${proj.clientName} (${proj.city}/${proj.state})`
                        : 'Sem obra vinculada'}
                      {item.entry.testDescription ? ` — ${item.entry.testDescription}` : ''}
                    </p>
                    {item.entry.holes.length > 0 && (
                      <p className="tabular-nums mt-0.5 text-[11px] text-[var(--ink-secondary)]">
                        Furos:{' '}
                        {item.entry.holes
                          .map(
                            (h) =>
                              `${h.code} (${formatDecimalBR(h.depthMeters)} m ${h.type.toUpperCase()})`
                          )
                          .join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-right">
                      <p className="tabular-nums text-sm font-semibold text-[var(--ink-primary)]">
                        {formatCurrencyBRL(item.billedValue)}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        {item.resolvedMode === 'metro'
                          ? `${formatDecimalBR(item.totalMeters)} m`
                          : item.resolvedMode === 'diaria'
                            ? '1,0 diária'
                            : item.resolvedMode === 'meia_diaria'
                              ? '0,5 diária'
                              : 'Sem cobrança'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDrawerForDate(item.entry.date)}
                      className="btn-secondary px-2.5 py-1.5 text-xs"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="glass-modal max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--accent-mineral)]">
                  Equipe {team.name}
                </p>
                <h3 className="text-lg font-medium text-[var(--ink-primary)]">
                  {editingId ? 'Editar Apontamento Diário' : 'Novo Apontamento de Campo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-2 text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--ink-secondary)]">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mineral-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--ink-secondary)]">
                    Status do Dia
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as FieldDayStatus)}
                    className="mineral-input w-full px-3 py-2 text-sm"
                  >
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--ink-secondary)]">
                    Pasta / Obra
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="mineral-input w-full px-3 py-2 text-sm"
                  >
                    <option value="">Sem obra vinculada</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.pastaCode} — {p.clientName} ({p.city}/{p.state})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--ink-secondary)]">
                    Atividade
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as FieldActivityType)}
                    className="mineral-input w-full px-3 py-2 text-sm"
                  >
                    <option value="spt">Sondagem SPT</option>
                    <option value="trado">Sondagem a Trado</option>
                    <option value="rotativa">Sondagem Rotativa / Mista</option>
                    <option value="ensaio">Ensaios (EP / E.A / Vane / Resistiv.)</option>
                    <option value="misto">Misto (Sondagem + Ensaio)</option>
                    <option value="coleta">Coleta de Amostras</option>
                    <option value="viagem">Viagem / Mobilização</option>
                    <option value="parado">Parado aguardando liberação</option>
                    <option value="ocioso">Em casa / Folga</option>
                  </select>
                </div>
              </div>

              <div className="surface-card-inner rounded-2xl p-3.5">
                <p className="mb-2 text-xs font-medium text-[var(--ink-primary)]">
                  Furos Perfurados no Dia (opcional para ensaios)
                </p>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="SP-01"
                    value={newHoleCode}
                    onChange={(e) => setNewHoleCode(e.target.value)}
                    className="mineral-input col-span-4 px-2.5 py-1.5 text-xs"
                  />
                  <select
                    value={newHoleType}
                    onChange={(e) => setNewHoleType(e.target.value as BoreholeType)}
                    className="mineral-input col-span-3 px-2.5 py-1.5 text-xs"
                  >
                    <option value="spt">SPT</option>
                    <option value="trado">Trado</option>
                    <option value="rotativa">Rotativa</option>
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Prof. (m)"
                    value={newHoleDepth}
                    onChange={(e) => setNewHoleDepth(e.target.value)}
                    className="mineral-input col-span-3 px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddHole}
                    className="btn-primary col-span-2 px-2 py-1.5 text-xs"
                  >
                    + Add
                  </button>
                </div>

                {holes.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {holes.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-xl bg-[var(--surface-chip)] px-3 py-1.5 text-xs"
                      >
                        <span className="tabular-nums font-medium text-[var(--ink-primary)]">
                          {h.code} · {h.type.toUpperCase()} · {formatDecimalBR(h.depthMeters)} m
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setHoles((prev) => prev.filter((item) => item.id !== h.id))
                          }
                          className="text-[var(--status-danger)] hover:opacity-75"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--ink-secondary)]">
                  Descrição do Ensaio / Ocorrência
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Ensaio EP, Vane Test, Parado aguardando acesso..."
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  className="mineral-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--ink-secondary)]">
                    Regra de Faturamento
                  </label>
                  <select
                    value={billingOverride}
                    onChange={(e) => setBillingOverride(e.target.value as BillingMode)}
                    className="mineral-input w-full px-3 py-2 text-sm"
                  >
                    <option value="auto">Automático (Metro vs. Diária Mínima)</option>
                    <option value="diaria">Forçar Diária Integral (1,0)</option>
                    <option value="meia_diaria">Forçar Meia Diária (0,5)</option>
                    <option value="metro">Forçar Metro Perfurado</option>
                    <option value="sem_cobranca">Sem Cobrança</option>
                  </select>
                </div>

                <label className="surface-card-inner flex cursor-pointer items-center gap-2.5 self-end rounded-xl px-3 py-2.5 text-xs text-[var(--ink-primary)]">
                  <input
                    type="checkbox"
                    checked={usesSptEquipment}
                    onChange={(e) => setUsesSptEquipment(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--accent-mineral)]"
                  />
                  <span>Usou equipamento SPT ({team.percentualDescontoEquipSpt}%)</span>
                </label>
              </div>

              <div className="rounded-2xl border border-[var(--accent-mineral)]/25 bg-[var(--accent-mineral-soft)] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-mineral)]">
                    <CheckCircle2 className="h-4 w-4" />
                    Prévia Automática do Motor Teneur
                  </span>
                  <span className="tabular-nums text-sm font-semibold text-[var(--ink-primary)]">
                    {formatCurrencyBRL(livePreview.billedValue)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--ink-secondary)]">
                  {livePreview.explanation}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                {editingId ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteEntry(editingId);
                      setDrawerOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--status-danger)] hover:bg-[var(--status-danger-soft)]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="btn-secondary px-4 py-2 text-xs sm:text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    data-testid="save-daily-entry-btn"
                    className="btn-primary px-5 py-2 text-xs sm:text-sm disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar Apontamento'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});
