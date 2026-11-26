import { NextResponse } from 'next/server';
import { signatoryConfigSchema } from '@/domain/schemas';
import { updateSignatorySettings } from '@/services/teneur-repository';

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = signatoryConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Configuração de assinatura inválida', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updated = await updateSignatorySettings(parsed.data);
  return NextResponse.json(updated);
}
