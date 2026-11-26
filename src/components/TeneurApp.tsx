'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Radio,
  Settings2,
  Users,
} from 'lucide-react';
import { computeExecutiveAnalytics } from '@/domain/analytics';
import { formatMonthYearPT } from '@/domain/formatters';
import type {
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast((curr) => (curr === message ? null : curr)), 2600);
  }, []);

  const refreshDataset = useCallback(async () => {
    const res = await fetch('/api/dataset', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as {
      dataset: TeneurDataset;
      storageMode: 'supabase' | 'local';
    };
    setDataset(data.dataset);
    setStorageMode(data.storageMode);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('teneur-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_entries' },
        () => void refreshDataset()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mobilizations' },
        () => void refreshDataset()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'financial_adjustments' },
        () => void refreshDataset()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'measurements' },
        () => void refreshDataset()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshDataset]);

  const analytics = useMemo(
    () => computeExecutiveAnalytics(dataset, referenceMonth),
    [dataset, referenceMonth]
  );

  async function handleSaveEntry(entry: Omit<DailyEntry, 'id'> & { id?: string }) {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      await refreshDataset();
      notify('Apontamento diário salvo.');
    }
  }

  async function handleDeleteEntry(id: string) {
    const res = await fetch(`/api/entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshDataset();
      notify('Apontamento removido.');
    }
  }

  async function handleSaveMobilization(
    mob: Omit<MobilizationRecord, 'id'> & { id?: string }
  ) {
    const res = await fetch('/api/mobilizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mob),
    });
    if (res.ok) {
      await refreshDataset();
      notify('Trecho de mobilização salvo.');
    }
  }

  async function handleDeleteMobilization(id: string) {
    const res = await fetch(`/api/mobilizations?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await refreshDataset();
      notify('Trecho removido.');
    }
  }

  async function handleSaveAdjustment(
    adj: Omit<FinancialAdjustment, 'id'> & { id?: string }
  ) {
    const res = await fetch('/api/adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adj),
    });
    if (res.ok) {
      await refreshDataset();
      notify('Lançamento financeiro salvo.');
    }
  }

  async function handleDeleteAdjustment(id: string) {
    const res = await fetch(`/api/adjustments?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await refreshDataset();
      notify('Lançamento removido.');
    }
  }

  async function handleUpdateMeasurementStatus(status: MeasurementStatus) {
    const res = await fetch('/api/measurements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: selectedTeamId, referenceMonth, status }),
    });
    if (res.ok) {
      await refreshDataset();
      notify(`Medição atualizada para "${status}".`);
    }
  }

  async function handleSaveTeam(team: Omit<Team, 'id'> & { id?: string }) {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team),
    });
    if (res.ok) {
      await refreshDataset();
      notify('Contrato da equipe salvo.');
    }
  }

  async function handleSaveProject(project: Omit<Project, 'id'> & { id?: string }) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (res.ok) {
      await refreshDataset();
      notify('Pasta/obra cadastrada.');
    }
  }

  async function handleSaveSignatory(config: SignatoryConfig) {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      setIncludeLegalRep(config.includeLegalRepresentative);
      await refreshDataset();
      notify('Assinatura técnica atualizada.');
    }
  }

  const navItems: Array<{
    key: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }> = [
    { key: 'overview', label: 'Visão Geral', shortLabel: 'Painel', icon: BarChart3 },
    { key: 'diary', label: 'Diário de Campo', shortLabel: 'Diário', icon: CalendarDays },
    { key: 'measurements', label: 'Medições', shortLabel: 'Medições', icon: FileSpreadsheet },
    { key: 'teams', label: 'Equipes', shortLabel: 'Equipes', icon: Users },
    { key: 'projects', label: 'Obras & Pastas', shortLabel: 'Obras', icon: Building2 },
  ];

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="glass-bar sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between border-r px-4 py-6 lg:flex">
        <div>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1F6E7A] text-white shadow-xs">
              <span className="text-lg font-light tracking-tight">T</span>
            </div>
            <div>
              <p className="text-lg font-medium tracking-tight text-[#181B20]">Teneur</p>
              <p className="text-[11px] text-[#7C8594]">Terra Sol Engenharia</p>
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
                  onClick={() => setActiveTab(item.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? 'bg-[#1F6E7A] font-medium text-white shadow-xs'
                      : 'text-[#525B68] hover:bg-black/[0.04] hover:text-[#181B20]'
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
          <div className="rounded-2xl border border-[#181B20]/8 bg-white/75 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#181B20]">
                {dataset.signatory.engineerName.split(' ').slice(0, 2).join(' ')}
              </span>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="rounded-lg p-1 text-[#525B68] hover:bg-black/5"
                title="Configurar assinatura e PDF"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-[#7C8594]">{dataset.signatory.engineerTitle}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#1E7A56]">
              <Radio className="h-3 w-3" />
              <span>
                {storageMode === 'supabase' ? 'Supabase Tempo Real' : 'Modo Local Validado'}
              </span>
            </div>
          </div>
          <p className="px-2 text-[11px] font-light text-[#7C8594]">
            Desenvolvido por Okapi Code Forge
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-bar sticky top-0 z-30 border-b px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1F6E7A] text-sm font-medium text-white">
                T
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-[#181B20]">Teneur</p>
                <p className="text-[10px] text-[#7C8594]">Terra Sol</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-xs text-[#525B68] lg:flex">
              <span className="font-medium text-[#181B20]">Terra Sol Engenharia Geotécnica</span>
              <span className="text-[#CBD5E1]">•</span>
              <span>Coordenação: {dataset.signatory.engineerName}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="glass-panel inline-flex items-center gap-1 rounded-xl px-1.5 py-1">
                <button
                  type="button"
                  aria-label="Mês anterior"
                  onClick={() => setReferenceMonth((m) => shiftMonth(m, -1))}
                  className="rounded-lg p-1 text-[#525B68] hover:bg-black/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span
                  data-testid="active-month-label"
                  className="min-w-[104px] text-center text-xs font-medium text-[#181B20]"
                >
                  {formatMonthYearPT(referenceMonth)}
                </span>
                <button
                  type="button"
                  aria-label="Próximo mês"
                  onClick={() => setReferenceMonth((m) => shiftMonth(m, 1))}
                  className="rounded-lg p-1 text-[#525B68] hover:bg-black/5"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Configurações de assinatura"
                className="btn-secondary p-2 lg:hidden"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-10">
          {activeTab === 'overview' && (
            <ExecutiveOverview
              analytics={analytics}
              includeLegalRep={includeLegalRep}
              onToggleLegalRep={setIncludeLegalRep}
              onSelectTeamForMeasurement={(teamId) => {
                setSelectedTeamId(teamId);
                setActiveTab('measurements');
              }}
              onSelectTeamForDiary={(teamId) => {
                setSelectedTeamId(teamId);
                setActiveTab('diary');
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

          <footer className="mt-12 border-t border-[#181B20]/8 pt-5 text-center text-xs font-light text-[#7C8594]">
            <span>Teneur · Terra Sol Engenharia Geotécnica · </span>
            <strong className="font-medium text-[#525B68]">Desenvolvido por Okapi Code Forge</strong>
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
                onClick={() => setActiveTab(item.key)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition ${
                  active ? 'text-[#1F6E7A]' : 'text-[#7C8594]'
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

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#181B20] px-4 py-2 text-xs font-medium text-white shadow-lg lg:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}
