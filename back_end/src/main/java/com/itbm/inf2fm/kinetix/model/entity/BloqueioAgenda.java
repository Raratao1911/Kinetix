package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "bloqueios_agenda")
public class BloqueioAgenda {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "fisioterapeuta_id")
    public Fisioterapeuta fisioterapeuta;
    @Column(nullable = false)
    public OffsetDateTime inicio;
    @Column(nullable = false)
    public OffsetDateTime fim;
    @Column(length = 300)
    public String motivo;
    public BloqueioAgenda() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Fisioterapeuta getFisioterapeuta() { return fisioterapeuta; }
    public void setFisioterapeuta(Fisioterapeuta fisioterapeuta) { this.fisioterapeuta = fisioterapeuta; }
    public OffsetDateTime getInicio() { return inicio; }
    public void setInicio(OffsetDateTime inicio) { this.inicio = inicio; }
    public OffsetDateTime getFim() { return fim; }
    public void setFim(OffsetDateTime fim) { this.fim = fim; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
