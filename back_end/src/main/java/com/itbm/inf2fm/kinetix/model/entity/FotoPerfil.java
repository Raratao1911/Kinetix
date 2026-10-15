package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "fotos_perfil")
public class FotoPerfil {
    @Id @Column(name = "usuario_id")
    public Long usuarioId;
    @Column(nullable = false, columnDefinition = "varbinary(max)")
    public byte[] conteudo;
    @Column(nullable = false, length = 32)
    public String tipo;

    public FotoPerfil() {}
    public FotoPerfil(Long usuarioId, byte[] conteudo, String tipo) {
        this.usuarioId = usuarioId;
        this.conteudo = conteudo;
        this.tipo = tipo;
    }
}
