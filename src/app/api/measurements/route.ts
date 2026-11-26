import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateMeasurementStatus } from '@/services/teneur-repository';

const statusSchema = z.object({
  teamId: z.string().min(1),
  referenceMonth: z.string().regex(/^\d{4}-\d{2}$/),
  status: z.enum(['aberta', 'revisao', 'fechada', 'paga']),
  notes: z.string().max(400).nullable().optional(),
});

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Status de medição inválido', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updated = await updateMeasurementStatus(parsed.data);
  return NextResponse.json(updated);
}
