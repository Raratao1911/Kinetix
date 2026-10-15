import { test, expect } from "@playwright/test";

const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
const slot = future + "T09:00:00-03:00";
const professional = { id: 7, nome: "Fisio de Teste", cidade: "Barueri", uf: "SP", bairro: "Centro", nomeClinica: "Clínica Teste", apresentacao: "Atendimento individual de reabilitação.", logradouro: "Rua das Flores", numero: "12", especialidades: ["Ortopedia"], avaliacaoMedia: 0, totalAvaliacoes: 0, crefitoVerificado: true };
const appointment = { id: 11, pacienteId: 42, pacienteNome: "Paciente Teste", fisioterapeutaId: 7, fisioterapeutaNome: professional.nome, servicoId: 3, servicoNome: "Sessão de fisioterapia", inicio: slot, fim: future + "T09:50:00-03:00", status: "SOLICITADA", preco: 120 };

async function setup(page, { booked = false, complete = true } = {}) {
  let role = "PACIENTE";
  let p = { ...professional };
  let services = [{ id: 3, nome: appointment.servicoNome, descricao: "Sessão individual", duracaoMinutos: 50, preco: 120 }];
  let consultations = booked ? [{ ...appointment }] : [];
  let availability = [];
  let records = [];
  const state = { prescription: null, booking: null };
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method();
    const body = method === "GET" || method === "DELETE" ? null : request.postDataJSON();
    const ok = (data, status = 200) => route.fulfill({ status, json: data });
    if (path === "/auth/login") {
      role = body.email.startsWith("fisio") ? "FISIO" : "PACIENTE";
      return ok({ usuarioId: role === "FISIO" ? 7 : 42, nome: role === "FISIO" ? p.nome : "Paciente Teste", perfil: role, token: "fixture-token", expiraEm: new Date(Date.now() + 3600000).toISOString() });
    }
    if (path === "/especialidades") return ok([{ id: 1, nome: "Ortopedia" }, { id: 2, nome: "Esportiva" }]);
    if (path === "/perfil") return ok({ usuarioId: 42, nome: role === "FISIO" ? p.nome : "Paciente Teste", perfil: role, email: "teste@example.com", cidade: "Barueri", uf: "SP", bairro: "Centro", completo: complete, fotoDisponivel: false });
    if (path === "/profissionais") return ok(url.searchParams.get("cidade") === "Sem resultados" ? [] : [p]);
    if (path === "/profissionais/7") return ok({ profissional: p, servicos: services, avaliacoes: [] });
    if (path === "/profissionais/7/horarios") return ok(consultations.some(c => ["SOLICITADA", "CONFIRMADA"].includes(c.status)) ? [] : [slot]);
    if (path === "/consultas/minhas") return ok(consultations);
    if (path === "/consultas" && method === "POST") {
      if (!complete) return ok({ mensagem: "Complete o perfil." }, 409);
      state.booking = body;
      consultations.push({ ...appointment });
      return ok(consultations.at(-1), 201);
    }
    if (path === "/consultas/11/cancelar") { consultations[0].status = role === "FISIO" ? "CANCELADA_FISIO" : "CANCELADA_PACIENTE"; return ok(consultations[0]); }
    if (path === "/consultas/11/concluir") { consultations[0].status = "REALIZADA"; return ok(consultations[0]); }
    if (path === "/fisioterapeuta/consultas/11/confirmar") { consultations[0].status = "CONFIRMADA"; return ok(consultations[0]); }
    if (path === "/fisioterapeuta/perfil") { if (method === "PUT") p = { ...p, ...body }; return ok(p); }
    if (path === "/fisioterapeuta/especialidades") { p.especialidades = body.especialidadesIds.map(id => id === 1 ? "Ortopedia" : "Esportiva"); return ok(p); }
    if (path === "/fisioterapeuta/servicos") {
      if (method === "POST") { const s = { ...body, id: 4 }; services.push(s); return ok(s, 201); }
      return ok(services);
    }
    if (/^\/fisioterapeuta\/servicos\/\d+$/.test(path)) {
      const id = Number(path.split("/").at(-1));
      if (method === "DELETE") { services = services.filter(s => s.id !== id); return route.fulfill({ status: 204 }); }
      services = services.map(s => s.id === id ? { ...body, id } : s); return ok(services.find(s => s.id === id));
    }
    if (path === "/fisioterapeuta/disponibilidades") {
      if (method === "POST") { availability.push({ ...body, id: 1 }); return ok({}, 201); }
      return ok(availability);
    }
    if (path === "/fisioterapeuta/disponibilidades/1" && method === "DELETE") { availability = []; return route.fulfill({ status: 204 }); }
    if (path === "/fisioterapeuta/pacientes") return ok([{ usuarioId: 42, nome: "Paciente Teste", email: "paciente@example.com", cidade: "Barueri", uf: "SP" }]);
    if (path === "/fisioterapeuta/pacientes/42/prontuarios") return ok(records);
    if (path === "/fisioterapeuta/consultas/11/prontuario") { records = [{ id: 1, consultaId: 11, registroClinico: body.registroClinico, atualizadoEm: slot }]; return ok(records[0]); }
    if (path.endsWith("/diario-dor")) return ok([{ id: 1, escalaEva: 4, observacao: "Dor após caminhada", registradoEm: slot }]);
    if (path === "/fisioterapeuta/exercicios") return method === "POST" ? ok({ ...body, id: 4 }, 201) : ok([{ id: 3, nome: "Alongamento de quadríceps" }]);
    if (path === "/fisioterapeuta/pacientes/42/prescricoes") { state.prescription = body; return ok({ id: 5 }, 201); }
    if (path === "/paciente/prescricoes") return ok([]);
    return ok({ mensagem: "Rota não simulada: " + path }, 404);
  });
  return state;
}

