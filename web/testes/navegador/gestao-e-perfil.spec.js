import { test, expect } from "@playwright/test";

test("termos e politica abrem sem login em outra aba sem perder o cadastro", async ({ page }, info) => {
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill("Nome preservado");
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Termos de Uso", exact: true }).click();
  const terms = await popupPromise;
  await expect(terms).toHaveURL(/\/termos#termos$/);
  await expect(terms.getByRole("heading", { name: "Termos de Uso", exact: true })).toBeVisible();
  await expect(terms.getByRole("heading", { name: /4. Agendamentos e cancelamentos/ })).toBeVisible();
  await expect(terms.getByText(/Versão 2026-10-15.2/)).toBeVisible();
  await expect(terms.getByRole("button", { name: "Registrar aceite", exact: true })).toHaveCount(0);
  await terms.close();
  const policyPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Política de Privacidade", exact: true }).click();
  const policy = await policyPromise;
  await expect(policy).toHaveURL(/\/privacidade#privacidade$/);
  await expect(policy.getByRole("heading", { name: "Política de Privacidade", exact: true })).toBeVisible();
  expect(await policy.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await policy.screenshot({ path: info.outputPath("politica-publica.png"), fullPage: true });
  await policy.close();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Nome preservado");
  await expect(page.getByRole("checkbox", { name: /Aceito os/ })).not.toBeChecked();
});

async function setup(page, role = "PACIENTE") {
  const state = { verified: false, review: null, subscriptions: [], rg: "", terms: null, plan: null };
  const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  let appointments = [
    { id: 11, pacienteId: 42, pacienteNome: "Paciente Teste", fisioterapeutaId: 7, fisioterapeutaNome: "Fisio Teste", servicoNome: "Sessão individual", inicio: "2026-10-10T09:00:00-03:00", fim: "2026-10-10T09:30:00-03:00", status: "REALIZADA", preco: 120 },
    { id: 12, pacienteId: 42, pacienteNome: "Paciente Teste", fisioterapeutaId: 7, fisioterapeutaNome: "Fisio Teste", servicoNome: "Retorno", inicio: future + "T10:00:00-03:00", fim: future + "T10:30:00-03:00", status: "SOLICITADA", preco: 80 },
    { id: 13, pacienteId: 42, pacienteNome: "Paciente Teste", fisioterapeutaId: 7, fisioterapeutaNome: "Fisio Teste", servicoNome: "Cancelada", inicio: "2026-10-11T09:00:00-03:00", status: "CANCELADA_PACIENTE", preco: 500 }
  ];
  if (role) await page.addInitScript(({ role }) => {
    localStorage.setItem("kinetix.session", JSON.stringify({ usuarioId: role === "ADMIN" ? 99 : role === "FISIO" ? 7 : 42, nome: "Conta Teste", perfil: role, token: "fixture", expiraEm: new Date(Date.now() + 3600000).toISOString() }));
  }, { role });
  await page.route("**/api/v1/**", async route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace("/api/v1", ""), method = req.method();
    const body = !["GET", "DELETE"].includes(method) && !path.endsWith("/perfil") ? req.postDataJSON() : null;
    const ok = data => route.fulfill({ json: data });
    const empty = () => route.fulfill({ status: 204 });
    if (path === "/admin/fisioterapeutas") return ok([{ usuarioId: 7, nome: "Fisio Teste", email: "fisio@example.com", crefitoNumero: "12345", crefitoUf: "SP", verificado: state.verified }]);
    if (path === "/admin/fisioterapeutas/7/verificacao") { state.verified = body.verificado; return empty(); }
    if (path === "/admin/avaliacoes") return ok([{ id: 2, profissionalNome: "Fisio Teste", nota: 5, comentario: "Atendimento muito bom", status: state.review?.status || "PENDENTE" }]);
    if (path === "/admin/avaliacoes/2") { state.review = { status: body.status }; return empty(); }
    if (path === "/admin/assinaturas") return ok([]);
    if (path === "/admin/planos-assinatura") { state.plan = body; return ok(1); }
    if (path === "/admin/especialidades") return ok({ id: 2, nome: body.nome });
    if (path === "/admin/consultas" || path === "/consultas/minhas") return ok(appointments);
    if (path === "/admin/consultas/12/confirmar") { appointments[1].status = "CONFIRMADA"; return ok(appointments[1]); }
    if (path === "/consultas/12/cancelar") { appointments[1].status = "CANCELADA_ADMIN"; state.cancel = body.motivo; return ok(appointments[1]); }
    if (path === "/consultas/11/avaliacao") {
      if (method === "POST") { state.review = { ...body, id: 2, status: "PENDENTE" }; return route.fulfill({ status: 201 }); }
      return ok(state.review);
    }
    if (path === "/planos-assinatura") return ok([{ id: 1, nome: "Plano acadêmico", descricao: "Agenda e acompanhamento", precoMensal: 49.9 }]);
    if (path === "/fisioterapeuta/assinaturas") {
      if (method === "POST") state.subscriptions.push({ id: 1, planoId: 1, planoNome: "Plano acadêmico", status: "PENDENTE", inicio: "2026-10-15" });
      return ok(method === "POST" ? state.subscriptions[0] : state.subscriptions);
    }
    if (path === "/fisioterapeuta/assinaturas/1") { state.subscriptions[0].status = "CANCELADA"; return empty(); }
    if (path === "/fisioterapeuta/disponibilidades" || path === "/fisioterapeuta/pacientes" || path.endsWith("/diario-dor")) return ok([]);
    if (path === "/paciente/prontuarios") return ok([{ id: 1, consultaId: 11, registroClinico: "Registro clínico da própria conta", atualizadoEm: "2026-10-10T09:30:00-03:00" }]);
    if (path === "/paciente/prescricoes") return ok([{ id: 1, titulo: "Rotina teste", itens: [{ id: 1, exercicioNome: "Alongamento", duracaoSegundos: 3 }] }]);
    if (path === "/perfil") {
      if (method === "PUT") {
        const parts = await new Request(req.url(), { method: "PUT", headers: req.headers(), body: req.postDataBuffer() }).formData();
        state.rg = JSON.parse(await parts.get("dados").text()).rg;
      }
      return ok({ nome: "Conta Teste", perfil: role, cidade: "Barueri", uf: "SP", rg: state.rg, completo: false, termosAceitosEm: state.terms });
    }
    if (path === "/perfil/consentimento") { state.terms = new Date().toISOString(); return empty(); }
    return route.fulfill({ status: 404, json: { mensagem: "Rota não simulada: " + path } });
  });
  return state;
}

async function screenshot(page, info, name) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath(name + ".png"), fullPage: true });
}

