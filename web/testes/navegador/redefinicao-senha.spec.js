import { test, expect } from "@playwright/test";

test("login destaca criar conta e permite solicitar redefinicao", async ({ page }) => {
  let payload;
  await page.route("**/api/v1/auth/esqueci-senha", async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { mensagem: "Se houver uma conta ativa com esse e-mail, enviaremos um link para redefinir a senha." } });
  });
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Criar conta", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByRole("button", { name: "Enviar link de redefinição" }).click();
  await expect(page.getByRole("status")).toContainText("Se houver uma conta ativa");
  expect(payload).toEqual({ email: "teste@example.com" });
});

test("redefinicao confirma senha e envia token sem expo-lo na URL", async ({ page }) => {
  const token = "a".repeat(43); let payload;
  await page.route("**/api/v1/auth/redefinir-senha", async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { mensagem: "Senha redefinida. Entre com sua nova senha." } });
  });
  await page.goto(`/redefinir-senha#token=${token}`);
  await expect(page).toHaveURL(/redefinir-senha$/);
  await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha123!");
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill("OutraSenha123!");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByRole("alert")).toContainText("As senhas devem ser iguais");
  expect(payload).toBeUndefined();
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill("NovaSenha123!");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByRole("status")).toContainText("Senha redefinida");
  expect(payload).toEqual({ token, senha: "NovaSenha123!" });
});

test("redefinicao sem token oferece novo link", async ({ page }) => {
  await page.goto("/redefinir-senha");
  await expect(page.getByRole("alert")).toContainText("Link inválido");
  await expect(page.getByRole("button", { name: "Salvar nova senha" })).toHaveCount(0);
});
