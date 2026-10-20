package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "planos_assinatura")
public class PlanoAssinatura {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, length = 100)
    public String nome;
    @Column(length = 500)
    public String descricao;
    @Column(name = "preco_mensal", nullable = false, precision = 10, scale = 2)
    public BigDecimal precoMensal;
    @Column(nullable = false)
    public boolean ativo = true;
    public PlanoAssinatura() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public BigDecimal getPrecoMensal() { return precoMensal; }
    public void setPrecoMensal(BigDecimal precoMensal) { this.precoMensal = precoMensal; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}
