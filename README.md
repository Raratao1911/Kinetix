# KINETIX

Plataforma phygital para reabilitacao fisioterapeutica assistida por tecnologia.

Slogan: Movimento inteligente para uma recuperacao eficiente.

## Visao Geral

O KINETIX conecta pacientes, fisioterapeutas e clinicas por meio de uma aplicacao web, uma aplicacao mobile, uma API REST e um banco de dados SQL Server.

## Stack

- Backend: Java 21, Spring Boot 3, Spring Security, JWT, Spring Data JPA, Validation e SQL Server.
- Web: React, Vite, TailwindCSS, Axios e React Router.
- Mobile: React Native, Expo, Expo Router e Axios.
- Infraestrutura: Docker, Docker Compose, GitHub Actions, Render/Railway e Vercel/Netlify.

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

Entregaveis:

- DER e dicionário de dados no documento norteador do projeto.
- Scripts SQL Server em `back_end/src/docs/database/`.
- Docker Compose em `docker-compose.yml`.
- Estrutura Spring Boot em `back_end/`.
- Cliente web React em `web/`.

## Decisoes Arquiteturais

- Arquitetura em camadas para separar Controller, Service, Repository, DTOs e entidades.
- SQL Server como banco relacional principal, adequado para integridade referencial e auditoria.
- JWT para autenticacao stateless.
- BCrypt para armazenamento seguro de senhas.
- Auditoria de acesso a dados clinicos. Registro persistente de consentimento ainda pendente.

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
  "telefone": "11999999999",
  "dataNascimento": "2000-01-15",
  "cidade": "Barueri",
  "bairro": "Centro",
  "uf": "SP"
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
O servico `sqlserver-init` deve terminar com codigo 0. O banco persiste no volume `sqlserver-data`.
As credenciais e chaves do Compose sao exemplos para desenvolvimento local.

## Testes

Backend: execute `mvn test` dentro de `back_end/`. Os testes usam BCrypt e JWT reais com repositories simulados.
Frontend: com Microsoft Edge instalado, execute `npm run build` e depois `npm test` dentro de `web/`.
O teste inicia automaticamente um preview na porta 4173 e o encerra ao terminar.
Os testes de navegador usam respostas simuladas da API e verificam desktop e mobile.

Para testar cadastro, login, perfis e persistencia com os servicos reais, execute na raiz:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-auth.ps1
```

Esse teste cria duas contas sinteticas que permanecem no banco.

## Pendencias

- Aplicativo React Native/Expo: a pasta mobile ainda nao existe no repositorio.
- Interface administrativa para verificacao CREFITO e moderacao de avaliacoes (as rotas administrativas ja existem).
- Planos/assinaturas e dashboard financeiro completo, fora do fluxo minimo de atendimento desta entrega.
- Registro persistente de consentimento e documentos de termos/privacidade.
- Testes completos de migrations, concorrencia e fluxos clinicos com SQL Server.
- Atualizar as dependencias de ferramentas do Tailwind: o audit ainda aponta avisos que exigem migracao de versao principal.

O catalogo de exercicios pode ser alimentado por fisioterapeutas autenticados no prescritor.
Os testes de navegador incluem os fluxos profissionais, busca publica, reserva, cancelamento e prontuario.
