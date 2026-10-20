package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "notificacoes")
public class Notificacao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "usuario_id")
    public Usuario usuario;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "consulta_id")
    public Consulta consulta;
    @Column(nullable = false, length = 120)
    public String titulo;
    @Column(nullable = false, length = 300)
    public String mensagem;
    @Column(name = "enviar_em", nullable = false)
    public OffsetDateTime enviarEm;
    @Column(nullable = false, length = 16)
    public String status = "PENDENTE";
    @Column(name = "enviado_em")
    public OffsetDateTime enviadoEm;
    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criadoEm = OffsetDateTime.now();
    public Notificacao() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public Consulta getConsulta() { return consulta; }
    public void setConsulta(Consulta consulta) { this.consulta = consulta; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }
    public OffsetDateTime getEnviarEm() { return enviarEm; }
    public void setEnviarEm(OffsetDateTime enviarEm) { this.enviarEm = enviarEm; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getEnviadoEm() { return enviadoEm; }
    public void setEnviadoEm(OffsetDateTime enviadoEm) { this.enviadoEm = enviadoEm; }
    public OffsetDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(OffsetDateTime criadoEm) { this.criadoEm = criadoEm; }
}
