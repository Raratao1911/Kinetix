import { test, expect } from '@playwright/test';

const session = perfil => ({ usuarioId: 7, nome: 'Conta Teste', perfil, token: 'token-de-teste', tipoToken: 'Bearer', expiraEm: new Date(Date.now() + 3600000).toISOString() });

async function mockApi(page, perfil = 'PACIENTE') {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    let body = [];
    let status = 200;
    if (path.includes('/auth/')) { body = session(perfil); status = path.endsWith('/login') ? 200 : 201; }
    if (path === '/api/v1/fisioterapeuta/pacientes') body = [{ usuarioId: 42, nome: 'Paciente Vinculado' }];
    if (path === '/api/v1/fisioterapeuta/exercicios') body = [{ id: 3, nome: 'Alongamento' }];
    if (path === '/api/v1/paciente/diario-dor' && route.request().method() === 'POST') body = { id: 1, escalaEva: 5, observacao: 'Teste de registro', registradoEm: new Date().toISOString() };
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function login(page, perfil = 'PACIENTE') {
  await mockApi(page, perfil);
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('teste@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Senha123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/dashboard$/);
}

test('cadastro de paciente envia o contrato correto', async ({ page }) => {
  await mockApi(page);
  await page.goto('/cadastro');
  await page.getByLabel('Nome', { exact: true }).fill('Paciente Teste');
  await page.getByLabel('Email', { exact: true }).fill('teste@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Senha123!');
  await page.getByRole('checkbox').check();
  const request = page.waitForRequest(r => r.url().endsWith('/api/v1/auth/pacientes'));
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({ nome: 'Paciente Teste', email: 'teste@example.com' });
  await expect(page).toHaveURL(/login$/);
});

test('login, diario, recarregamento e logout do paciente', async ({ page }) => {
  await login(page);
  await expect(page.getByText('Bem-vindo, Conta Teste.')).toBeVisible();
  await page.getByRole('slider').focus();
  for (let i = 0; i < 5; i++) await page.getByRole('slider').press('ArrowRight');
  await page.getByLabel('Observação', { exact: true }).fill('Teste de registro');
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await expect(page.getByText('Teste de registro', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Bem-vindo, Conta Teste.')).toBeVisible();
  await page.goto('/prescritor');
  await expect(page).toHaveURL(/dashboard$/);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/login$/);
  expect(await page.evaluate(() => localStorage.getItem('kinetix.session'))).toBeNull();
});

test('sessao corrompida e expirada redireciona para login', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('kinetix.session', '{invalido'));
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login$/);
  await page.evaluate(data => localStorage.setItem('kinetix.session', JSON.stringify(data)), { ...session('PACIENTE'), expiraEm: '2020-01-01T00:00:00Z' });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login$/);
});

test('prescritor usa usuarioId e envia os itens', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await login(page, 'FISIO');
  await page.getByRole('link', { name: 'Prescritor digital' }).click();
  await page.getByRole('combobox').selectOption('42');
  await page.getByRole('button', { name: 'Adicionar exercício' }).click();
  await page.getByRole('combobox').nth(1).selectOption('3');
  page.once('dialog', dialog => dialog.accept());
  const request = page.waitForRequest(r => r.url().endsWith('/api/v1/fisioterapeuta/pacientes/42/prescricoes'));
  await page.getByRole('button', { name: 'Salvar Plano' }).click();
  expect((await request).postDataJSON().itens).toEqual([expect.objectContaining({ exercicioId: 3, ordem: 1, series: 3, repeticoes: 10 })]);
  expect(errors).toEqual([]);
  await expect(page.getByRole('link', { name: 'Minha conta' })).toBeVisible();
});

test('formularios e painel cabem na tela', async ({ page }, testInfo) => {
  for (const path of ['/login', '/cadastro']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await login(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
});
