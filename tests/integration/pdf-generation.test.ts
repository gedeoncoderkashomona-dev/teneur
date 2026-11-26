import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { calculateMeasurement } from '@/domain/billing-engine';
import { computeExecutiveAnalytics } from '@/domain/analytics';
import { TERRA_SOL_SEED } from '@/data/terra-sol-seed';
import { BoletimMedicaoPdf } from '@/pdf/boletim-medicao-pdf';
import { RelatorioExecutivoNbrPdf } from '@/pdf/relatorio-executivo-nbr-pdf';

describe('Teneur Vector PDF Generation (Boletim + Relatório NBR)', () => {
  it('gera PDF vetorial válido para Boletim de Medição + Memória de Cálculo (Leonardo)', async () => {
    const leonardo = TERRA_SOL_SEED.teams.find((t) => t.id === 'team-leonardo')!;
    const financing = TERRA_SOL_SEED.financings.find((f) => f.teamId === 'team-leonardo')!;
    const calculation = calculateMeasurement({
      team: leonardo,
      referenceMonth: '2026-10',
      entries: TERRA_SOL_SEED.dailyEntries,
      mobilizations: TERRA_SOL_SEED.mobilizations,
      adjustments: TERRA_SOL_SEED.adjustments,
      projects: TERRA_SOL_SEED.projects,
      financing,
      status: 'fechada',
    });

    const buffer = await renderToBuffer(
      React.createElement(BoletimMedicaoPdf, {
        calculation,
        signatory: { ...TERRA_SOL_SEED.signatory, includeLegalRepresentative: false },
        generatedAt: new Date('2026-11-25T21:00:00Z'),
      }) as unknown as React.ReactElement<Record<string, unknown>>
    );

    expect(buffer.byteLength).toBeGreaterThan(3500);
    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('gera PDF vetorial válido com assinatura opcional da Representante Legal', async () => {
    const ramon = TERRA_SOL_SEED.teams.find((t) => t.id === 'team-ramon')!;
    const calculation = calculateMeasurement({
      team: ramon,
      referenceMonth: '2026-10',
      entries: TERRA_SOL_SEED.dailyEntries,
      mobilizations: TERRA_SOL_SEED.mobilizations,
      adjustments: TERRA_SOL_SEED.adjustments,
      projects: TERRA_SOL_SEED.projects,
      status: 'fechada',
    });

    const buffer = await renderToBuffer(
      React.createElement(BoletimMedicaoPdf, {
        calculation,
        signatory: { ...TERRA_SOL_SEED.signatory, includeLegalRepresentative: true },
        generatedAt: new Date('2026-11-25T21:00:00Z'),
      }) as unknown as React.ReactElement<Record<string, unknown>>
    );

    expect(buffer.byteLength).toBeGreaterThan(3000);
    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('gera Relatório Executivo Técnico-Gerencial conforme ABNT NBR em PDF válido', async () => {
    const analytics = computeExecutiveAnalytics(TERRA_SOL_SEED, '2026-10');
    const buffer = await renderToBuffer(
      React.createElement(RelatorioExecutivoNbrPdf, {
        analytics,
        signatory: TERRA_SOL_SEED.signatory,
        generatedAt: new Date('2026-11-25T21:00:00Z'),
      }) as unknown as React.ReactElement<Record<string, unknown>>
    );

    expect(buffer.byteLength).toBeGreaterThan(4500);
    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });
});
