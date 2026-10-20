# KINETIX

Plataforma phygital para reabilitacao fisioterapeutica assistida por tecnologia.

Slogan: Movimento inteligente para uma recuperacao eficiente.

## Visao Geral

O KINETIX conecta pacientes, fisioterapeutas e clinicas por meio de uma aplicacao web, uma aplicacao mobile, uma API REST e um banco de dados SQL Server.

## Stack

- Backend: Java 21, Spring Boot 4.0.8, Spring Security, JWT, Spring Data JPA, Validation e SQL Server.
- Web: React, Vite, TailwindCSS, Axios e React Router.
- Mobile: previsto para uma etapa futura, ainda sem implementacao neste repositorio.
- Execucao: ambiente local ou Docker Compose; sem deploy publico configurado.

## Entrega Web

Fluxo principal: buscar profissional sem login, escolher servico/data/horario,
autenticar como paciente e confirmar a reserva. O endereco do paciente deve estar completo.

Telas:
- `/profissionais`: busca publica por cidade, bairro, Estado, especialidade e proximidade.
- `/profissionais/:id`: perfil publico, servicos, valores e horarios.
- `/agenda`: consultas e historico; o fisioterapeuta tambem publica disponibilidades.
- `/pacientes/:id`: acompanhamento clinico restrito ao profissional vinculado.
- `/configuracao-perfil`: endereco, foto e telefone adicional; profissionais gerenciam apresentacao, especialidades e servicos.
- `/prescritor?paciente=:id`: prescricao e cadastro de exercicios.
- `/planos`: planos publicos e solicitacoes opcionais de assinatura do profissional.
- `/financeiro`: valores de atendimentos realizados e previstos, com filtro de datas.
- `/administracao`: verificacao manual de CREFITO, moderacao de avaliacoes, planos e especialidades.
- `/privacidade`: termos da versao academica e registro de aceite para contas existentes.
- `/termos#termos` e `/privacidade#privacidade`: leitura publica dos Termos de Uso
  e da Politica de Privacidade, inclusive antes do cadastro. Os links do cadastro
  abrem outra aba para preservar o formulario. Versao atual: `2026-10-15.2`.

Pacientes podem avaliar sessoes realizadas pela agenda, consultar seus proprios
prontuarios e usar o cronometro das rotinas com duracao prescrita. Avaliacoes ficam
pendentes ate a moderacao. RG e opcional no perfil, separado do CPF.

### Administrador Local

Nao existe cadastro publico de administradores. Para criar uma conta administrativa,
configure `KINETIX_ADMIN_EMAIL` e `KINETIX_ADMIN_PASSWORD` no `.env` local ignorado
pelo Git e reinicie a API. A senha deve ter pelo menos 12 caracteres e no maximo
72 bytes UTF-8. Entre pelo login normal; a conta sera direcionada a `/administracao`.
A inicializacao nao promove contas de pacientes/profissionais nem altera a senha
de um administrador existente. Depois da criacao, as duas variaveis podem ser removidas.

Na administracao: confira o CREFITO antes de liberar o perfil, modere avaliacoes e
cadastre os planos com os valores/beneficios definidos pela equipe. Em Agendamentos,
confirme ou cancele consultas com justificativa, sem acesso aos prontuarios.
Assinaturas sao solicitacoes administrativas: a ativacao manual nao comprova pagamento.

### Demonstracao em Tres Processos

1. Profissional: entrar, completar endereco e apresentacao, selecionar especialidades,
   cadastrar servico com duracao/preco e publicar uma disponibilidade na agenda.
   O CREFITO precisa ser liberado administrativamente para aparecer na busca.
   Cadastrar-se nao libera automaticamente o registro profissional.
2. Paciente: buscar sem login, abrir o perfil, selecionar servico/data/horario,
   entrar e confirmar. A consulta aparece na agenda como solicitada.
   Cancelamentos do paciente exigem motivo e antecedencia minima de 24 horas.
3. Profissional: confirmar a consulta na agenda, abrir o paciente, registrar prontuario,
   consultar diario de dor e prescrever exercicios. O paciente visualiza a rotina no painel.

Os horarios de atendimento sao apresentados no fuso America/Sao_Paulo.
Remover uma disponibilidade ou desativar um servico nao apaga consultas existentes.

## Estrutura

```text
back_end/
  src/main/java/           API: controllers, services, repositories e entidades
  src/main/resources/     Configuracao e migrations do banco
  src/test/               Testes Java (estrutura padrao do Maven)
  src/docs/database/      SQL original e orientacoes do banco
web/
  src/pages/              Paginas do site
  src/components/         Componentes reutilizados nas paginas
  public/                 Logos e arquivos publicos
  testes/navegador/       Testes automaticos, nao sao paginas do site
scripts/                  Teste de integracao com API e banco reais
docker-compose.yml        Execucao opcional em containers
```

O documento norteador na raiz e o PDF de referencia em `back_end/` foram preservados.
O `.env` guarda a configuracao local e nao deve ser enviado ao Git.
`node_modules/`, `target/` e `dist/` sao gerados pelas ferramentas e ignorados pelo
Git. Nao sao copias do codigo: contem dependencias, compilacoes e a versao de producao.

## Decisoes Arquiteturais

- Arquitetura em camadas para separar Controller, Service, Repository, DTOs e entidades.
- SQL Server como banco relacional principal, adequado para integridade referencial e auditoria.
- JWT para autenticacao stateless.
- BCrypt para armazenamento seguro de senhas.
- Auditoria de acesso a dados clinicos e registro de versao/data do aceite dos termos.
  Contas antigas podem registrar o aceite em `/privacidade`; nao e inventado aceite retroativo.

