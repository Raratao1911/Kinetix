package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;

@Entity
@Table(name = "pacientes")
public class Paciente {
    @Id @Column(name = "usuario_id")
    public Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @MapsId @JoinColumn(name = "usuario_id")
    public Usuario usuario;
    @Column(name = "data_nascimento")
    public LocalDate dataNascimento;
    @Column(length = 9)
    public String cep;
    @Column(length = 160)
    public String logradouro;
    @Column(length = 20)
    public String numero;
    @Column(length = 100)
    public String cidade;
    @Column(length = 100)
    public String bairro;
    @Column(length = 2)
    @JdbcTypeCode(SqlTypes.CHAR)
    public String uf;
    protected Paciente() {}
    public Paciente(Usuario usuario) { this.usuario = usuario; }

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public String getLogradouro() { return logradouro; }
    public void setLogradouro(String logradouro) { this.logradouro = logradouro; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }
    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
}
