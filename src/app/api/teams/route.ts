import { NextResponse } from 'next/server';
import { teamInputSchema } from '@/domain/schemas';
import { upsertTeam } from '@/services/teneur-repository';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = teamInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos na equipe', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const saved = await upsertTeam(parsed.data);
  return NextResponse.json(saved, { status: 201 });
}
