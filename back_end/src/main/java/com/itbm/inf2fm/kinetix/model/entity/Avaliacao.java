package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;

@Entity
@Table(name = "avaliacoes")
public class Avaliacao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "consulta_id")
    public Consulta consulta;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "paciente_id")
    public Paciente paciente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "fisioterapeuta_id")
    public Fisioterapeuta fisioterapeuta;
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.TINYINT)
    public int nota;
    @Column(length = 1000)
    public String comentario;
    @Column(nullable = false, length = 16)
    public String status = "PENDENTE";
    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criadoEm = OffsetDateTime.now();
    public Avaliacao() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Consulta getConsulta() { return consulta; }
    public void setConsulta(Consulta consulta) { this.consulta = consulta; }
    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }
    public Fisioterapeuta getFisioterapeuta() { return fisioterapeuta; }
    public void setFisioterapeuta(Fisioterapeuta fisioterapeuta) { this.fisioterapeuta = fisioterapeuta; }
    public int getNota() { return nota; }
    public void setNota(int nota) { this.nota = nota; }
    public String getComentario() { return comentario; }
    public void setComentario(String comentario) { this.comentario = comentario; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(OffsetDateTime criadoEm) { this.criadoEm = criadoEm; }
}
