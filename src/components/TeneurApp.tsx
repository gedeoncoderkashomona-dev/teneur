'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Moon,
  Radio,
  Settings2,
  Sun,
  Users,
} from 'lucide-react';
import { computeExecutiveAnalytics } from '@/domain/analytics';
import { formatMonthYearPT } from '@/domain/formatters';
import type {
  CompanyProfile,
  DailyEntry,
  FinancialAdjustment,
  MeasurementStatus,
  MobilizationRecord,
  Project,
  SignatoryConfig,
  Team,
  TeneurDataset,
} from '@/domain/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { CompanySwitcher } from '@/components/ui/CompanySwitcher';
import { RemindersModal } from '@/components/ui/RemindersModal';
import { TeneurSplash } from '@/components/ui/TeneurSplash';
import { ExecutiveOverview } from '@/components/views/ExecutiveOverview';
import { FieldDiaryView } from '@/components/views/FieldDiaryView';
import { MeasurementsView } from '@/components/views/MeasurementsView';
import {
  ProjectsView,
  SignatoryModal,
  TeamsView,
} from '@/components/views/TeamsAndProjectsView';

type ActiveTab = 'overview' | 'diary' | 'measurements' | 'teams' | 'projects';

interface TeneurAppProps {
  initialDataset: TeneurDataset;
  initialStorageMode: 'supabase' | 'local';
}