async function login(page, role = "PACIENTE") {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(role === "FISIO" ? "fisio@example.com" : "paciente@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Senha123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/dashboard$/);
}
async function screenshot(page, info, name) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath(name + ".png"), fullPage: true });
}

test("profissional configura apresentacao especialidades servicos e horarios", async ({ page }, info) => {
  await setup(page);
  page.on("dialog", d => d.accept());
  await login(page, "FISIO");
  await page.getByRole("link", { name: "Configuração de perfil", exact: true }).click();
  await page.getByLabel("Nome da clínica", { exact: true }).fill("Clínica Movimento");
  await page.getByLabel("Apresentação", { exact: true }).fill("Atendimento individual.");
  await page.getByRole("button", { name: "Salvar apresentação", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Apresentação profissional salva");
  await page.getByRole("tab", { name: "Especialidades", exact: true }).click();
  await page.getByLabel("Esportiva", { exact: true }).check();
  await page.getByRole("button", { name: "Salvar especialidades", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Especialidades salvas");
  await page.getByRole("tab", { name: "Serviços e preços", exact: true }).click();
  await page.getByLabel("Nome do serviço", { exact: true }).fill("Avaliação funcional");
  await page.getByLabel("Preço (R$)", { exact: true }).fill("90");
  await page.getByRole("button", { name: "Salvar serviço", exact: true }).click();
  await expect(page.getByText("Avaliação funcional", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Editar Avaliação funcional", exact: true }).click();
  await page.getByLabel("Preço (R$)", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Salvar serviço", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Serviço salvo");
  await screenshot(page, info, "servicos");
  await page.getByRole("button", { name: "Desativar Avaliação funcional", exact: true }).click();
  await expect(page.getByText("Avaliação funcional", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Configurar horários", exact: true }).click();
  await page.getByLabel("Válido a partir de", { exact: true }).fill(future);
  await page.getByRole("button", { name: "Publicar horários", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Disponibilidade publicada");
  await screenshot(page, info, "disponibilidade");
  await page.getByRole("button", { name: "Remover disponibilidade 1", exact: true }).click();
  await expect(page.getByText("Nenhum horário publicado.", { exact: true })).toBeVisible();
});

test("busca publica preserva horario no login e paciente agenda e cancela", async ({ page }, info) => {
  const state = await setup(page);
  await page.goto("/profissionais");
  await page.getByLabel("Cidade", { exact: true }).fill("Barueri");
  await page.getByRole("button", { name: "Buscar profissionais", exact: true }).click();
  await expect(page).toHaveURL(/cidade=Barueri/);
  await expect(page.getByText("1 profissional encontrado", { exact: true })).toBeVisible();
  await screenshot(page, info, "busca");
  await page.getByRole("link", { name: "Ver perfil e horários", exact: true }).click();
  await page.getByLabel("Data", { exact: true }).fill(future);
  await page.getByRole("radio", { name: "09:00", exact: true }).check();
  await screenshot(page, info, "agendamento");
  await page.getByRole("button", { name: "Entrar para agendar", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("paciente@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Senha123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/profissionais\/7/);
  await expect(page.getByRole("radio", { name: "09:00", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Confirmar agendamento", exact: true }).click();
  await expect(page).toHaveURL(/agenda$/);
  expect(state.booking).toMatchObject({ fisioterapeutaId: 7, servicoId: 3, inicio: slot });
  await expect(page.getByText("Solicitada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByLabel("Motivo", { exact: true }).fill("Mudança de disponibilidade");
  await page.getByRole("button", { name: "Confirmar cancelamento", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Consulta cancelada");
  await page.getByLabel("Exibir", { exact: true }).selectOption("historico");
  await expect(page.getByText("Cancelada pelo paciente", { exact: true })).toBeVisible();
  await screenshot(page, info, "agenda-paciente");
});

test("perfil incompleto impede reserva e busca vazia tem retorno", async ({ page }) => {
  const state = await setup(page, { complete: false });
  await login(page);
  await page.goto("/profissionais/7?data=" + future);
  await page.getByRole("radio", { name: "09:00", exact: true }).check();
  await page.getByRole("button", { name: "Confirmar agendamento", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Complete o endereço");
  expect(state.booking).toBeNull();
  await page.goto("/profissionais?cidade=Sem+resultados");
  await expect(page.getByText(/Nenhum profissional encontrado/)).toBeVisible();
  await page.goto("/pacientes/42");
  await expect(page).toHaveURL(/dashboard$/);
});

test("fisio confirma consulta registra prontuario consulta dor e prescreve", async ({ page }, info) => {
  const state = await setup(page, { booked: true });
  page.on("dialog", d => d.accept());
  await login(page, "FISIO");
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByText("Confirmada", { exact: true })).toBeVisible();
  await screenshot(page, info, "agenda-fisio");
  await page.getByRole("link", { name: "Paciente", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Paciente Teste", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Prontuário", exact: true }).click();
  await page.getByLabel("Atendimento", { exact: true }).selectOption("11");
  await page.getByLabel("Registro clínico", { exact: true }).fill("Paciente apresenta melhora da mobilidade.");
  await page.getByRole("button", { name: "Salvar prontuário", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Prontuário salvo");
  await page.reload();
  await page.getByRole("tab", { name: "Prontuário", exact: true }).click();
  await expect(page.getByText("Paciente apresenta melhora da mobilidade.", { exact: true })).toBeVisible();
  await screenshot(page, info, "prontuario");
  await page.getByRole("tab", { name: "Diário de dor", exact: true }).click();
  await expect(page.getByText("Dor após caminhada", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Prescrever exercícios", exact: true }).click();
  await expect(page.getByLabel("Paciente", { exact: true })).toHaveValue("42");
  await page.getByRole("button", { name: "Novo exercício no catálogo", exact: true }).click();
  await page.getByLabel("Nome do exercício", { exact: true }).fill("Mobilidade demonstrativa");
  await page.getByRole("button", { name: "Cadastrar exercício", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Exercício cadastrado");
  await page.getByRole("button", { name: "Adicionar exercício", exact: true }).click();
  await page.getByRole("combobox").nth(1).selectOption("4");
  await page.getByRole("button", { name: "Salvar Plano", exact: true }).click();
  await expect.poll(() => state.prescription).not.toBeNull();
  expect(state.prescription.itens[0]).toMatchObject({ exercicioId: 4, series: 3, repeticoes: 10 });
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await page.getByLabel("Exibir", { exact: true }).selectOption("historico");
  await expect(page.getByText("Realizada", { exact: true })).toBeVisible();
});

