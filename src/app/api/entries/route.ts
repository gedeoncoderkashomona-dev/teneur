import { NextResponse } from 'next/server';
import { dailyEntryInputSchema } from '@/domain/schemas';
import { deleteDailyEntry, upsertDailyEntry } from '@/services/teneur-repository';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = dailyEntryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos no apontamento diário', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const saved = await upsertDailyEntry(parsed.data);
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }
  await deleteDailyEntry(id);
  return NextResponse.json({ ok: true });
}
