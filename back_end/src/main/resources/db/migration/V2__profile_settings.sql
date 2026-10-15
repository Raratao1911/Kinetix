ALTER TABLE dbo.usuarios ADD telefone_adicional NVARCHAR(16) NULL, pais_telefone_adicional CHAR(2) NULL;
ALTER TABLE dbo.pacientes ADD cep NVARCHAR(9) NULL, logradouro NVARCHAR(160) NULL, numero NVARCHAR(20) NULL;

CREATE TABLE dbo.fotos_perfil (
    usuario_id BIGINT NOT NULL CONSTRAINT pk_fotos_perfil PRIMARY KEY,
    conteudo VARBINARY(MAX) NOT NULL,
    tipo VARCHAR(32) NOT NULL,
    CONSTRAINT fk_fotos_perfil_usuario FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id) ON DELETE CASCADE
);
