import { NextResponse } from 'next/server';
import { z } from 'zod';
import { companyProfileInputSchema } from '@/domain/schemas';
import { activateCompanyProfile, upsertCompanyProfile } from '@/services/teneur-repository';

const activateSchema = z.object({
  companyId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = companyProfileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos da empresa', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const saved = await upsertCompanyProfile(parsed.data);
  return NextResponse.json(saved, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Empresa inválida' }, { status: 400 });
  }
  const active = await activateCompanyProfile(parsed.data.companyId);
  if (!active) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
  }
  return NextResponse.json(active);
}
