package com.itbm.inf2fm.kinetix.model.entity;

import com.itbm.inf2fm.kinetix.config.CriptografiaDadosConverter;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "prontuarios")
public class Prontuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "consulta_id")
    public Consulta consulta;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "paciente_id")
    public Paciente paciente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "fisioterapeuta_id")
    public Fisioterapeuta fisioterapeuta;
    @Convert(converter = CriptografiaDadosConverter.class)
    @Column(name = "registro_clinico_enc", nullable = false, columnDefinition = "nvarchar(max)")
    public String registroClinico;
    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criadoEm = OffsetDateTime.now();
    @Column(name = "atualizado_em", nullable = false)
    public OffsetDateTime atualizadoEm = OffsetDateTime.now();
    @PreUpdate void atualizarData() { atualizadoEm = OffsetDateTime.now(); }
    public Prontuario() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Consulta getConsulta() { return consulta; }
    public void setConsulta(Consulta consulta) { this.consulta = consulta; }
    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }
    public Fisioterapeuta getFisioterapeuta() { return fisioterapeuta; }
    public void setFisioterapeuta(Fisioterapeuta fisioterapeuta) { this.fisioterapeuta = fisioterapeuta; }
    public String getRegistroClinico() { return registroClinico; }
    public void setRegistroClinico(String registroClinico) { this.registroClinico = registroClinico; }
    public OffsetDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(OffsetDateTime criadoEm) { this.criadoEm = criadoEm; }
    public OffsetDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(OffsetDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
