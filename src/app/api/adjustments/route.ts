import { NextResponse } from 'next/server';
import { financialAdjustmentInputSchema } from '@/domain/schemas';
import {
  deleteFinancialAdjustment,
  upsertFinancialAdjustment,
} from '@/services/teneur-repository';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = financialAdjustmentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos no lançamento financeiro', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const saved = await upsertFinancialAdjustment(parsed.data);
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }
  await deleteFinancialAdjustment(id);
  return NextResponse.json({ ok: true });
}