## Riscos Tecnicos

- Dados de saude exigem cuidado adicional com privacidade, controle de acesso e logs.
- Geolocalizacao exige validacao de permissao, precisao e tratamento de indisponibilidade.
- Agendamentos precisam de transacao e controle de concorrencia para evitar horarios duplicados.

## Sprint 2 - Autenticacao e Usuarios

Endpoints implementados:

- `POST /api/v1/auth/pacientes`
- `POST /api/v1/auth/fisioterapeutas`
- `POST /api/v1/auth/login`

Exemplo de cadastro de paciente:

```json
{
  "nome": "Usuario Paciente",
  "email": "paciente@kinetix.com",
  "senha": "Senha@123",
  "documentoIdentidade": "52998224725",
  "telefone": "11999999999",
  "dataNascimento": "2000-01-15",
  "cidade": "Barueri",
  "bairro": "Centro",
  "uf": "SP",
  "aceiteTermos": true
}
```

Exemplo de login:

```json
{
  "email": "paciente@kinetix.com",
  "senha": "Senha@123"
}
```

Retorno do login:

```json
{
  "token": "jwt",
  "usuarioId": 1,
  "perfil": "PACIENTE",
  "nome": "Usuario Paciente"
}
```

Os endpoints exigem `Authorization: Bearer <token>` quando protegidos. Swagger ainda nao esta configurado.

## Como Executar

SQL Server, API e frontend (Docker Desktop com WSL 2 em funcionamento):

```bash
docker compose up -d
docker compose ps -a
docker compose logs -f backend web
```

Web fora do Docker:

```bash
cd web
npm ci
npm run dev
```

Portas: web `http://localhost:5173`, API `http://localhost:8080/api/v1`, SQL Server `localhost:1433`.
O proxy `/api` do desenvolvimento (5173) e do preview (4173) aponta para a API
na porta 8080. Para alterar o destino local, configure `VITE_PROXY_TARGET` em
`web/.env`; no Docker, o destino e `http://backend:8080`.

Se um SQL Server local ja ocupar 1433, use outra porta externa para o container:

```powershell
$env:KINETIX_SQL_PORT = '1434'
docker compose up -d
```

A API continua acessando `sqlserver:1433` dentro do Docker.

O servico `sqlserver-init` deve terminar com codigo 0. O banco persiste no volume `sqlserver-data`.
As credenciais e chaves do Compose sao exemplos para desenvolvimento local.

## Testes

Backend: execute `mvn test` dentro de `back_end/`. Os testes usam BCrypt e JWT reais com repositories simulados.
Frontend: com Microsoft Edge instalado, execute `npm run build` e depois `npm test` dentro de `web/`.
O teste inicia automaticamente um preview na porta 4173 e o encerra ao terminar.
Os testes de navegador usam respostas simuladas da API e verificam desktop e mobile.
Ficam em `web/testes/navegador/`: `autenticacao.spec.js`, `atendimentos.spec.js`
e `gestao-e-perfil.spec.js`. A antiga pasta `e2e` foi substituida por esse nome.
`test-results/` e `playwright-report/` sao resultados descartaveis, recriados nos testes.

Para testar cadastro, login, perfis e persistencia com os servicos reais, execute na raiz:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-auth.ps1
```

Esse teste cria duas contas sinteticas que permanecem no banco.

## Cobertura do Documento Norteador

- UC01/02 e UC13/14: login e cadastro por perfil, validacao e persistencia.
- UC03: visualizacao de precos/beneficios e escolha opcional de plano.
- UC04/05: perfil/clinica, especialidades, servicos e precos.
- UC06: disponibilidades publicadas com validacao de conflitos.
- UC07/08: agenda profissional/administrativa, confirmacao e cancelamento justificado.
- UC09 a UC12: prescricoes, prontuario, historico e resumo de consultas.
- UC15 a UC17: configuracao/consulta do perfil, endereco, documentos e foto persistente.
- UC18 a UC22: busca publica, filtros, proximidade e perfil profissional.
- UC23 a UC27: solicitacao/reserva, cancelamento e historico do paciente.

O financeiro contabiliza valores contratados nas consultas, nao dinheiro recebido.
A escolha de plano nao limita funcionalidades nem cobra automaticamente; o documento
nao define bloqueios por plano. Nao ha verificacao automatica de identidade por CPF/RG.

## Pendencias Externas e Proxima Etapa

- Aplicativo React Native/Expo: a pasta mobile ainda nao existe no repositorio.
- Push RF05 depende do aplicativo/dispositivo mobile e conectividade com o provedor.
- Pagamentos reais dependem de conta de vendedor, escolha do provedor, credenciais e validacao de webhooks. Ainda nao integrados.
- HTTPS, disponibilidade publica e meta de busca inferior a 2 segundos precisam de infraestrutura e medicao; nao sao garantidos pelo ambiente local.
- Antes de usar dados reais: revisar privacidade, responsaveis/canais, retencao, backups e seguranca operacional.
- O DOCX ainda possui espacos destinados ao DER, prints e manual final, que devem ser preenchidos pela equipe com a versao entregue.
- Atualizar as dependencias de ferramentas do Tailwind: o audit ainda aponta avisos que exigem migracao de versao principal.

O catalogo de exercicios pode ser alimentado por fisioterapeutas autenticados no prescritor.
Os testes de navegador incluem os fluxos profissionais, busca publica, reserva, cancelamento e prontuario.
