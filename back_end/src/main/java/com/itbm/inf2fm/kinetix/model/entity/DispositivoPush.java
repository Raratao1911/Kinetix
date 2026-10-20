package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "dispositivos_push")
public class DispositivoPush {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "usuario_id")
    public Usuario usuario;
    @Column(nullable = false, unique = true, length = 300)
    public String token;
    @Column(nullable = false, length = 16)
    public String plataforma;
    @Column(nullable = false)
    public boolean ativo = true;
    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criadoEm = OffsetDateTime.now();
    public DispositivoPush() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getPlataforma() { return plataforma; }
    public void setPlataforma(String plataforma) { this.plataforma = plataforma; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public OffsetDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(OffsetDateTime criadoEm) { this.criadoEm = criadoEm; }
}
