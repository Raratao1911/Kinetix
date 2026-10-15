import { test, expect } from '@playwright/test';

const session = perfil => ({ usuarioId: 7, nome: 'Conta Teste', perfil, token: 'token-de-teste', tipoToken: 'Bearer', expiraEm: new Date(Date.now() + 3600000).toISOString() });

async function mockApi(page, perfil = 'PACIENTE') {
  let profile = { usuarioId: 7, nome: 'Conta Teste', email: 'teste@example.com', perfil, telefone: '+5511999999999',
    cidade: 'Barueri', uf: 'SP', bairro: null, cep: null, logradouro: null, numero: null,
    telefoneAdicional: null, paisTelefoneAdicional: null, fotoDisponivel: false, completo: false };
  let photo = null;
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body = [];
    let status = 200;
    if (path === '/api/v1/perfil') {
      if (route.request().method() === 'PUT') {
        const request = new Request(route.request().url(), { method: 'PUT', headers: route.request().headers(), body: route.request().postDataBuffer() });
        const parts = await request.formData();
        const data = JSON.parse(await parts.get('dados').text());
        if (parts.has('foto')) photo = Buffer.from(await parts.get('foto').arrayBuffer());
        else if (data.removerFoto) photo = null;
        profile = { ...profile, ...data, fotoDisponivel: Boolean(photo),
          completo: Boolean(data.cep && data.logradouro && data.numero && data.bairro && data.cidade && data.uf) };
      }
      return route.fulfill({ json: profile });
    }
    if (path === '/api/v1/perfil/foto') return photo
      ? route.fulfill({ contentType: 'image/jpeg', body: photo }) : route.fulfill({ status: 404, json: {} });
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
  await page.getByLabel('Telefone', { exact: true }).fill('11999999999');
  await page.getByLabel('Data de nascimento', { exact: true }).fill('2000-01-01');
  await page.getByLabel('Cidade', { exact: true }).fill('Barueri');
  await page.getByLabel('Estado', { exact: true }).selectOption('SP');
  await page.getByLabel('CPF', { exact: true }).fill('529.982.247-24');
  await page.getByRole('checkbox', { name: /Aceito os termos/ }).check();
  await page.route('**/api/v1/auth/pacientes', route => route.request().postDataJSON().documentoIdentidade === '52998224724'
    ? route.fulfill({ status: 400, json: { mensagem: 'CPF inválido. Confira os dígitos informados.' } })
    : route.fallback());
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  await expect(page.getByText('CPF inválido. Confira os dígitos informados.')).toBeVisible();
  await page.getByLabel('CPF', { exact: true }).fill('529.982.247-25');
  const request = page.waitForRequest(r => r.url().endsWith('/api/v1/auth/pacientes'));
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({ nome: 'Paciente Teste', email: 'teste@example.com', telefone: '+5511999999999', dataNascimento: '2000-01-01', cidade: 'Barueri', uf: 'SP', documentoIdentidade: '52998224725' });
  await expect(page).toHaveURL(/configuracao-perfil$/);
  await expect(page.getByText(/Você pode pular esta etapa/)).toBeVisible();
  await page.getByRole('link', { name: 'Pular por enquanto', exact: true }).click();
  await expect(page).toHaveURL(/dashboard$/);
  await expect(page.getByRole('link', { name: 'Completar perfil', exact: true })).toBeVisible();
});

test('cadastro exige dados e limita nascimento e telefone', async ({ page }) => {
  await mockApi(page);
  await page.goto('/cadastro');
  for (const field of ['Telefone', 'CPF', 'Data de nascimento', 'Cidade', 'Estado']) {
    await expect(page.getByLabel(field, { exact: true })).toHaveAttribute('required', '');
  }
  const birth = page.getByLabel('Data de nascimento', { exact: true });
  await birth.fill('1899-12-31');
  expect(await birth.evaluate(input => input.validity.rangeUnderflow)).toBe(true);
  await birth.fill('2017-01-01');
  expect(await birth.evaluate(input => input.validity.rangeOverflow)).toBe(true);
  for (const date of ['1900-01-01', '2016-12-31']) {
    await birth.fill(date);
    expect(await birth.evaluate(input => input.checkValidity())).toBe(true);
  }
  await page.getByLabel('Nome', { exact: true }).fill('Paciente Teste');
  await page.getByLabel('Email', { exact: true }).fill('teste@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Senha123!');
  await page.getByLabel('Cidade', { exact: true }).fill('Barueri');
  await page.getByLabel('Estado', { exact: true }).selectOption('SP');
  await page.getByRole('checkbox', { name: /Aceito os termos/ }).check();
  await page.getByLabel('Telefone', { exact: true }).fill('12');
  await page.getByLabel('CPF', { exact: true }).fill('52998224725');
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  await expect(page.getByText('Informe um telefone válido para o país selecionado.')).toBeVisible();
  await page.getByLabel('País do telefone', { exact: true }).selectOption('US');
  await page.getByLabel('Telefone', { exact: true }).fill('2025550123');
  const request = page.waitForRequest(r => r.url().endsWith('/api/v1/auth/pacientes'));
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  expect((await request).postDataJSON().telefone).toBe('+12025550123');
});

