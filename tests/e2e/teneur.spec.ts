import { expect, test } from '@playwright/test';

test.describe('Teneur E2E — Fluxo Completo Desktop & Mobile', () => {
  test('renderiza Painel Executivo, valida Boletins reais, Diário e PDFs vetoriais', async ({
    page,
    request,
    isMobile,
  }) => {
    await page.goto('/');

    await expect(page.getByTestId('teneur-splash')).toBeHidden({ timeout: 6000 });
    await expect(page.getByText('Inteligência Operacional & Medições')).toBeVisible();
    await expect(page.locator('footer')).toContainText('Teneur - Gestão de Serviços');
    await expect(page.locator('footer')).toContainText('Desenvolvido por Okapi Code Forge');

    const companyTrigger = isMobile
      ? page.getByTestId('mobile-company-switcher')
      : page.getByTestId('company-switcher');
    await expect(companyTrigger).toBeVisible();
    await companyTrigger.click();
    await expect(page.getByTestId('add-company-btn')).toBeVisible();
    await companyTrigger.click();

    const measurementsNav = isMobile
      ? page.getByTestId('mobile-nav-measurements')
      : page.getByTestId('nav-measurements');
    await measurementsNav.click();

    await expect(page.getByText('Boletim de Medição & Memória de Cálculo')).toBeVisible();
    await page.getByRole('button', { name: 'Leonardo', exact: true }).click();
    await expect(page.getByTestId('net-payable-value')).toContainText('14.045,76');
    await expect(page.getByText('88.769,60').first()).toBeVisible();

    await page.getByRole('button', { name: 'Ramon', exact: true }).click();
    await expect(page.getByTestId('net-payable-value')).toContainText('12.283,40');

    const boletimRes = await request.get(
      '/api/pdf/boletim?teamId=team-leonardo&month=2026-10&includeLegalRep=false'
    );
    expect(boletimRes.status()).toBe(200);
    expect(boletimRes.headers()['content-type']).toContain('application/pdf');
    const boletimBytes = await boletimRes.body();
    expect(boletimBytes.subarray(0, 5).toString('utf8')).toBe('%PDF-');

    const nbrRes = await request.get('/api/pdf/relatorio-nbr?month=2026-10&includeLegalRep=true');
    expect(nbrRes.status()).toBe(200);
    expect(nbrRes.headers()['content-type']).toContain('application/pdf');
    const nbrBytes = await nbrRes.body();
    expect(nbrBytes.subarray(0, 5).toString('utf8')).toBe('%PDF-');

    const diaryNav = isMobile
      ? page.getByTestId('mobile-nav-diary')
      : page.getByTestId('nav-diary');
    await diaryNav.click();
    await expect(page.getByText('Controle Diário das Equipes')).toBeVisible();
  });
});
