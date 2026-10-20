package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "especialidades")
public class Especialidade {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, unique = true, length = 100)
    public String nome;
    @Column(length = 500)
    public String descricao;
    @Column(nullable = false)
    public boolean ativa = true;
    public Especialidade() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public boolean isAtiva() { return ativa; }
    public void setAtiva(boolean ativa) { this.ativa = ativa; }
}