test('limites de digitos do CPF e telefone variam por pais', async ({ page }) => {
  await page.goto('/cadastro');
  const cpf = page.getByLabel('CPF', { exact: true });
  await cpf.fill('123456789012345');
  await expect(cpf).toHaveValue('12345678901');
  await cpf.pressSequentially('99');
  await expect(cpf).toHaveValue('12345678901');
  await cpf.fill('529.982.247-25');
  await expect(cpf).toHaveValue('52998224725');
  await cpf.fill('abc');
  await expect(cpf).toHaveValue('');
  const phone = page.getByLabel('Telefone', { exact: true });
  await phone.fill('+55 (11) 99999-9999');
  await expect(phone).toHaveValue('11999999999');
  await phone.pressSequentially('99');
  await expect(phone).toHaveValue('11999999999');
  await phone.fill('(11) 3333-4444');
  await expect(phone).toHaveValue('1133334444');
  for (const [country, number] of [['US', '2025550123'], ['PT', '912345678'], ['GB', '2079460958'], ['DE', '3012345678901']]) {
    await page.getByLabel('País do telefone', { exact: true }).selectOption(country);
    await expect(phone).toHaveValue('');
    await phone.fill(number);
    await expect(phone).toHaveValue(number);
    await phone.pressSequentially('99');
    await expect(phone).toHaveValue(number);
  }
});

