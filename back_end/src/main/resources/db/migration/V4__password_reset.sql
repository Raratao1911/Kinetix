CREATE TABLE dbo.redefinicoes_senha (
    usuario_id BIGINT NOT NULL CONSTRAINT pk_redefinicoes_senha PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL CONSTRAINT uq_redefinicoes_token UNIQUE,
    criado_em DATETIMEOFFSET NOT NULL,
    expira_em DATETIMEOFFSET NOT NULL,
    utilizado BIT NOT NULL DEFAULT 0,
    CONSTRAINT fk_redefinicoes_usuario FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id)
);
