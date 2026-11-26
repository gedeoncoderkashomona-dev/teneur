import { expect, test } from '@playwright/test';

test.describe('Teneur E2E — Desktop & iPhone 14–18 Responsiveness', () => {
  test('valida Splash, Multi-Empresa, zero overflow horizontal, Calendário .ics, Boletins e PDFs', async ({
    page,
    request,
    isMobile,
  }) => {
    async function assertNoHorizontalOverflow() {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }

    await page.goto('/');

    await expect(page.getByTestId('teneur-splash')).toBeHidden({ timeout: 6000 });
    await expect(page.getByText('Inteligência Operacional & Medições')).toBeVisible();
    await expect(page.locator('footer')).toContainText('Teneur - Gestão de Serviços');
    await expect(page.locator('footer')).toContainText('Desenvolvido por Okapi Code Forge');
    await assertNoHorizontalOverflow();

    const companyTrigger = isMobile
      ? page.getByTestId('mobile-company-switcher')
      : page.getByTestId('company-switcher');
    await expect(companyTrigger).toBeVisible();
    await companyTrigger.click();
    await expect(page.getByTestId('add-company-btn')).toBeVisible();
    await companyTrigger.click();

    await page.getByTestId('reminders-btn').click();
    await expect(page.getByTestId('download-ics-all')).toBeVisible();
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-x') }).click();

    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await assertNoHorizontalOverflow();
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    const navPrefix = isMobile ? 'mobile-nav' : 'nav';

    await page.getByTestId(`${navPrefix}-measurements`).click();
    await expect(page.getByText('Boletim de Medição & Memória de Cálculo')).toBeVisible();
    await page.getByRole('button', { name: 'Leonardo', exact: true }).click();
    await expect(page.getByTestId('net-payable-value')).toContainText('14.045,76');
    await expect(page.getByText('88.769,60').first()).toBeVisible();
    await assertNoHorizontalOverflow();

    await page.getByRole('button', { name: 'Ramon', exact: true }).click();
    await expect(page.getByTestId('net-payable-value')).toContainText('12.283,40');

    await page.getByTestId(`${navPrefix}-diary`).click();
    await expect(page.getByText('Controle Diário das Equipes')).toBeVisible();
    await assertNoHorizontalOverflow();

    await page.getByTestId(`${navPrefix}-teams`).click();
    await expect(page.getByText('Sondadores e Tabelas Contratuais')).toBeVisible();
    await assertNoHorizontalOverflow();

    await page.getByTestId(`${navPrefix}-projects`).click();
    await expect(page.getByText('Pastas, Clientes e Custos de Campo')).toBeVisible();
    await assertNoHorizontalOverflow();

    const icsRes = await request.get('/api/calendar/reminders?type=all&hour=18&minute=00&closingDay=28');
    expect(icsRes.status()).toBe(200);
    expect(icsRes.headers()['content-type']).toContain('text/calendar');
    const icsText = await icsRes.text();
    expect(icsText).toContain('BEGIN:VCALENDAR');
    expect(icsText).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA');
    expect(icsText).toContain('RRULE:FREQ=MONTHLY;BYMONTHDAY=28');

    const iconRes = await request.get('/apple-touch-icon.png');
    expect(iconRes.status()).toBe(200);

    const swRes = await request.get('/sw.js');
    expect(swRes.status()).toBe(200);

    const boletimRes = await request.get(
      '/api/pdf/boletim?teamId=team-leonardo&month=2026-10&includeLegalRep=false'
    );
    expect(boletimRes.status()).toBe(200);
    expect(boletimRes.headers()['content-type']).toContain('application/pdf');
    expect((await boletimRes.body()).subarray(0, 5).toString('utf8')).toBe('%PDF-');

    const nbrRes = await request.get('/api/pdf/relatorio-nbr?month=2026-10&includeLegalRep=true');
    expect(nbrRes.status()).toBe(200);
    expect(nbrRes.headers()['content-type']).toContain('application/pdf');
    expect((await nbrRes.body()).subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });
});
