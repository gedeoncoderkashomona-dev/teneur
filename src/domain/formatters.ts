const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTHS_SHORT_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundMeters(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatCurrencyBRL(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatDecimalBR(value: number, decimals = 2): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
}

export function formatDateBR(isoDate: string | null | undefined): string {
  if (!isoDate) return '-';
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatShortDayMonth(isoDate: string): string {
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

export function formatMonthYearPT(referenceMonth: string): string {
  const [yearStr, monthStr] = referenceMonth.split('-');
  const idx = Number(monthStr) - 1;
  if (!yearStr || idx < 0 || idx > 11) return referenceMonth;
  return `${MONTHS_PT[idx]}/${yearStr}`;
}

export function formatMonthShortPT(referenceMonth: string): string {
  const [yearStr, monthStr] = referenceMonth.split('-');
  const idx = Number(monthStr) - 1;
  if (!yearStr || idx < 0 || idx > 11) return referenceMonth;
  return `${MONTHS_SHORT_PT[idx]}/${yearStr.slice(-2)}`;
}

export function formatTimestampBR(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Recife',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function getMonthDateBounds(referenceMonth: string): {
  periodStart: string;
  periodEnd: string;
  daysInMonth: number;
} {
  const [yearStr, monthStr] = referenceMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const daysInMonth = new Date(year, month, 0).getDate();
  const paddedMonth = String(month).padStart(2, '0');
  const paddedEnd = String(daysInMonth).padStart(2, '0');
  return {
    periodStart: `${year}-${paddedMonth}-01`,
    periodEnd: `${year}-${paddedMonth}-${paddedEnd}`,
    daysInMonth,
  };
}

export function generateAuthenticityCode(
  scope: string,
  referenceMonth: string,
  checksumValue: number
): string {
  const payload = `TENEUR|${scope.toUpperCase()}|${referenceMonth}|${Math.round(checksumValue * 100)}`;
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `TNR-${referenceMonth.replace('-', '')}-${hex}`;
}