test("administrador verifica profissional modera avaliacao e cadastra plano", async ({ page }, info) => {
  const state = await setup(page, "ADMIN"); page.on("dialog", d => d.accept());
  await page.goto("/dashboard"); await expect(page).toHaveURL(/administracao$/);
  await page.getByRole("button", { name: "Verificar CREFITO", exact: true }).click();
  await expect(page.getByRole("button", { name: "Revogar verificação" })).toBeVisible(); expect(state.verified).toBe(true);
  await page.getByRole("tab", { name: "Avaliações", exact: true }).click();
  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  await expect(page.getByText("Aprovada", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Planos", exact: true }).click();
  await page.getByLabel("Nome do plano", { exact: true }).fill("Plano TCA");
  await page.getByLabel("Valor mensal (R$)").fill("49.9");
  await page.getByLabel("Benefícios", { exact: true }).fill("Agenda profissional");
  await page.getByRole("button", { name: "Cadastrar plano", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Plano cadastrado." })).toBeVisible(); expect(state.plan.precoMensal).toBe(49.9);
  await screenshot(page, info, "administracao");
});

test("administracao confirma e cancela com justificativa sem prontuario", async ({ page }) => {
  const state = await setup(page, "ADMIN"); await page.goto("/agenda");
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByText("Confirmada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ver meus registros" })).toHaveCount(0);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Motivo", { exact: true }).fill("Ausência do profissional");
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0); expect(state.cancel).toBe("Ausência do profissional");
});

test("planos sao publicos e profissional solicita e cancela sem cobranca", async ({ page }, info) => {
  const state = await setup(page, "FISIO"); page.on("dialog", d => d.accept());
  await page.goto("/planos"); await page.getByRole("button", { name: "Solicitar plano" }).click();
  await expect(page.getByRole("status")).toContainText("Solicitação registrada");
  await expect(page.getByRole("button", { name: "Plano selecionado" })).toBeDisabled();
  await screenshot(page, info, "planos");
  await page.getByRole("button", { name: "Cancelar assinatura" }).click();
  await expect(page.getByRole("status")).toHaveText("Assinatura cancelada."); expect(state.subscriptions[0].status).toBe("CANCELADA");
  await expect(page.getByRole("button", { name: "Solicitar plano" })).toBeEnabled();
});

test("financeiro filtra periodo e exclui cancelamentos do total realizado", async ({ page }, info) => {
  await setup(page, "FISIO"); await page.goto("/financeiro");
  await page.getByLabel("De", { exact: true }).fill("2026-10-01");
  await page.getByLabel("Até", { exact: true }).fill("2026-10-31");
  await expect(page.locator("dl")).toContainText(/120,00/);
  await expect(page.locator("dl")).not.toContainText(/500,00/);
  await screenshot(page, info, "financeiro");
  await page.getByLabel("De", { exact: true }).fill("2026-11-01");
  await expect(page.getByRole("alert")).toHaveText("Informe um período válido.");
});

test("paciente avalia sessao concluida e consulta seus registros", async ({ page }, info) => {
  const state = await setup(page); await page.goto("/agenda");
  await page.getByLabel("Exibir", { exact: true }).selectOption("historico");
  await page.getByRole("button", { name: "Avaliar atendimento" }).click();
  await page.getByLabel("Nota", { exact: true }).selectOption("4");
  await page.getByLabel("Comentário (opcional)").fill("Sessão muito boa");
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  await expect(page.getByText(/Aguardando moderação/)).toBeVisible(); expect(state.review.nota).toBe(4);
  await page.reload(); await page.getByLabel("Exibir", { exact: true }).selectOption("historico");
  await page.getByRole("button", { name: "Avaliar atendimento" }).click();
  await expect(page.getByText(/Aguardando moderação/)).toBeVisible();
  await page.getByRole("button", { name: "Ver meus registros" }).click();
  await expect(page.getByText("Registro clínico da própria conta")).toBeVisible();
  await screenshot(page, info, "avaliacao-prontuario");
});

test("perfil salva RG opcional e registra aceite dos termos", async ({ page }) => {
  const state = await setup(page); await page.goto("/configuracao-perfil");
  await page.getByLabel("RG (opcional)").fill("12.345.678-X");
  await page.getByRole("button", { name: "Salvar perfil", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Dados salvos"); expect(state.rg).toBe("12.345.678-X");
  await page.reload(); await expect(page.getByLabel("RG (opcional)")).toHaveValue("12.345.678-X");
  await page.getByRole("link", { name: "Termos e privacidade", exact: true }).click();
  await page.getByRole("checkbox").check(); await page.getByRole("button", { name: "Registrar aceite" }).click();
  await expect(page.getByRole("status")).toHaveText("Aceite registrado na sua conta."); expect(state.terms).not.toBeNull();
});

test("cronometro inicia pausa reinicia e termina", async ({ page }) => {
  await setup(page); await page.goto("/dashboard");
  const time = page.getByLabel("Tempo restante", { exact: true }); await expect(time).toHaveText("00:03");
  await page.getByRole("button", { name: "Iniciar cronômetro", exact: true }).click();
  await expect(time).toHaveText("00:02", { timeout: 5000 });
  await page.getByRole("button", { name: "Pausar cronômetro", exact: true }).click();
  await page.getByRole("button", { name: "Reiniciar cronômetro", exact: true }).click(); await expect(time).toHaveText("00:03");
  await page.getByRole("button", { name: "Iniciar cronômetro", exact: true }).click();
  await expect(time).toHaveText("00:00", { timeout: 7000 });
  await expect(page.getByText("Tempo concluído.")).toBeVisible();
});

test("visitante ve planos e paciente nao acessa administracao ou financeiro", async ({ page }) => {
  await setup(page, null); await page.goto("/planos");
  await expect(page.getByRole("link", { name: "Cadastrar como profissional" })).toBeVisible();
  await page.getByRole("link", { name: "Cadastrar como profissional" }).click();
  await expect(page.getByRole("combobox", { name: "Perfil", exact: true })).toHaveValue("FISIO");
  await page.goto("/administracao"); await expect(page).toHaveURL(/login$/);
  await page.evaluate(() => localStorage.setItem("kinetix.session", JSON.stringify({ usuarioId: 42, nome: "Paciente", perfil: "PACIENTE", token: "fixture", expiraEm: new Date(Date.now() + 3600000).toISOString() })));
  await page.goto("/administracao"); await expect(page).toHaveURL(/dashboard$/);
  await page.goto("/financeiro"); await expect(page).toHaveURL(/dashboard$/);
});
