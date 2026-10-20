package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "redefinicoes_senha")
public class RedefinicaoSenha {
    @Id @Column(name = "usuario_id") public Long usuarioId;
    @Column(name = "token_hash", nullable = false, length = 64) public String tokenHash;
    @Column(name = "criado_em", nullable = false) public OffsetDateTime criadoEm;
    @Column(name = "expira_em", nullable = false) public OffsetDateTime expiraEm;
    @Column(nullable = false) public boolean utilizado;
}
