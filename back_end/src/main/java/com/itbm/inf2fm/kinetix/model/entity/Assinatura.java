package com.itbm.inf2fm.kinetix.model.entity;
import jakarta.persistence.*;
import java.time.LocalDate;
@Entity
@Table(name="assinaturas")
public class Assinatura {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="fisioterapeuta_id") public Fisioterapeuta fisioterapeuta;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="plano_id") public PlanoAssinatura plano;
    @Column(nullable=false) public LocalDate inicio;
    public LocalDate fim;
    @Column(nullable=false,length=20) public String status="PENDENTE";
    public Assinatura() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Fisioterapeuta getFisioterapeuta() { return fisioterapeuta; }
    public void setFisioterapeuta(Fisioterapeuta fisioterapeuta) { this.fisioterapeuta = fisioterapeuta; }
    public PlanoAssinatura getPlano() { return plano; }
    public void setPlano(PlanoAssinatura plano) { this.plano = plano; }
    public LocalDate getInicio() { return inicio; }
    public void setInicio(LocalDate inicio) { this.inicio = inicio; }
    public LocalDate getFim() { return fim; }
    public void setFim(LocalDate fim) { this.fim = fim; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
