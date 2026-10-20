package com.itbm.inf2fm.kinetix.model.entity;

import com.itbm.inf2fm.kinetix.config.CriptografiaDadosConverter;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "planos_exercicios")
public class PlanoExercicio {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "fisioterapeuta_id")
    public Fisioterapeuta fisioterapeuta;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "paciente_id")
    public Paciente paciente;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "consulta_id")
    public Consulta consulta;
    @Column(nullable = false, length = 160)
    public String titulo;
    @Convert(converter = CriptografiaDadosConverter.class)
    @Column(name = "orientacoes_enc", columnDefinition = "nvarchar(max)")
    public String orientacoes;
    @Column(nullable = false)
    public LocalDate inicio;
    public LocalDate fim;
    @Column(nullable = false)
    public boolean ativo = true;
    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criadoEm = OffsetDateTime.now();
    public PlanoExercicio() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Fisioterapeuta getFisioterapeuta() { return fisioterapeuta; }
    public void setFisioterapeuta(Fisioterapeuta fisioterapeuta) { this.fisioterapeuta = fisioterapeuta; }
    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }
    public Consulta getConsulta() { return consulta; }
    public void setConsulta(Consulta consulta) { this.consulta = consulta; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getOrientacoes() { return orientacoes; }
    public void setOrientacoes(String orientacoes) { this.orientacoes = orientacoes; }
    public LocalDate getInicio() { return inicio; }
    public void setInicio(LocalDate inicio) { this.inicio = inicio; }
    public LocalDate getFim() { return fim; }
    public void setFim(LocalDate fim) { this.fim = fim; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public OffsetDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(OffsetDateTime criadoEm) { this.criadoEm = criadoEm; }
}
