import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function formatIcsDateTimeLocal(year: number, month: number, day: number, hour: number, minute: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const dailyHour = Math.min(22, Math.max(7, Number(searchParams.get('hour') || '18')));
  const dailyMinute = Math.min(59, Math.max(0, Number(searchParams.get('minute') || '0')));
  const closingDay = Math.min(28, Math.max(25, Number(searchParams.get('closingDay') || '28')));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teneur.vercel.app';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dtstamp = `${now.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;

  const events: string[] = [];

  if (type === 'daily' || type === 'all') {
    const start = formatIcsDateTimeLocal(year, month, day, dailyHour, dailyMinute);
    const end = formatIcsDateTimeLocal(year, month, day, dailyHour, Math.min(59, dailyMinute + 15));
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:teneur-diario-${year}${month}@okapicodeforge`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;TZID=America/Recife:${start}`,
        `DTEND;TZID=America/Recife:${end}`,
        'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA',
        `SUMMARY:${escapeIcsText('Teneur — Apontamento Diário das Equipes')}`,
        `DESCRIPTION:${escapeIcsText(
          `Atualizar o Diário de Campo no Teneur (furos, ensaios, mobilizações e status das equipes).\nAcesse: ${appUrl}`
        )}`,
        `URL:${appUrl}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT10M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Hora de registrar a produção diária das equipes no Teneur',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n')
    );
  }

  if (type === 'monthly' || type === 'all') {
    const start = formatIcsDateTimeLocal(year, month, closingDay, 9, 0);
    const end = formatIcsDateTimeLocal(year, month, closingDay, 10, 0);
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:teneur-fechamento-mensal-${year}${month}@okapicodeforge`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;TZID=America/Recife:${start}`,
        `DTEND;TZID=America/Recife:${end}`,
        `RRULE:FREQ=MONTHLY;BYMONTHDAY=${closingDay}`,
        `SUMMARY:${escapeIcsText('Teneur — Fechamento de Medições & Relatório NBR')}`,
        `DESCRIPTION:${escapeIcsText(
          `Conferir dias sem registro, fechar os Boletins de Medição das equipes e gerar o Relatório Executivo NBR para apresentação mensal.\nAcesse: ${appUrl}`
        )}`,
        `URL:${appUrl}`,
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Amanhã é dia de fechamento mensal e geração dos PDFs no Teneur',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Fechar medições mensais e baixar o Relatório Executivo NBR no Teneur',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n')
    );
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Okapi Code Forge//Teneur Gestao de Servicos//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Teneur — Lembretes de Campo e Medição',
    'X-WR-TIMEZONE:America/Recife',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  const filename =
    type === 'daily'
      ? 'Teneur_Lembrete_Diario.ics'
      : type === 'monthly'
        ? 'Teneur_Fechamento_Mensal.ics'
        : 'Teneur_Lembretes_Completos.ics';

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
