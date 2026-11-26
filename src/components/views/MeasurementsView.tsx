'use client';

import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCheck2,
  Plus,
  Route,
  Receipt,
  Trash2,
  Truck,
} from 'lucide-react';
import { calculateMeasurement } from '@/domain/billing-engine';
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDecimalBR,
  formatMonthYearPT,
} from '@/domain/formatters';
import type {
  AdjustmentCategory,
  AdjustmentDirection,
  AssetFinancing,
  DailyEntry,
  FinancialAdjustment,
  MeasurementRecord,
  MeasurementStatus,
  MobilizationRecord,
  Project,
  Team,
} from '@/domain/types';

interface MeasurementsViewProps {
  teams: Team[];
  projects: Project[];
  entries: DailyEntry[];
  mobilizations: MobilizationRecord[];
  adjustments: FinancialAdjustment[];
  financings: AssetFinancing[];
  measurements: MeasurementRecord[];
  referenceMonth: string;
  selectedTeamId: string;
  includeLegalRep: boolean;
  onToggleLegalRep: (val: boolean) => void;
  onSelectTeamId: (id: string) => void;
  onSaveMobilization: (mob: Omit<MobilizationRecord, 'id'> & { id?: string }) => Promise<void>;
  onDeleteMobilization: (id: string) => Promise<void>;
  onSaveAdjustment: (adj: Omit<FinancialAdjustment, 'id'> & { id?: string }) => Promise<void>;
  onDeleteAdjustment: (id: string) => Promise<void>;
  onUpdateStatus: (status: MeasurementStatus) => Promise<void>;
}

const STATUS_FLOW: Array<{ key: MeasurementStatus; label: string }> = [
  { key: 'aberta', label: 'Aberta' },
  { key: 'revisao', label: 'Em Revisão' },
  { key: 'fechada', label: 'Fechada' },
  { key: 'paga', label: 'Paga' },
];