function shiftMonth(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y!, m! - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function TeneurApp({ initialDataset, initialStorageMode }: TeneurAppProps) {
  const [dataset, setDataset] = useState<TeneurDataset>(initialDataset);
  const [storageMode, setStorageMode] = useState<'supabase' | 'local'>(initialStorageMode);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [referenceMonth, setReferenceMonth] = useState('2026-10');
  const [selectedTeamId, setSelectedTeamId] = useState(
    initialDataset.teams[0]?.id ?? 'team-leonardo'
  );
  const [includeLegalRep, setIncludeLegalRep] = useState(
    initialDataset.signatory.includeLegalRepresentative
  );
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'dark' || current === 'light') {
      setTheme(current);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('teneur_theme', next);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', next === 'dark' ? '#0D1014' : '#F3F4F6');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((curr) => (curr === message ? null : curr)), 2400);
  }, []);

  const refreshDataset = useCallback(async () => {
    const res = await fetch('/api/dataset', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as {
      dataset: TeneurDataset;
      storageMode: 'supabase' | 'local';
    };
    startTransition(() => {
      setDataset(data.dataset);
      setStorageMode(data.storageMode);
    });
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      void refreshDataset();
    }, 320);
  }, [refreshDataset]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('teneur-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_entries' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mobilizations' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_adjustments' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'measurements' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signatory_settings' }, scheduleRefresh)
      .subscribe();

    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [scheduleRefresh]);

  const analytics = useMemo(
    () => computeExecutiveAnalytics(dataset, referenceMonth),
    [dataset, referenceMonth]
  );

  const navigateTab = useCallback((tab: ActiveTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  }, []);

  const handleSaveEntry = useCallback(
    async (entry: Omit<DailyEntry, 'id'> & { id?: string }) => {
      const tempId = entry.id ?? `temp-${Date.now()}`;
      const optimistic: DailyEntry = { ...entry, id: tempId };
      setDataset((prev) => {
        const idx = prev.dailyEntries.findIndex(
          (e) => e.id === tempId || (e.teamId === entry.teamId && e.date === entry.date)
        );
        const nextEntries = [...prev.dailyEntries];
        if (idx >= 0) nextEntries[idx] = { ...optimistic, id: nextEntries[idx]!.id };
        else nextEntries.push(optimistic);
        return { ...prev, dailyEntries: nextEntries };
      });
      notify('Apontamento diário salvo.');

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        const saved = (await res.json()) as DailyEntry;
        setDataset((prev) => ({
          ...prev,
          dailyEntries: prev.dailyEntries.map((e) =>
            e.id === tempId || (e.teamId === saved.teamId && e.date === saved.date) ? saved : e
          ),
        }));
      } else {
        await refreshDataset();
      }
    },
    [notify, refreshDataset]
  );

  const handleDeleteEntry = useCallback(
    async (id: string) => {
      setDataset((prev) => ({
        ...prev,
        dailyEntries: prev.dailyEntries.filter((e) => e.id !== id),
      }));
      notify('Apontamento removido.');
      const res = await fetch(`/api/entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) await refreshDataset();
    },
    [notify, refreshDataset]
  );

  const handleSaveMobilization = useCallback(
    async (mob: Omit<MobilizationRecord, 'id'> & { id?: string }) => {
      const tempId = mob.id ?? `temp-mob-${Date.now()}`;
      const optimistic: MobilizationRecord = { ...mob, id: tempId };
      setDataset((prev) => ({ ...prev, mobilizations: [...prev.mobilizations, optimistic] }));
      notify('Trecho de mobilização salvo.');

      const res = await fetch('/api/mobilizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mob),
      });
      if (res.ok) {
        const saved = (await res.json()) as MobilizationRecord;
        setDataset((prev) => ({
          ...prev,
          mobilizations: prev.mobilizations.map((m) => (m.id === tempId ? saved : m)),
        }));
      } else {
        await refreshDataset();
      }
    },
    [notify, refreshDataset]
  );

  const handleDeleteMobilization = useCallback(
    async (id: string) => {
      setDataset((prev) => ({
        ...prev,
        mobilizations: prev.mobilizations.filter((m) => m.id !== id),
      }));
      notify('Trecho removido.');
      const res = await fetch(`/api/mobilizations?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) await refreshDataset();
    },
    [notify, refreshDataset]
  );

  const handleSaveAdjustment = useCallback(
    async (adj: Omit<FinancialAdjustment, 'id'> & { id?: string }) => {
      const tempId = adj.id ?? `temp-adj-${Date.now()}`;
      const optimistic: FinancialAdjustment = { ...adj, id: tempId };
      setDataset((prev) => ({ ...prev, adjustments: [...prev.adjustments, optimistic] }));
      notify('Lançamento financeiro salvo.');

      const res = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adj),
      });
      if (res.ok) {
        const saved = (await res.json()) as FinancialAdjustment;
        setDataset((prev) => ({
          ...prev,
          adjustments: prev.adjustments.map((a) => (a.id === tempId ? saved : a)),
        }));
      } else {
        await refreshDataset();
      }
    },
    [notify, refreshDataset]
  );

  const handleDeleteAdjustment = useCallback(
    async (id: string) => {
      setDataset((prev) => ({
        ...prev,
        adjustments: prev.adjustments.filter((a) => a.id !== id),
      }));
      notify('Lançamento removido.');
      const res = await fetch(`/api/adjustments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) await refreshDataset();
    },
    [notify, refreshDataset]
  );

  const handleUpdateMeasurementStatus = useCallback(
    async (status: MeasurementStatus) => {
      setDataset((prev) => {
        const idx = prev.measurements.findIndex(
          (m) => m.teamId === selectedTeamId && m.referenceMonth === referenceMonth
        );
        const nextList = [...prev.measurements];
        if (idx >= 0) {
          nextList[idx] = { ...nextList[idx]!, status };
        } else {
          nextList.push({
            id: `meas-${selectedTeamId}-${referenceMonth}`,
            teamId: selectedTeamId,
            referenceMonth,
            status,
            serviceTitle: null,
            locationLabel: null,
            notes: null,
            closedAt: status === 'fechada' || status === 'paga' ? new Date().toISOString() : null,
          });
        }
        return { ...prev, measurements: nextList };
      });
      notify(`Medição atualizada para "${status}".`);

      const res = await fetch('/api/measurements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeamId, referenceMonth, status }),
      });
      if (!res.ok) await refreshDataset();
    },
    [selectedTeamId, referenceMonth, notify, refreshDataset]
  );

  const handleSaveTeam = useCallback(
    async (team: Omit<Team, 'id'> & { id?: string }) => {
      const tempId = team.id ?? `temp-team-${Date.now()}`;
      setDataset((prev) => {
        const idx = prev.teams.findIndex((t) => t.id === tempId);
        const nextTeams = [...prev.teams];
        if (idx >= 0) nextTeams[idx] = { ...team, id: tempId };
        else nextTeams.push({ ...team, id: tempId });
        return { ...prev, teams: nextTeams };
      });
      notify('Contrato da equipe salvo.');

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(team),
      });
      if (res.ok) {
        const saved = (await res.json()) as Team;
        setDataset((prev) => ({
          ...prev,
          teams: prev.teams.map((t) => (t.id === tempId ? saved : t)),
        }));
      } else {
        await refreshDataset();
      }
    },
    [notify, refreshDataset]
  );

  const handleSaveProject = useCallback(
    async (project: Omit<Project, 'id'> & { id?: string }) => {
      const tempId = project.id ?? `temp-proj-${Date.now()}`;
      setDataset((prev) => ({
        ...prev,
        projects: [...prev.projects, { ...project, id: tempId }],
      }));
      notify('Pasta/obra cadastrada.');

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (res.ok) {
        const saved = (await res.json()) as Project;
        setDataset((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p.id === tempId ? saved : p)),
        }));
      } else {
        await refreshDataset();
      }
    },
    [notify, refreshDataset]
  );

  const handleSaveSignatory = useCallback(
    async (config: SignatoryConfig) => {
      setIncludeLegalRep(config.includeLegalRepresentative);
      setDataset((prev) => ({ ...prev, signatory: config }));
      notify('Assinatura técnica atualizada.');

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) await refreshDataset();
    },
    [notify, refreshDataset]
  );

  const handleSelectCompany = useCallback(
    async (companyId: string) => {
      const target = dataset.companies.find((c) => c.id === companyId);
      if (target) {
        setIncludeLegalRep(target.includeLegalRepresentative);
        setDataset((prev) => ({
          ...prev,
          signatory: {
            ...prev.signatory,
            activeCompanyId: target.id,
            companyName: target.companyName,
            companySubtitle: target.companySubtitle,
            includeLegalRepresentative: target.includeLegalRepresentative,
            legalRepName: target.legalRepName,
            legalRepRole: target.legalRepRole,
            legalRepCpf: target.legalRepCpf,
          },
        }));
        notify(`Empresa ativa: ${target.companyName}`);
      }

      const res = await fetch('/api/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
      if (!res.ok) await refreshDataset();
    },
    [dataset.companies, notify, refreshDataset]
  );

  const handleCreateCompany = useCallback(
    async (company: Omit<CompanyProfile, 'id'>) => {
      const tempId = `temp-comp-${Date.now()}`;
      setDataset((prev) => ({
        ...prev,
        companies: [...prev.companies, { ...company, id: tempId }],
        signatory: {
          ...prev.signatory,
          activeCompanyId: tempId,
          companyName: company.companyName,
          companySubtitle: company.companySubtitle,
          includeLegalRepresentative: company.includeLegalRepresentative,
          legalRepName: company.legalRepName,
          legalRepRole: company.legalRepRole,
          legalRepCpf: company.legalRepCpf,
        },
      }));
      notify(`Empresa "${company.companyName}" adicionada.`);

      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      });
      if (res.ok) {
        const saved = (await res.json()) as CompanyProfile;
        setDataset((prev) => ({
          ...prev,
          companies: prev.companies.map((c) => (c.id === tempId ? saved : c)),
          signatory: { ...prev.signatory, activeCompanyId: saved.id },
        }));
      } else {
        await refreshDataset();
      }
    },
    [notify, refreshDataset]
  );

  const navItems: Array<{
    key: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }> = useMemo(
    () => [
      { key: 'overview', label: 'Visão Geral', shortLabel: 'Painel', icon: BarChart3 },
      { key: 'diary', label: 'Diário de Campo', shortLabel: 'Diário', icon: CalendarDays },
      { key: 'measurements', label: 'Medições', shortLabel: 'Medições', icon: FileSpreadsheet },
      { key: 'teams', label: 'Equipes', shortLabel: 'Equipes', icon: Users },
      { key: 'projects', label: 'Obras & Pastas', shortLabel: 'Obras', icon: Building2 },
    ],
    []
  );

  const isDark = theme === 'dark';

  return (
    <>
      <TeneurSplash
        activeCompanyName={`${dataset.signatory.companyName} · ${dataset.signatory.companySubtitle}`}
      />
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <aside className="glass-bar sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between border-r px-4 py-6 lg:flex">
          <div>
            <div className="flex items-start gap-3 px-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-mineral)] text-white shadow-xs">
                <span className="text-lg font-light tracking-tight">T</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-medium leading-tight tracking-tight text-[var(--ink-primary)]">
                  Teneur
                </p>
                <CompanySwitcher
                  companies={dataset.companies}
                  activeCompanyName={dataset.signatory.companyName}
                  activeCompanySubtitle={dataset.signatory.companySubtitle}
                  onSelectCompany={handleSelectCompany}
                  onCreateCompany={handleCreateCompany}
                />
              </div>
            </div>

            <nav className="mt-8 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    data-testid={`nav-${item.key}`}
                    onClick={() => navigateTab(item.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? 'bg-[var(--accent-mineral)] font-medium text-white shadow-xs'
                        : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-3">
            <div className="surface-card-inner rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--ink-primary)]">
                  {dataset.signatory.engineerName.split(' ').slice(0, 2).join(' ')}
                </span>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="rounded-lg p-1 text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
                  title="Configurar assinatura e PDF"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-[var(--ink-muted)]">
                {dataset.signatory.engineerTitle}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--status-meter)]">
                <Radio className="h-3 w-3" />
                <span>
                  {storageMode === 'supabase' ? 'Supabase Tempo Real' : 'Modo Local Validado'}
                </span>
              </div>
            </div>
            <p className="px-2 text-[11px] font-light text-[var(--ink-muted)]">
              Desenvolvido por Okapi Code Forge
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass-bar safe-pt sticky top-0 z-30 border-b px-4 pb-3 sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 lg:hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-mineral)] text-sm font-medium text-white">
                  T
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-[var(--ink-primary)]">
                    Teneur
                  </p>
                  <CompanySwitcher
                    compact
                    companies={dataset.companies}
                    activeCompanyName={dataset.signatory.companyName}
                    activeCompanySubtitle={dataset.signatory.companySubtitle}
                    onSelectCompany={handleSelectCompany}
                    onCreateCompany={handleCreateCompany}
                  />
                </div>
              </div>

              <div className="hidden items-center gap-2 text-xs text-[var(--ink-secondary)] lg:flex">
                <span className="font-medium text-[var(--ink-primary)]">
                  {dataset.signatory.companyName} · {dataset.signatory.companySubtitle}
                </span>
                <span className="text-[var(--border-strong)]">•</span>
                <span>Coordenação: {dataset.signatory.engineerName}</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="glass-panel inline-flex items-center gap-0.5 rounded-xl px-1 py-1 sm:gap-1 sm:px-1.5">
                  <button
                    type="button"
                    aria-label="Mês anterior"
                    onClick={() =>
                      startTransition(() => setReferenceMonth((m) => shiftMonth(m, -1)))
                    }
                    className="rounded-lg p-1 text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <span
                    data-testid="active-month-label"
                    className="min-w-[84px] text-center text-[11px] font-medium text-[var(--ink-primary)] sm:min-w-[104px] sm:text-xs"
                  >
                    {formatMonthYearPT(referenceMonth)}
                  </span>
                  <button
                    type="button"
                    aria-label="Próximo mês"
                    onClick={() =>
                      startTransition(() => setReferenceMonth((m) => shiftMonth(m, 1)))
                    }
                    className="rounded-lg p-1 text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="theme-toggle"
                  onClick={toggleTheme}
                  aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo noturno'}
                  title={isDark ? 'Modo Claro' : 'Modo Noturno'}
                  className="btn-secondary p-2 text-[var(--ink-secondary)] hover:text-[var(--accent-ochre)]"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4 text-[var(--accent-ochre)]" strokeWidth={1.7} />
                  ) : (
                    <Moon className="h-4 w-4" strokeWidth={1.7} />
                  )}
                </button>

                <button
                  type="button"
                  data-testid="reminders-btn"
                  onClick={() => setRemindersOpen(true)}
                  aria-label="Lembretes e Calendário"
                  title="Lembretes e Calendário do Celular"
                  className="btn-secondary p-2 text-[var(--ink-secondary)] hover:text-[var(--accent-mineral)]"
                >
                  <Bell className="h-4 w-4" strokeWidth={1.6} />
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Configurações de assinatura"
                  className="btn-secondary p-2 text-[var(--ink-secondary)] lg:hidden"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-10">
            <div key={activeTab} className="tab-enter">
              {activeTab === 'overview' && (
                <ExecutiveOverview
                  analytics={analytics}
                  isDark={isDark}
                  includeLegalRep={includeLegalRep}
                  onToggleLegalRep={setIncludeLegalRep}
                  onSelectTeamForMeasurement={(teamId) => {
                    setSelectedTeamId(teamId);
                    navigateTab('measurements');
                  }}
                  onSelectTeamForDiary={(teamId) => {
                    setSelectedTeamId(teamId);
                    navigateTab('diary');
                  }}
                />
              )}

              {activeTab === 'diary' && (
                <FieldDiaryView
                  teams={dataset.teams}
                  projects={dataset.projects}
                  entries={dataset.dailyEntries}
                  mobilizations={dataset.mobilizations}
                  adjustments={dataset.adjustments}
                  financings={dataset.financings}
                  referenceMonth={referenceMonth}
                  selectedTeamId={selectedTeamId}
                  onSelectTeamId={setSelectedTeamId}
                  onSaveEntry={handleSaveEntry}
                  onDeleteEntry={handleDeleteEntry}
                />
              )}

              {activeTab === 'measurements' && (
                <MeasurementsView
                  teams={dataset.teams}
                  projects={dataset.projects}
                  entries={dataset.dailyEntries}
                  mobilizations={dataset.mobilizations}
                  adjustments={dataset.adjustments}
                  financings={dataset.financings}
                  measurements={dataset.measurements}
                  referenceMonth={referenceMonth}
                  selectedTeamId={selectedTeamId}
                  includeLegalRep={includeLegalRep}
                  onToggleLegalRep={setIncludeLegalRep}
                  onSelectTeamId={setSelectedTeamId}
                  onSaveMobilization={handleSaveMobilization}
                  onDeleteMobilization={handleDeleteMobilization}
                  onSaveAdjustment={handleSaveAdjustment}
                  onDeleteAdjustment={handleDeleteAdjustment}
                  onUpdateStatus={handleUpdateMeasurementStatus}
                />
              )}

              {activeTab === 'teams' && (
                <TeamsView teams={dataset.teams} onSaveTeam={handleSaveTeam} />
              )}

              {activeTab === 'projects' && (
                <ProjectsView
                  projects={dataset.projects}
                  analytics={analytics}
                  onSaveProject={handleSaveProject}
                />
              )}
            </div>

            <footer className="mt-12 border-t border-[var(--border-hairline)] pt-5 text-center text-xs font-light text-[var(--ink-muted)]">
              <span>Teneur - Gestão de Serviços · </span>
              <strong className="font-medium text-[var(--ink-secondary)]">
                Desenvolvido por Okapi Code Forge
              </strong>
            </footer>
          </main>
        </div>

        <nav className="glass-bar safe-pb fixed inset-x-0 bottom-0 z-40 border-t px-2 pt-2 lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  data-testid={`mobile-nav-${item.key}`}
                  onClick={() => navigateTab(item.key)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition ${
                    active ? 'text-[var(--accent-mineral)]' : 'text-[var(--ink-muted)]'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {settingsOpen && (
          <SignatoryModal
            config={dataset.signatory}
            onClose={() => setSettingsOpen(false)}
            onSave={handleSaveSignatory}
          />
        )}

        {remindersOpen && (
          <RemindersModal onClose={() => setRemindersOpen(false)} onNotify={notify} />
        )}

        {toast && (
          <div className="glass-popover fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-medium text-[var(--ink-primary)] lg:bottom-6">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
