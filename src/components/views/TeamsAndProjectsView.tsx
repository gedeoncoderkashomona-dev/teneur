'use client';

import React, { useState } from 'react';
import { Building2, Edit3, Plus, ShieldCheck, Users, X } from 'lucide-react';
import type { ExecutiveAnalytics } from '@/domain/analytics';
import { formatCurrencyBRL, formatDecimalBR } from '@/domain/formatters';
import type { Project, SignatoryConfig, Team } from '@/domain/types';

interface TeamsViewProps {
  teams: Team[];
  onSaveTeam: (team: Omit<Team, 'id'> & { id?: string }) => Promise<void>;
}

export const TeamsView = React.memo(function TeamsView({ teams, onSaveTeam }: TeamsViewProps) {
  const [editing, setEditing] = useState<(Omit<Team, 'id'> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing({
      name: '',
      leaderName: '',
      membersCount: 3,
      serviceLabel: 'EXECUÇÃO DE SONDAGEM SPT E ENSAIOS',
      defaultLocation: 'VARIADOS',
      valorMetroSpt: 60,
      valorMetroTrado: 50,
      valorMetroRotativa: 120,
      valorDiaria: 1050,
      valorKmMobilizacao: 2.8,
      percentualDescontoEquipSpt: 0,
      taxaRastreadorMensal: 0,
      folhaCltPadraoMensal: 0,
      active: true,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await onSaveTeam(editing);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent-mineral)]">
            Equipes & Contratos
          </p>
          <h1 className="mt-0.5 text-2xl font-light tracking-tight text-[var(--ink-primary)]">
            Sondadores e Tabelas Contratuais
          </h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Equipe</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((t) => (
          <div key={t.id} className="glass-panel rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-mineral-soft)] text-[var(--accent-mineral)]">
                  <Users className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <div>
                  <h2 className="text-base font-medium text-[var(--ink-primary)]">{t.name}</h2>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {t.membersCount} integrantes · {t.defaultLocation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing({ ...t })}
                className="btn-secondary p-2"
                title="Editar contrato"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl bg-[var(--surface-chip)] p-2.5">
                <p className="text-[10px] uppercase text-[var(--ink-muted)]">Diária Mínima</p>
                <p className="tabular-nums mt-0.5 font-semibold text-[var(--ink-primary)]">
                  {formatCurrencyBRL(t.valorDiaria)}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--surface-chip)] p-2.5">
                <p className="text-[10px] uppercase text-[var(--ink-muted)]">Mobilização</p>
                <p className="tabular-nums mt-0.5 font-semibold text-[var(--ink-primary)]">
                  {formatCurrencyBRL(t.valorKmMobilizacao)}/km
                </p>
              </div>
              <div className="rounded-xl bg-[var(--surface-chip)] p-2.5">
                <p className="text-[10px] uppercase text-[var(--ink-muted)]">Metro SPT / Trado</p>
                <p className="tabular-nums mt-0.5 font-medium text-[var(--ink-primary)]">
                  {formatCurrencyBRL(t.valorMetroSpt)} · {formatCurrencyBRL(t.valorMetroTrado)}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--surface-chip)] p-2.5">
                <p className="text-[10px] uppercase text-[var(--ink-muted)]">
                  Equip. SPT / Rastreio
                </p>
                <p className="tabular-nums mt-0.5 font-medium text-[var(--ink-primary)]">
                  {t.percentualDescontoEquipSpt}% · {formatCurrencyBRL(t.taxaRastreadorMensal)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="glass-modal max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-[var(--ink-primary)]">
                {editing.id ? `Contrato — ${editing.name}` : 'Cadastrar Nova Equipe'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full p-2 text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                    Nome da Equipe
                  </label>
                  <input
                    required
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="mineral-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                    Sondador Líder
                  </label>
                  <input
                    required
                    value={editing.leaderName}
                    onChange={(e) => setEditing({ ...editing, leaderName: e.target.value })}
                    className="mineral-input w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                    Diária (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editing.valorDiaria}
                    onChange={(e) =>
                      setEditing({ ...editing, valorDiaria: Number(e.target.value) })
                    }
                    className="mineral-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                    Metro SPT (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editing.valorMetroSpt}
                    onChange={(e) =>
                      setEditing({ ...editing, valorMetroSpt: Number(e.target.value) })
                    }
                    className="mineral-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                    Metro Trado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editing.valorMetroTrado}
                    onChange={(e) =>
                      setEditing({ ...editing, valorMetroTrado: Number(e.target.value) })
                    }
                    className="mineral-input w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                    Mobilização (R$/km)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editing.valorKmMobilizacao}
                    onChange={(e) =>
                      setEditing({ ...editing, valorKmMobilizacao: Number(e.target.value) })
                    }
                    className="mineral-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                    Equip. SPT (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editing.percentualDescontoEquipSpt}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        percentualDescontoEquipSpt: Number(e.target.value),
                      })
                    }
                    className="mineral-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                    Rastreador (R$/mês)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.taxaRastreadorMensal}
                    onChange={(e) =>
                      setEditing({ ...editing, taxaRastreadorMensal: Number(e.target.value) })
                    }
                    className="mineral-input w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn-secondary px-4 py-2 text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 text-xs sm:text-sm"
                >
                  {saving ? 'Salvando...' : 'Salvar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

interface ProjectsViewProps {
  projects: Project[];
  analytics: ExecutiveAnalytics;
  onSaveProject: (project: Omit<Project, 'id'> & { id?: string }) => Promise<void>;
}

export const ProjectsView = React.memo(function ProjectsView({
  projects,
  analytics,
  onSaveProject,
}: ProjectsViewProps) {
  const [open, setOpen] = useState(false);
  const [pastaCode, setPastaCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [osCode, setOsCode] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('PB');
  const [serviceType, setServiceType] = useState('Sondagem SPT e Ensaios');

  const costMap = new Map(analytics.costByProject.map((c) => [c.projectId, c]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSaveProject({
      pastaCode: pastaCode.trim(),
      clientName: clientName.trim(),
      osCode: osCode.trim() || null,
      city: city.trim(),
      state: stateUf.trim().toUpperCase(),
      serviceType: serviceType.trim(),
      active: true,
    });
    setPastaCode('');
    setClientName('');
    setOsCode('');
    setCity('');
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent-mineral)]">
            CRM de Obras & Pastas
          </p>
          <h1 className="mt-0.5 text-2xl font-light tracking-tight text-[var(--ink-primary)]">
            Pastas, Clientes e Custos de Campo
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Pasta / Obra</span>
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="glass-panel grid grid-cols-1 gap-3 rounded-2xl p-5 sm:grid-cols-3"
        >
          <input
            required
            placeholder="Pasta (ex: Pasta 62)"
            value={pastaCode}
            onChange={(e) => setPastaCode(e.target.value)}
            className="mineral-input px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Cliente / Construtora"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mineral-input px-3 py-2 text-sm"
          />
          <input
            placeholder="OS (opcional, ex: OS 25)"
            value={osCode}
            onChange={(e) => setOsCode(e.target.value)}
            className="mineral-input px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Cidade"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mineral-input px-3 py-2 text-sm"
          />
          <input
            required
            maxLength={2}
            placeholder="UF (PB, PE, RN...)"
            value={stateUf}
            onChange={(e) => setStateUf(e.target.value.toUpperCase())}
            className="mineral-input px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Escopo (Sondagem SPT / Vane Test)"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="mineral-input px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2 sm:col-span-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary px-4 py-2 text-xs"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary px-5 py-2 text-xs">
              Cadastrar Obra
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => {
          const stats = costMap.get(p.id);
          return (
            <div key={p.id} className="glass-panel rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-mineral-soft)] text-[var(--accent-mineral)]">
                    <Building2 className="h-4 w-4" strokeWidth={1.6} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--ink-primary)]">
                      {p.pastaCode} {p.osCode ? `· ${p.osCode}` : ''}
                    </h3>
                    <p className="text-xs text-[var(--ink-secondary)]">{p.clientName}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[var(--surface-chip)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--ink-secondary)]">
                  {p.city}/{p.state}
                </span>
              </div>

              <p className="mt-2.5 text-xs text-[var(--ink-muted)]">{p.serviceType}</p>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--border-hairline)] pt-2.5 text-center">
                <div>
                  <p className="text-[10px] uppercase text-[var(--ink-muted)]">Metros</p>
                  <p className="tabular-nums text-xs font-semibold text-[var(--ink-primary)]">
                    {formatDecimalBR(stats?.totalMeters ?? 0)} m
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[var(--ink-muted)]">Diárias</p>
                  <p className="tabular-nums text-xs font-semibold text-[var(--ink-primary)]">
                    {formatDecimalBR(stats?.dailyUnits ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[var(--ink-muted)]">Custo Mês</p>
                  <p className="tabular-nums text-xs font-semibold text-[var(--accent-mineral)]">
                    {formatCurrencyBRL(stats?.estimatedCost ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

interface SignatoryModalProps {
  config: SignatoryConfig;
  onClose: () => void;
  onSave: (config: SignatoryConfig) => Promise<void>;
}

export function SignatoryModal({ config, onClose, onSave }: SignatoryModalProps) {
  const [form, setForm] = useState<SignatoryConfig>(config);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="glass-modal w-full max-w-lg rounded-t-3xl p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--accent-mineral)]" />
            <h3 className="text-base font-medium text-[var(--ink-primary)]">
              Assinatura Técnica & Identidade dos PDFs
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
              Nome Completo da Responsável Técnica
            </label>
            <input
              required
              value={form.engineerName}
              onChange={(e) => setForm({ ...form, engineerName: e.target.value })}
              className="mineral-input w-full px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                Título Profissional
              </label>
              <input
                required
                value={form.engineerTitle}
                onChange={(e) => setForm({ ...form, engineerTitle: e.target.value })}
                className="mineral-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-[var(--ink-secondary)]">
                CREA (opcional)
              </label>
              <input
                placeholder="Ex: CREA-PB 162000000-0"
                value={form.engineerCrea}
                onChange={(e) => setForm({ ...form, engineerCrea: e.target.value })}
                className="mineral-input w-full px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="surface-card-inner flex cursor-pointer items-center gap-2.5 rounded-xl p-3">
            <input
              type="checkbox"
              checked={form.includeLegalRepresentative}
              onChange={(e) =>
                setForm({ ...form, includeLegalRepresentative: e.target.checked })
              }
              className="h-4 w-4 accent-[var(--accent-mineral)]"
            />
            <div>
              <p className="font-medium text-[var(--ink-primary)]">
                Incluir assinatura da Representante Legal por padrão
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {form.legalRepName} ({form.legalRepRole}) — pode ser alternado antes de baixar cada
                PDF
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-xs">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-5 py-2 text-xs"
            >
              {saving ? 'Salvando...' : 'Salvar Assinatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