export function MeasurementsView({
  teams,
  projects,
  entries,
  mobilizations,
  adjustments,
  financings,
  measurements,
  referenceMonth,
  selectedTeamId,
  includeLegalRep,
  onToggleLegalRep,
  onSelectTeamId,
  onSaveMobilization,
  onDeleteMobilization,
  onSaveAdjustment,
  onDeleteAdjustment,
  onUpdateStatus,
}: MeasurementsViewProps) {
  const team = teams.find((t) => t.id === selectedTeamId) ?? teams[0]!;
  const financing = financings.find((f) => f.teamId === team.id && f.active) ?? null;
  const savedMeasurement = measurements.find(
    (m) => m.teamId === team.id && m.referenceMonth === referenceMonth
  );

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
        status: savedMeasurement?.status ?? 'aberta',
        locationOverride: savedMeasurement?.locationLabel ?? null,
      }),
    [team, referenceMonth, entries, mobilizations, adjustments, projects, financing, savedMeasurement]
  );

  const teamMobilizations = useMemo(
    () =>
      mobilizations
        .filter((m) => m.teamId === team.id && m.referenceMonth === referenceMonth)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [mobilizations, team.id, referenceMonth]
  );

  const teamManualAdjustments = useMemo(
    () =>
      adjustments
        .filter((a) => a.teamId === team.id && a.referenceMonth === referenceMonth)
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [adjustments, team.id, referenceMonth]
  );

  const [showMobForm, setShowMobForm] = useState(false);
  const [mobDate, setMobDate] = useState(`${referenceMonth}-10`);
  const [mobOrigin, setMobOrigin] = useState('Pombal/PB');
  const [mobDestination, setMobDestination] = useState('');
  const [mobKm, setMobKm] = useState('');
  const [mobKind, setMobKind] = useState<'mobilizacao' | 'desmobilizacao' | 'deslocamento'>(
    'mobilizacao'
  );
  const [mobPaidInAdvance, setMobPaidInAdvance] = useState(false);
  const [mobAdvanceAmount, setMobAdvanceAmount] = useState('');

  const [showAdjForm, setShowAdjForm] = useState(false);
  const [adjCode, setAdjCode] = useState('4.6');
  const [adjCategory, setAdjCategory] = useState<AdjustmentCategory>('folha_clt');
  const [adjDirection, setAdjDirection] = useState<AdjustmentDirection>('desconto');
  const [adjDesc, setAdjDesc] = useState('');
  const [adjDetails, setAdjDetails] = useState('');
  const [adjDate, setAdjDate] = useState(`${referenceMonth}-28`);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReceipt, setAdjReceipt] = useState('');

  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  async function handleAddMobilization(e: React.FormEvent) {
    e.preventDefault();
    const km = Number(mobKm.replace(',', '.'));
    if (!Number.isFinite(km) || km <= 0) return;
    const adv = mobPaidInAdvance ? Number(mobAdvanceAmount.replace(',', '.')) || 0 : 0;
    await onSaveMobilization({
      teamId: team.id,
      referenceMonth,
      date: mobDate,
      origin: mobOrigin.trim(),
      destination: mobDestination.trim(),
      distanceKm: km,
      kind: mobKind,
      paidInAdvance: mobPaidInAdvance,
      advanceAmount: adv,
      advanceDate: mobPaidInAdvance ? mobDate : null,
      advanceNotes: mobPaidInAdvance ? `Mobilização paga antecipadamente (${mobOrigin} → ${mobDestination})` : null,
    });
    setMobDestination('');
    setMobKm('');
    setMobPaidInAdvance(false);
    setMobAdvanceAmount('');
    setShowMobForm(false);
  }

  async function handleAddAdjustment(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(adjAmount.replace(',', '.'));
    if (!Number.isFinite(val) || val <= 0) return;
    await onSaveAdjustment({
      teamId: team.id,
      referenceMonth,
      code: adjCode.trim() || '4.8',
      category: adjCategory,
      direction: adjDirection,
      description: adjDesc.trim(),
      details: adjDetails.trim() || null,
      date: adjDate || null,
      amount: val,
      receiptRef: adjReceipt.trim() || null,
      receiptUrl: null,
    });
    setAdjDesc('');
    setAdjDetails('');
    setAdjAmount('');
    setAdjReceipt('');
    setShowAdjForm(false);
  }

  async function handleCopyWhatsApp() {
    const lines = [
      `*Terra Sol Engenharia Geotécnica — Boletim de Medição*`,
      `Equipe: *${team.name}* | Referência: *${formatMonthYearPT(referenceMonth)}*`,
      ``,
      `• Mobilização: ${formatDecimalBR(calculation.totals.mobilizationKm)} km (${formatCurrencyBRL(calculation.totals.mobilizationValue)})`,
      calculation.totals.sptMeters > 0
        ? `• Sondagem SPT: ${formatDecimalBR(calculation.totals.sptMeters)} m (${formatCurrencyBRL(calculation.totals.sptValue)})`
        : null,
      calculation.totals.tradoMeters > 0
        ? `• Sondagem a Trado: ${formatDecimalBR(calculation.totals.tradoMeters)} m (${formatCurrencyBRL(calculation.totals.tradoValue)})`
        : null,
      calculation.totals.dailyUnits > 0
        ? `• Diárias: ${formatDecimalBR(calculation.totals.dailyUnits)} unid (${formatCurrencyBRL(calculation.totals.dailyValue)})`
        : null,
      ``,
      `Subtotal Bruto: *${formatCurrencyBRL(calculation.totals.grossSubtotal)}*`,
      `Descontos/Pagamentos: ${formatCurrencyBRL(calculation.totals.netPaymentsSubtotal)}`,
      `*SALDO A PAGAR: ${formatCurrencyBRL(calculation.totals.netPayable)}*`,
      ``,
      `Conferido por Catherine Irina Pascoal Gouveia — Engenheira de Minas`,
    ].filter(Boolean);

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2200);
  }

  const boletimPdfUrl = `/api/pdf/boletim?teamId=${encodeURIComponent(team.id)}&month=${encodeURIComponent(referenceMonth)}&includeLegalRep=${includeLegalRep ? 'true' : 'false'}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#1F6E7A]">
            Fechamento Mensal · {formatMonthYearPT(referenceMonth)}
          </p>
          <h1 className="mt-0.5 text-2xl font-light tracking-tight text-[#181B20]">
            Boletim de Medição & Memória de Cálculo
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="glass-panel inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#525B68]">
            <input
              type="checkbox"
              checked={includeLegalRep}
              onChange={(e) => onToggleLegalRep(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-[#1F6E7A]"
            />
            <span>Assinatura Eng. Damiana</span>
          </label>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs"
          >
            {copiedWhatsApp ? (
              <Check className="h-3.5 w-3.5 text-[#1E7A56]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copiedWhatsApp ? 'Resumo copiado' : 'Resumo WhatsApp'}</span>
          </button>

          <a
            href={boletimPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="download-boletim-pdf"
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm"
          >
            <Download className="h-4 w-4" strokeWidth={1.6} />
            <span>Baixar Boletim PDF</span>
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    ? 'bg-[#1F6E7A] text-white shadow-sm'
                    : 'glass-panel text-[#525B68] hover:text-[#181B20]'
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>

        <div className="glass-panel inline-flex items-center gap-1 rounded-xl p-1">
          {STATUS_FLOW.map((step) => {
            const active = calculation.status === step.key;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => onUpdateStatus(step.key)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? 'bg-[#1F6E7A] text-white'
                    : 'text-[#525B68] hover:bg-black/5 hover:text-[#181B20]'
                }`}
              >
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-[#7C8594]">Subtotal Bruto dos Serviços</p>
          <p className="tabular-nums mt-1.5 text-2xl font-light text-[#181B20]">
            {formatCurrencyBRL(calculation.totals.grossSubtotal)}
          </p>
          <p className="mt-1 text-[11px] text-[#7C8594]">
            Período: {calculation.periodStart} a {calculation.periodEnd}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-[#7C8594]">Pagamentos, Descontos & Reembolsos</p>
          <p className="tabular-nums mt-1.5 text-2xl font-light text-[#181B20]">
            {formatCurrencyBRL(calculation.totals.netPaymentsSubtotal)}
          </p>
          <p className="tabular-nums mt-1 text-[11px] text-[#1E7A56]">
            Reembolsos somados: {formatCurrencyBRL(calculation.totals.reimbursementsTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#1F6E7A]/25 bg-[#1F6E7A]/[0.08] p-4">
          <p className="text-xs font-medium text-[#1F6E7A]">SALDO LÍQUIDO A PAGAR</p>
          <p
            data-testid="net-payable-value"
            className="tabular-nums mt-1.5 text-2xl font-semibold text-[#181B20]"
          >
            {formatCurrencyBRL(calculation.totals.netPayable)}
          </p>
          <p className="mt-1 text-[11px] text-[#525B68]">
            Código: {calculation.authenticityCode}
          </p>
        </div>
      </div>

      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#181B20]/8 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-[#1F6E7A]" strokeWidth={1.6} />
            <h2 className="text-sm font-medium text-[#181B20]">
              Itens 1 a 3 — Serviços Executados ({team.name})
            </h2>
          </div>
          <span className="text-xs text-[#7C8594]">{calculation.locationsSummary}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#181B20]/8 bg-[#F3F4F6]/80 text-[11px] uppercase tracking-wider text-[#525B68]">
                <th className="px-4 py-2.5">Item</th>
                <th className="px-4 py-2.5">Descrição</th>
                <th className="px-4 py-2.5 text-center">Un.</th>
                <th className="px-4 py-2.5 text-right">Valor Unit.</th>
                <th className="px-4 py-2.5 text-right">Quant.</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181B20]/6">
              {calculation.lineItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#7C8594]">
                    Nenhum serviço ou mobilização lançado para {team.name} neste mês.
                  </td>
                </tr>
              ) : (
                calculation.lineItems.map((item) => (
                  <tr key={item.itemCode} className="hover:bg-white/60">
                    <td className="tabular-nums px-4 py-2.5 font-medium text-[#1F6E7A]">
                      {item.itemCode}
                    </td>
                    <td className="px-4 py-2.5 text-[#181B20]">{item.description}</td>
                    <td className="px-4 py-2.5 text-center text-[#525B68]">{item.unit}</td>
                    <td className="tabular-nums px-4 py-2.5 text-right text-[#525B68]">
                      {formatCurrencyBRL(item.unitPrice)}
                    </td>
                    <td className="tabular-nums px-4 py-2.5 text-right font-medium text-[#181B20]">
                      {formatDecimalBR(item.quantity)}
                    </td>
                    <td className="tabular-nums px-4 py-2.5 text-right font-semibold text-[#181B20]">
                      {formatCurrencyBRL(item.totalValue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-[#1F6E7A]" strokeWidth={1.6} />
              <h2 className="text-sm font-medium text-[#181B20]">
                Trechos de Mobilização (Item 1.1)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowMobForm((v) => !v)}
              className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Trecho</span>
            </button>
          </div>

          {showMobForm && (
            <form
              onSubmit={handleAddMobilization}
              className="mb-4 space-y-2.5 rounded-xl border border-[#181B20]/10 bg-white p-3.5"
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={mobDate}
                  onChange={(e) => setMobDate(e.target.value)}
                  className="mineral-input px-2.5 py-1.5 text-xs"
                />
                <select
                  value={mobKind}
                  onChange={(e) =>
                    setMobKind(e.target.value as 'mobilizacao' | 'desmobilizacao' | 'deslocamento')
                  }
                  className="mineral-input px-2.5 py-1.5 text-xs"
                >
                  <option value="mobilizacao">Mobilização</option>
                  <option value="desmobilizacao">Desmobilização</option>
                  <option value="deslocamento">Deslocamento entre obras</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Origem (ex: Pombal/PB)"
                  value={mobOrigin}
                  onChange={(e) => setMobOrigin(e.target.value)}
                  className="mineral-input px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Destino (ex: Recife/PE)"
                  value={mobDestination}
                  onChange={(e) => setMobDestination(e.target.value)}
                  className="mineral-input px-2.5 py-1.5 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Distância (km)"
                  value={mobKm}
                  onChange={(e) => setMobKm(e.target.value)}
                  className="mineral-input px-2.5 py-1.5 text-xs"
                />
                <label className="flex items-center gap-2 px-2 text-xs text-[#525B68]">
                  <input
                    type="checkbox"
                    checked={mobPaidInAdvance}
                    onChange={(e) => setMobPaidInAdvance(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#1F6E7A]"
                  />
                  <span>Pago antecipado</span>
                </label>
              </div>
              {mobPaidInAdvance && (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Valor adiantado (R$)"
                  value={mobAdvanceAmount}
                  onChange={(e) => setMobAdvanceAmount(e.target.value)}
                  className="mineral-input w-full px-2.5 py-1.5 text-xs"
                />
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMobForm(false)}
                  className="btn-secondary px-3 py-1 text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary px-3 py-1 text-xs">
                  Salvar trecho
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#181B20]/6">
            {teamMobilizations.length === 0 ? (
              <p className="py-4 text-xs text-[#7C8594]">Nenhum trecho cadastrado neste mês.</p>
            ) : (
              teamMobilizations.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                  <div>
                    <p className="font-medium text-[#181B20]">
                      {m.origin} → {m.destination}
                    </p>
                    <p className="text-[11px] text-[#7C8594]">
                      {formatDateBR(m.date)} · {m.kind}
                      {m.paidInAdvance
                        ? ` · Adiantado: ${formatCurrencyBRL(m.advanceAmount)}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="tabular-nums font-medium text-[#181B20]">
                      {formatDecimalBR(m.distanceKm, 0)} km
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteMobilization(m.id)}
                      className="text-[#7C8594] hover:text-[#B53D3D]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#1F6E7A]" strokeWidth={1.6} />
              <h2 className="text-sm font-medium text-[#181B20]">
                Item 4 — Descontos, Folha & Reembolsos
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAdjForm((v) => !v)}
              className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Lançar</span>
            </button>
          </div>

          {showAdjForm && (
            <form
              onSubmit={handleAddAdjustment}
              className="mb-4 space-y-2.5 rounded-xl border border-[#181B20]/10 bg-white p-3.5"
            >
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={adjCode}
                  onChange={(e) => setAdjCode(e.target.value)}
                  placeholder="Item (4.6)"
                  className="mineral-input px-2.5 py-1.5 text-xs"
                />
                <select
                  value={adjCategory}
                  onChange={(e) => {
                    const cat = e.target.value as AdjustmentCategory;
                    setAdjCategory(cat);
                    setAdjDirection(cat === 'reembolso' ? 'reembolso' : 'desconto');
                    if (cat === 'reembolso') setAdjCode('4.7');
                    else if (cat === 'folha_clt') setAdjCode('4.6');
                    else if (cat === 'rastreador') setAdjCode('4.5');
                  }}
                  className="mineral-input col-span-2 px-2.5 py-1.5 text-xs"
                >
                  <option value="folha_clt">Folha CLT (Líquido + FGTS)</option>
                  <option value="reembolso">Reembolso de Compra (soma ao saldo)</option>
                  <option value="rastreador">Rastreador Veicular</option>
                  <option value="mobilizacao_paga">Mobilização / Adiantamento Pago</option>
                  <option value="outro_desconto">Outro Desconto</option>
                </select>
              </div>

              <input
                type="text"
                required
                placeholder="Descrição (ex: Folha CLT Novembro ou Termômetro NFC-e)"
                value={adjDesc}
                onChange={(e) => setAdjDesc(e.target.value)}
                className="mineral-input w-full px-2.5 py-1.5 text-xs"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Valor (R$)"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="mineral-input px-2.5 py-1.5 text-xs"
                />
                <input
                  type="date"
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                  className="mineral-input px-2.5 py-1.5 text-xs"
                />
              </div>

              <input
                type="text"
                placeholder="Comprovante / NFC-e / Observação (opcional)"
                value={adjReceipt}
                onChange={(e) => setAdjReceipt(e.target.value)}
                className="mineral-input w-full px-2.5 py-1.5 text-xs"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjForm(false)}
                  className="btn-secondary px-3 py-1 text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary px-3 py-1 text-xs">
                  Adicionar
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#181B20]/6">
            {calculation.paymentItems.length === 0 ? (
              <p className="py-4 text-xs text-[#7C8594]">
                Nenhum desconto ou reembolso aplicado neste período.
              </p>
            ) : (
              calculation.paymentItems.map((pay, idx) => (
                <div key={`${pay.code}-${idx}`} className="flex items-start justify-between gap-2 py-2.5 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="tabular-nums font-medium text-[#1F6E7A]">{pay.code}</span>
                      <span className="font-medium text-[#181B20]">{pay.description}</span>
                      {pay.autoGenerated && (
                        <span className="rounded-full bg-[#1F6E7A]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#1F6E7A]">
                          Auto
                        </span>
                      )}
                    </div>
                    {pay.details && (
                      <p className="mt-0.5 text-[11px] text-[#7C8594]">{pay.details}</p>
                    )}
                  </div>
                  <span
                    className={`tabular-nums shrink-0 font-semibold ${
                      pay.direction === 'reembolso' ? 'text-[#1E7A56]' : 'text-[#181B20]'
                    }`}
                  >
                    {pay.direction === 'reembolso'
                      ? `+ ${formatCurrencyBRL(pay.amount)}`
                      : `- ${formatCurrencyBRL(pay.amount)}`}
                  </span>
                </div>
              ))
            )}
          </div>

          {teamManualAdjustments.length > 0 && (
            <div className="mt-3 border-t border-[#181B20]/8 pt-3">
              <p className="mb-1.5 text-[11px] font-medium text-[#7C8594]">
                Lançamentos manuais editáveis ({teamManualAdjustments.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {teamManualAdjustments.map((adj) => (
                  <span
                    key={adj.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-[11px] text-[#525B68]"
                  >
                    <span>
                      {adj.description} ({formatCurrencyBRL(adj.amount)})
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteAdjustment(adj.id)}
                      className="text-[#7C8594] hover:text-[#B53D3D]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {calculation.financingSnapshot && (
        <section className="glass-panel overflow-hidden rounded-2xl border-[#C48829]/30">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C48829]/20 bg-[#C48829]/[0.07] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#B57415]" strokeWidth={1.6} />
              <div>
                <h2 className="text-sm font-medium text-[#181B20]">
                  Amortização do Veículo — {calculation.financingSnapshot.financing.assetName}
                </h2>
                <p className="text-[11px] text-[#525B68]">
                  Regra automática: {calculation.financingSnapshot.financing.monthlyDeductionPercent}% sobre o bruto da medição · Valor original {formatCurrencyBRL(calculation.financingSnapshot.financing.totalValue)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-[#7C8594]">Saldo Devedor Atual</p>
              <p className="tabular-nums text-base font-semibold text-[#181B20]">
                {formatCurrencyBRL(calculation.financingSnapshot.remainingBalance)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#181B20]/8 bg-[#F8F9FA] text-[11px] text-[#525B68]">
                  <th className="px-4 py-2">Boletim de Medição</th>
                  <th className="px-4 py-2 text-right">Desconto</th>
                  <th className="px-4 py-2 text-right">Pago Acumulado</th>
                  <th className="px-4 py-2 text-right">Saldo a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181B20]/6">
                {calculation.financingSnapshot.rows.map((row, idx, arr) => {
                  const isCurrent = idx === arr.length - 1;
                  return (
                    <tr
                      key={row.id}
                      className={isCurrent ? 'bg-[#C48829]/[0.08] font-semibold' : ''}
                    >
                      <td className="px-4 py-2 text-[#181B20]">{row.label}</td>
                      <td className="tabular-nums px-4 py-2 text-right text-[#181B20]">
                        {formatCurrencyBRL(row.discountAmount)}
                      </td>
                      <td className="tabular-nums px-4 py-2 text-right text-[#525B68]">
                        {formatCurrencyBRL(row.accumulatedPaid)}
                      </td>
                      <td className="tabular-nums px-4 py-2 text-right text-[#181B20]">
                        {formatCurrencyBRL(row.remainingBalance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
