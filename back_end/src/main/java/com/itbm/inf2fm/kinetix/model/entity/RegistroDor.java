package com.itbm.inf2fm.kinetix.model.entity;

import com.itbm.inf2fm.kinetix.config.CriptografiaDadosConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;

@Entity
@Table(name = "registros_dor")
public class RegistroDor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "paciente_id")
    public Paciente paciente;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "consulta_id")
    public Consulta consulta;
    @Column(name = "escala_eva", nullable = false)
    @JdbcTypeCode(SqlTypes.TINYINT)
    public int escalaEva;
    @Convert(converter = CriptografiaDadosConverter.class)
    @Column(name = "observacao_enc", columnDefinition = "nvarchar(max)")
    public String observacao;
    @Column(name = "registrado_em", nullable = false)
    public OffsetDateTime registradoEm = OffsetDateTime.now();
    public RegistroDor() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }
    public Consulta getConsulta() { return consulta; }
    public void setConsulta(Consulta consulta) { this.consulta = consulta; }
    public int getEscalaEva() { return escalaEva; }
    public void setEscalaEva(int escalaEva) { this.escalaEva = escalaEva; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public OffsetDateTime getRegistradoEm() { return registradoEm; }
    public void setRegistradoEm(OffsetDateTime registradoEm) { this.registradoEm = registradoEm; }
}
