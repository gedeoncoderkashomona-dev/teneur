import { NextResponse } from 'next/server';
import { mobilizationInputSchema } from '@/domain/schemas';
import { deleteMobilization, upsertMobilization } from '@/services/teneur-repository';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = mobilizationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos na mobilização', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const saved = await upsertMobilization(parsed.data);
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }
  await deleteMobilization(id);
  return NextResponse.json({ ok: true });
}
