'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Plus, X } from 'lucide-react';
import type { CompanyProfile } from '@/domain/types';

interface CompanySwitcherProps {
  companies: CompanyProfile[];
  activeCompanyName: string;
  activeCompanySubtitle: string;
  compact?: boolean;
  onSelectCompany: (companyId: string) => Promise<void>;
  onCreateCompany: (company: Omit<CompanyProfile, 'id'>) => Promise<void>;
}

export function CompanySwitcher({
  companies,
  activeCompanyName,
  activeCompanySubtitle,
  compact = false,
  onSelectCompany,
  onCreateCompany,
}: CompanySwitcherProps) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('Engenharia e Consultoria');
  const [legalRepName, setLegalRepName] = useState('');
  const [legalRepCpf, setLegalRepCpf] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreateCompany({
        companyName: name.trim(),
        companySubtitle: subtitle.trim() || 'Serviços de Engenharia',
        includeLegalRepresentative: Boolean(legalRepName.trim()),
        legalRepName: legalRepName.trim() || 'Representante Legal',
        legalRepRole: 'Representante Legal',
        legalRepCpf: legalRepCpf.trim(),
      });
      setName('');
      setSubtitle('Engenharia e Consultoria');
      setLegalRepName('');
      setLegalRepCpf('');
      setAdding(false);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid={compact ? 'mobile-company-switcher' : 'company-switcher'}
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? 'inline-flex max-w-[148px] items-center gap-1 rounded-lg bg-[#181B20]/[0.045] px-2 py-0.5 text-[10px] font-medium text-[#525B68] transition hover:bg-[#181B20]/[0.08] hover:text-[#181B20]'
            : 'mt-0.5 inline-flex max-w-full items-center gap-1 rounded-lg px-1.5 py-0.5 -ml-1.5 text-[11px] text-[#525B68] transition hover:bg-[#181B20]/[0.05] hover:text-[#181B20]'
        }
      >
        <span className="truncate">{activeCompanyName}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-[#7C8594] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={1.7}
        />
      </button>

      {open && (
        <div className="glass-panel absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl bg-white/95 p-2.5 shadow-[0_18px_40px_-16px_rgba(15,23,42,0.18)]">
          <div className="mb-1.5 flex items-center justify-between px-2 pt-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#7C8594]">
              Empresa / Contrato Ativo
            </span>
            {adding && (
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-md p-0.5 text-[#7C8594] hover:bg-black/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {!adding ? (
            <>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {companies.map((company) => {
                  const isActive =
                    company.companyName.toLowerCase() === activeCompanyName.toLowerCase();
                  return (
                    <button
                      key={company.id}
                      type="button"
                      onClick={async () => {
                        await onSelectCompany(company.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                        isActive
                          ? 'bg-[#1F6E7A]/10 text-[#1F6E7A]'
                          : 'text-[#181B20] hover:bg-black/[0.04]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isActive
                              ? 'bg-[#1F6E7A] text-white'
                              : 'bg-[#F3F4F6] text-[#525B68]'
                          }`}
                        >
                          <Building2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{company.companyName}</p>
                          <p className="truncate text-[10px] text-[#7C8594]">
                            {company.companySubtitle}
                          </p>
                        </div>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 border-t border-[#181B20]/8 pt-2">
                <button
                  type="button"
                  data-testid="add-company-btn"
                  onClick={() => setAdding(true)}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-[#1F6E7A] transition hover:bg-[#1F6E7A]/8"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
                  <span>Adicionar outra empresa</span>
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreate} className="space-y-2 px-1 py-1 text-xs">
              <input
                required
                placeholder="Nome da empresa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mineral-input w-full px-2.5 py-1.5 text-xs"
              />
              <input
                required
                placeholder="Especialidade (ex: Mineração / Geotecnia)"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mineral-input w-full px-2.5 py-1.5 text-xs"
              />
              <input
                placeholder="Representante Legal (opcional)"
                value={legalRepName}
                onChange={(e) => setLegalRepName(e.target.value)}
                className="mineral-input w-full px-2.5 py-1.5 text-xs"
              />
              {legalRepName.trim() && (
                <input
                  placeholder="CPF do Representante (opcional)"
                  value={legalRepCpf}
                  onChange={(e) => setLegalRepCpf(e.target.value)}
                  className="mineral-input w-full px-2.5 py-1.5 text-xs"
                />
              )}
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="btn-secondary px-2.5 py-1 text-[11px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  data-testid="save-company-btn"
                  className="btn-primary px-3 py-1 text-[11px] disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