test('cadastro de fisioterapeuta envia CREFITO e localizacao', async ({ page }) => {
  await mockApi(page, 'FISIO');
  await page.goto('/cadastro');
  await page.getByRole('combobox', { name: 'Perfil', exact: true }).selectOption('FISIO');
  await page.getByLabel('Nome', { exact: true }).fill('Fisio Teste');
  await page.getByLabel('Email', { exact: true }).fill('fisio@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Senha123!');
  await page.getByLabel('CREFITO', { exact: true }).fill('12345');
  await page.getByLabel('CPF', { exact: true }).fill('52998224725');
  await page.getByLabel('Estado do CREFITO', { exact: true }).fill('SP');
  await page.getByLabel('Cidade', { exact: true }).fill('Barueri');
  await page.getByLabel('Estado', { exact: true }).selectOption('SP');
  await page.getByRole('checkbox', { name: /Aceito os termos/ }).check();
  const request = page.waitForRequest(r => r.url().endsWith('/api/v1/auth/fisioterapeutas'));
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({ crefitoNumero: '12345', crefitoUf: 'SP', cidade: 'Barueri', uf: 'SP' });
  await expect(page).toHaveURL(/configuracao-perfil$/);
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

test('falha no diario preserva as consultas carregadas', async ({ page }) => {
  await login(page);
  await page.route('**/api/v1/consultas/minhas', route => route.fulfill({ json: [{
    id: 1, fisioterapeutaNome: 'Profissional de teste', servicoNome: 'Consulta de teste',
    inicio: new Date().toISOString(), status: 'SOLICITADA'
  }] }));
  await page.route('**/api/v1/paciente/diario-dor', route => route.fulfill({ status: 500, json: {} }));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('diário de dor');
  await expect(page.getByText('Profissional de teste', { exact: true })).toBeVisible();
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

test('perfil salva endereco telefone opcional e foto apos novo login', async ({ page }, testInfo) => {
  await login(page);
  await page.getByRole('link', { name: 'Configuração de perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Configuração de perfil', exact: true })).toBeVisible();
  await expect(page.getByLabel('Cidade', { exact: true })).toHaveValue('Barueri');
  await page.getByLabel('CEP', { exact: true }).fill('06400000');
  await page.getByLabel('Rua', { exact: true }).fill('Rua das Flores');
  await page.getByLabel('Número', { exact: true }).fill('123');
  await page.getByLabel('Bairro', { exact: true }).fill('Centro');
  await page.getByLabel('País do telefone adicional', { exact: true }).selectOption('US');
  await page.getByLabel('Telefone adicional (opcional)', { exact: true }).fill('2025550123');
  await page.getByLabel('Foto de perfil', { exact: true }).setInputFiles('public/logolight.png');
  await expect(page.getByRole('img', { name: 'Foto de perfil', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar perfil', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Seu endereço está completo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('perfil.png'), fullPage: true });
  await page.getByRole('link', { name: 'Voltar ao painel', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Foto de perfil', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill('teste@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Senha123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('link', { name: 'Configuração de perfil', exact: true }).click();
  await expect(page.getByLabel('Rua', { exact: true })).toHaveValue('Rua das Flores');
  await expect(page.getByLabel('Telefone adicional (opcional)', { exact: true })).toHaveValue('2025550123');
  await expect(page.getByLabel('País do telefone adicional', { exact: true })).toHaveValue('US');
  await expect(page.getByRole('img', { name: 'Foto de perfil', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remover foto', exact: true }).click();
  await page.getByLabel('Telefone adicional (opcional)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Perfil salvo');
  await page.reload();
  await expect(page.getByLabel('Telefone adicional (opcional)', { exact: true })).toHaveValue('');
  await expect(page.getByRole('img', { name: 'Foto de perfil', exact: true })).toHaveCount(0);
});

test('logo de todas as paginas volta para a home', async ({ page }, testInfo) => {
  async function checkLogo(path) {
    await page.goto(path);
    const logo = page.getByRole('link', { name: 'Ir para a página inicial', exact: true });
    await expect(logo).toHaveAttribute('href', '/');
    await expect(logo).toHaveText('');
    await expect(logo.locator('img').first()).toBeVisible();
    await expect(page.locator('a a')).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await logo.click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
  for (const path of ['/', '/#destaques', '/login', '/cadastro']) await checkLogo(path);
  await login(page);
  await checkLogo('/configuracao-perfil');
  await checkLogo('/dashboard');
  await page.evaluate(() => localStorage.removeItem('kinetix.session'));
  await login(page, 'FISIO');
  await checkLogo('/dashboard');
  await page.goto('/prescritor');
  await page.screenshot({ path: testInfo.outputPath('logo-prescritor.png'), fullPage: true });
  await checkLogo('/prescritor');
});

test('formularios e painel cabem na tela', async ({ page }, testInfo) => {
  for (const path of ['/login', '/cadastro']) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: path === '/login' ? 'Entrar' : 'Cadastrar', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (path === '/cadastro' && page.viewportSize().width >= 1024) {
      const intro = page.getByRole('heading', { name: 'Crie uma conta KINETIX', exact: true }).locator('..');
      const textBox = await intro.boundingBox();
      const bandBox = await intro.locator('..').boundingBox();
      expect(Math.abs(textBox.y + textBox.height / 2 - bandBox.y - bandBox.height / 2)).toBeLessThan(3);
      const phone = await page.getByLabel('Telefone', { exact: true }).boundingBox();
      const cpf = await page.getByLabel('CPF', { exact: true }).boundingBox();
      expect(Math.abs(phone.y - cpf.y)).toBeLessThan(2);
      const profile = await page.getByRole('combobox', { name: 'Perfil', exact: true }).boundingBox();
      const country = await page.getByLabel('País do telefone', { exact: true }).boundingBox();
      expect(Math.abs(cpf.x - profile.x)).toBeLessThan(2);
      expect(cpf.y).toBeGreaterThan(profile.y + profile.height);
      expect(Math.abs(phone.x - country.x)).toBeLessThan(2);
      expect(phone.y).toBeGreaterThan(country.y + country.height);
    }
    await page.screenshot({ path: testInfo.outputPath(`${path.slice(1)}.png`), fullPage: true });
  }
  await login(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
});
