package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "auditoria_acesso_saude")
public class AuditoriaAcessoSaude {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "ator_id")
    public Usuario ator;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "paciente_id")
    public Paciente paciente;
    @Column(nullable = false, length = 40)
    public String recurso;
    @Column(name = "recurso_id")
    public Long recursoId;
    @Column(nullable = false, length = 20)
    public String acao;
    @Column(name = "acessado_em", nullable = false)
    public OffsetDateTime acessadoEm = OffsetDateTime.now();
    public AuditoriaAcessoSaude() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getAtor() { return ator; }
    public void setAtor(Usuario ator) { this.ator = ator; }
    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }
    public String getRecurso() { return recurso; }
    public void setRecurso(String recurso) { this.recurso = recurso; }
    public Long getRecursoId() { return recursoId; }
    public void setRecursoId(Long recursoId) { this.recursoId = recursoId; }
    public String getAcao() { return acao; }
    public void setAcao(String acao) { this.acao = acao; }
    public OffsetDateTime getAcessadoEm() { return acessadoEm; }
    public void setAcessadoEm(OffsetDateTime acessadoEm) { this.acessadoEm = acessadoEm; }
}
