import React from 'react';
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { calculateMeasurement } from '@/domain/billing-engine';
import { getDataset } from '@/services/teneur-repository';
import { BoletimMedicaoPdf } from '@/pdf/boletim-medicao-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const month = searchParams.get('month') || '2026-10';
  const includeLegalRepParam = searchParams.get('includeLegalRep');

  const { dataset } = await getDataset();
  const team = dataset.teams.find((t) => t.id === teamId) ?? dataset.teams[0];
  if (!team) {
    return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 });
  }

  const financing = dataset.financings.find((f) => f.teamId === team.id && f.active) ?? null;
  const savedMeasurement = dataset.measurements.find(
    (m) => m.teamId === team.id && m.referenceMonth === month
  );

  const calculation = calculateMeasurement({
    team,
    referenceMonth: month,
    entries: dataset.dailyEntries,
    mobilizations: dataset.mobilizations,
    adjustments: dataset.adjustments,
    projects: dataset.projects,
    financing,
    status: savedMeasurement?.status ?? 'aberta',
    locationOverride: savedMeasurement?.locationLabel ?? null,
  });

  const signatory = {
    ...dataset.signatory,
    includeLegalRepresentative:
      includeLegalRepParam !== null
        ? includeLegalRepParam === 'true'
        : dataset.signatory.includeLegalRepresentative,
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(BoletimMedicaoPdf, {
      calculation,
      signatory,
      generatedAt: new Date(),
    }) as unknown as React.ReactElement<Record<string, unknown>>
  );

  const safeName = team.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Teneur_Boletim_${safeName}_${month}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
