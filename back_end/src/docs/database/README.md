# Banco de dados Kinetix

O esquema oficial da aplicação está em `src/main/resources/db/migration/V1__create_kinetix_schema.sql` e é aplicado pelo Flyway.

## Inicialização recomendada da aplicação

1. Se o banco ainda nao existir, execute no SSMS: `IF DB_ID(N'Kinetix') IS NULL EXEC(N'CREATE DATABASE [Kinetix]');`.
2. Configure `KINETIX_DB_URL`, `KINETIX_DB_USERNAME` e `KINETIX_DB_PASSWORD`.
3. Inicie a API. O Flyway aplica as migrations pendentes e o Hibernate valida o esquema.

V1 cria a estrutura inicial. V2 acrescenta endereco do paciente, telefone adicional
e a tabela de fotos de perfil. V3 acrescenta RG opcional e versao/data do aceite
dos termos em usuarios. As tres migrations atuam no mesmo banco Kinetix; nao sao bancos separados.
O historico fica em dbo.flyway_schema_history. Nao execute as migrations manualmente
nem o script completo sobre o banco que ja esta em uso.

## Execução manual completa

`Kinetix_SQL_Server.sql` cria o banco e todas as tabelas, índices e especialidades iniciais numa única execução no SQL Server Management Studio. Execute apenas uma vez num banco vazio. Como essa execução manual não registra o histórico do Flyway, a inicialização da API com Flyway habilitado tentará aplicar a V1 novamente. Para operar a API, prefira a inicialização recomendada acima; se optar pelo script manual, desabilite Flyway (`SPRING_FLYWAY_ENABLED=false`) e mantenha o esquema alinhado com as migrations em futuras atualizações.
