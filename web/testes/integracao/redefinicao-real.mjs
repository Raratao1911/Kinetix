// Requer API, Vite e Mailpit locais. Cria uma conta sintetica persistente.
import { chromium, request, expect as baseExpect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";

const expect = baseExpect.configure({ timeout: 15000 });
const base = process.env.KINETIX_TEST_WEB_URL || "http://localhost:5173";
const mail = process.env.KINETIX_TEST_MAIL_URL || "http://127.0.0.1:8025";
const client = await request.newContext({ baseURL: base });
const browser = await chromium.launch({ channel: "msedge" });
const email = `reset.${randomUUID()}@example.com`;
const senha = "TesteInicial123!";
const nova = "NovaSenhaTeste123!";
const page = await browser.newPage();
try {
  const created = await client.post("/api/v1/auth/pacientes", { data: {
    nome: "Paciente Teste Redefinicao", email, senha, cidade: "Barueri", bairro: "Centro", uf: "SP",
    telefone: "+5511999999999", documentoIdentidade: "52998224725", dataNascimento: "2000-01-01", aceiteTermos: true
  }});
  expect(created.status()).toBe(201);
  const { token: oldToken } = await created.json();
  const oldHeaders = { Authorization: `Bearer ${oldToken}` };
  expect((await client.get("/api/v1/paciente/perfil", { headers: oldHeaders })).status()).toBe(200);
  await page.goto(`${base}/login`);
  await mkdir("../.local", { recursive: true });
  await page.screenshot({ path: "../.local/login-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Enviar link de redefinição" }).click();
  await expect(page.getByRole("status")).toContainText("Se houver uma conta ativa");
  const list = await (await client.get(`${mail}/api/v1/messages`)).json();
  const message = list.messages.find(m => m.To.some(to => to.Address === email));
  expect(message).toBeTruthy();
  const detail = await (await client.get(`${mail}/api/v1/message/${message.ID}`)).json();
  const link = detail.Text.match(/http[^\s]+\/redefinir-senha#token=[A-Za-z0-9_-]+/)[0];
  const resetToken = link.split("#token=")[1];
  const again = await client.post("/api/v1/auth/esqueci-senha", { data: { email } });
  expect(again.status()).toBe(200);
  const unknown = await client.post("/api/v1/auth/esqueci-senha", { data: { email: `absent.${randomUUID()}@example.com` } });
  expect(await unknown.json()).toEqual(await again.json());
  const after = await (await client.get(`${mail}/api/v1/messages`)).json();
  expect(after.messages.filter(m => m.To.some(to => to.Address === email))).toHaveLength(1);
  await page.goto(link);
  await expect(page).toHaveURL(/redefinir-senha$/);
  await page.getByLabel("Nova senha", { exact: true }).fill(nova);
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill(nova);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByRole("status")).toContainText("Senha redefinida");
  expect((await client.post("/api/v1/auth/login", { data: { email, senha } })).status()).toBe(401);
  expect((await client.get("/api/v1/paciente/perfil", { headers: oldHeaders })).status()).toBe(401);
  expect((await client.post("/api/v1/auth/redefinir-senha", { data: { token: resetToken, senha: nova } })).status()).toBe(400);
  const login = await client.post("/api/v1/auth/login", { data: { email, senha: nova } });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  expect((await client.get("/api/v1/paciente/perfil", { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(200);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/login`);
  await expect(page.getByRole("link", { name: "Criar conta", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "../.local/login-mobile.png", fullPage: true });
  console.log("PASS: fluxo real no navegador, e-mail SMTP recebido, senha atualizada, link de uso único, reenvio limitado e sessão antiga revogada.");
} finally { await browser.close(); await client.dispose(); }
