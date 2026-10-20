package com.itbm.inf2fm.kinetix.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "fisioterapeutas")
public class Fisioterapeuta {
    @Id @Column(name = "usuario_id")
    public Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @MapsId @JoinColumn(name = "usuario_id")
    public Usuario usuario;
    @Column(name = "crefito_numero", nullable = false, length = 30)
    public String crefitoNumero;
    @Column(name = "crefito_uf", nullable = false, length = 2)
    @JdbcTypeCode(SqlTypes.CHAR)
    public String crefitoUf;
    @Column(name = "crefito_verificado", nullable = false)
    public boolean crefitoVerificado;
    @Column(name = "nome_clinica", length = 160)
    public String nomeClinica;
    @Column(name = "apresentacao", length = 1200)
    public String apresentacao;
    @Column(length = 160)
    public String logradouro;
    @Column(length = 20)
    public String numero;
    @Column(length = 100)
    public String complemento;
    @Column(length = 100)
    public String bairro;
    @Column(nullable = false, length = 100)
    public String cidade;
    @Column(nullable = false, length = 2)
    @JdbcTypeCode(SqlTypes.CHAR)
    public String uf;
    @Column(length = 9)
    @JdbcTypeCode(SqlTypes.CHAR)
    public String cep;
    @Column(precision = 9, scale = 6)
    public BigDecimal latitude;
    @Column(precision = 9, scale = 6)
    public BigDecimal longitude;
    @Column(name = "atende_online", nullable = false)
    public boolean atendeOnline;
    @Column(nullable = false)
    public boolean ativo = true;
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "fisioterapeuta_especialidades",
        joinColumns = @JoinColumn(name = "fisioterapeuta_id"),
        inverseJoinColumns = @JoinColumn(name = "especialidade_id"))
    public Set<Especialidade> especialidades = new HashSet<>();

    protected Fisioterapeuta() {}
    public Fisioterapeuta(Usuario usuario) { this.usuario = usuario; }

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public String getCrefitoNumero() { return crefitoNumero; }
    public void setCrefitoNumero(String crefitoNumero) { this.crefitoNumero = crefitoNumero; }
    public String getCrefitoUf() { return crefitoUf; }
    public void setCrefitoUf(String crefitoUf) { this.crefitoUf = crefitoUf; }
    public boolean isCrefitoVerificado() { return crefitoVerificado; }
    public void setCrefitoVerificado(boolean crefitoVerificado) { this.crefitoVerificado = crefitoVerificado; }
    public String getNomeClinica() { return nomeClinica; }
    public void setNomeClinica(String nomeClinica) { this.nomeClinica = nomeClinica; }
    public String getApresentacao() { return apresentacao; }
    public void setApresentacao(String apresentacao) { this.apresentacao = apresentacao; }
    public String getLogradouro() { return logradouro; }
    public void setLogradouro(String logradouro) { this.logradouro = logradouro; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getComplemento() { return complemento; }
    public void setComplemento(String complemento) { this.complemento = complemento; }
    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public boolean isAtendeOnline() { return atendeOnline; }
    public void setAtendeOnline(boolean atendeOnline) { this.atendeOnline = atendeOnline; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public Set<Especialidade> getEspecialidades() { return especialidades; }
    public void setEspecialidades(Set<Especialidade> especialidades) { this.especialidades = especialidades; }
}
