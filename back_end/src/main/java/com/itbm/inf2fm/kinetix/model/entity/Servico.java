package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;

@Entity
@Table(name = "servicos")
public class Servico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "fisioterapeuta_id")
    public Fisioterapeuta fisioterapeuta;
    @Column(nullable = false, length = 120)
    public String nome;
    @Column(length = 500)
    public String descricao;
    @Column(name = "duracao_minutos", nullable = false)
    @JdbcTypeCode(SqlTypes.SMALLINT)
    public int duracaoMinutos;
    @Column(nullable = false, precision = 10, scale = 2)
    public BigDecimal preco;
    @Column(nullable = false)
    public boolean ativo = true;
    public Servico() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Fisioterapeuta getFisioterapeuta() { return fisioterapeuta; }
    public void setFisioterapeuta(Fisioterapeuta fisioterapeuta) { this.fisioterapeuta = fisioterapeuta; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public int getDuracaoMinutos() { return duracaoMinutos; }
    public void setDuracaoMinutos(int duracaoMinutos) { this.duracaoMinutos = duracaoMinutos; }
    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}
