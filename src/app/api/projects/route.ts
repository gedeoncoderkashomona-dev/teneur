import { NextResponse } from 'next/server';
import { projectInputSchema } from '@/domain/schemas';
import { upsertProject } from '@/services/teneur-repository';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = projectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos na obra/pasta', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const saved = await upsertProject(parsed.data);
  return NextResponse.json(saved, { status: 201 });
}
