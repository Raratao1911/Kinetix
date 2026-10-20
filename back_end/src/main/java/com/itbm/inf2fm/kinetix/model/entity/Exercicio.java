package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "exercicios")
public class Exercicio {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, length = 120)
    public String nome;
    @Column(length = 1000)
    public String descricao;
    @Column(name = "video_url", length = 500)
    public String videoUrl;
    @Column(nullable = false)
    public boolean ativo = true;
    public Exercicio() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}
