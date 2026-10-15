# Kinetix API

Backend Java 21 e Spring Boot. O frontend fica em `../web/`.
Consulte o [guia principal](../README.md) para os fluxos e as telas.

## Banco de dados

A aplicacao usa um unico banco SQL Server: `Kinetix`.
Para uma instalacao nova, crie apenas o banco vazio no SSMS:

```sql
IF DB_ID(N'Kinetix') IS NULL EXEC(N'CREATE DATABASE [Kinetix]');
```

As migrations em `src/main/resources/db/migration/` criam e atualizam as tabelas
automaticamente. Nao apague nem altere migrations ja aplicadas.

O script original `src/docs/database/Kinetix_SQL_Server.sql` foi preservado como
referencia. Nao execute esse script completo sobre um banco em uso. Veja o
[guia do banco](src/docs/database/README.md) antes de uma instalacao manual.

## Configuracao e execucao

Use as credenciais locais no `.env` da raiz, ignorado pelo Git, ou nas variaveis
de ambiente do processo:

- `KINETIX_DB_URL`, `KINETIX_DB_USERNAME`, `KINETIX_DB_PASSWORD`: conexao SQL Server.
- `KINETIX_JWT_SECRET_BASE64`: chave de assinatura dos tokens.
- `KINETIX_DATA_ENCRYPTION_KEY`: chave AES-256 Base64 dos dados clinicos.
- `KINETIX_WEB_ORIGINS`: origens permitidas pelo CORS.
- `KINETIX_TIME_ZONE`: fuso das agendas; padrao `America/Sao_Paulo`.

A chave de criptografia precisa estar no ambiente do processo Java. Preserve a
chave existente: troca-la impede a leitura dos dados clinicos ja gravados.
Nao versione senhas nem chaves.

Com o ambiente configurado, execute nesta pasta:

```powershell
.\mvnw.cmd spring-boot:run
```

API: `http://localhost:8080/api/v1`. Frontend local: `http://localhost:5173`.
O login devolve um JWT, enviado nas rotas protegidas como `Authorization: Bearer <token>`.

O cadastro publico nao cria administradores. Para criar o primeiro administrador
local, siga a secao Administrador Local do guia principal.

## Testes

```powershell
.\mvnw.cmd test
```

Os testes Java ficam em `src/test/`. O teste com API e banco reais fica em
`../scripts/test-auth.ps1`; ele cria contas sinteticas, sem apagar dados existentes.
