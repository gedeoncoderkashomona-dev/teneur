import React from 'react';
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { computeExecutiveAnalytics } from '@/domain/analytics';
import { getDataset } from '@/services/teneur-repository';
import { RelatorioExecutivoNbrPdf } from '@/pdf/relatorio-executivo-nbr-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || '2026-10';
  const includeLegalRepParam = searchParams.get('includeLegalRep');

  const { dataset } = await getDataset();
  const analytics = computeExecutiveAnalytics(dataset, month);

  const signatory = {
    ...dataset.signatory,
    includeLegalRepresentative:
      includeLegalRepParam !== null
        ? includeLegalRepParam === 'true'
        : dataset.signatory.includeLegalRepresentative,
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(RelatorioExecutivoNbrPdf, {
      analytics,
      signatory,
      generatedAt: new Date(),
    }) as unknown as React.ReactElement<Record<string, unknown>>
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Teneur_Relatorio_Executivo_NBR_${month}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
