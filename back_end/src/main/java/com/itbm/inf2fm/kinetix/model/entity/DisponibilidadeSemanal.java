package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "disponibilidades_semanais")
public class DisponibilidadeSemanal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "fisioterapeuta_id")
    public Fisioterapeuta fisioterapeuta;
    @Column(name = "dia_semana", nullable = false)
    @JdbcTypeCode(SqlTypes.TINYINT)
    public int diaSemana;
    @Column(name = "hora_inicio", nullable = false)
    public LocalTime horaInicio;
    @Column(name = "hora_fim", nullable = false)
    public LocalTime horaFim;
    @Column(name = "vigencia_inicio", nullable = false)
    public LocalDate vigenciaInicio;
    @Column(name = "vigencia_fim")
    public LocalDate vigenciaFim;
    @Column(nullable = false)
    public boolean ativa = true;
    public DisponibilidadeSemanal() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Fisioterapeuta getFisioterapeuta() { return fisioterapeuta; }
    public void setFisioterapeuta(Fisioterapeuta fisioterapeuta) { this.fisioterapeuta = fisioterapeuta; }
    public int getDiaSemana() { return diaSemana; }
    public void setDiaSemana(int diaSemana) { this.diaSemana = diaSemana; }
    public LocalTime getHoraInicio() { return horaInicio; }
    public void setHoraInicio(LocalTime horaInicio) { this.horaInicio = horaInicio; }
    public LocalTime getHoraFim() { return horaFim; }
    public void setHoraFim(LocalTime horaFim) { this.horaFim = horaFim; }
    public LocalDate getVigenciaInicio() { return vigenciaInicio; }
    public void setVigenciaInicio(LocalDate vigenciaInicio) { this.vigenciaInicio = vigenciaInicio; }
    public LocalDate getVigenciaFim() { return vigenciaFim; }
    public void setVigenciaFim(LocalDate vigenciaFim) { this.vigenciaFim = vigenciaFim; }
    public boolean isAtiva() { return ativa; }
    public void setAtiva(boolean ativa) { this.ativa = ativa; }
}
