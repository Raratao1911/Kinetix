package com.itbm.inf2fm.kinetix.model.entity;

import com.itbm.inf2fm.kinetix.model.enums.PerfilUsuario;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "usuarios")
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, length = 120)
    public String nome;
    @Column(nullable = false, unique = true, length = 254)
    public String email;
    @Column(name = "senha_hash", nullable = false, length = 100)
    public String senhaHash;
    @Column(name = "versao_senha", nullable = false)
    public int versaoSenha;
    @Column(nullable = false)
    public boolean demonstracao;
    @Column(length = 30)
    public String telefone;
    @Column(name = "telefone_adicional", length = 16)
    public String telefoneAdicional;
    @Column(name = "pais_telefone_adicional", length = 2)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.CHAR)
    public String paisTelefoneAdicional;
    @Column(name = "documento_identidade", length = 30)
    public String documentoIdentidade;
    @Column(length = 20)
    public String rg;
    @Column(name = "termos_aceitos_em")
    public OffsetDateTime termosAceitosEm;
    @Column(name = "termos_versao", length = 20)
    public String termosVersao;
    @Column(name = "foto_url", length = 500)
    public String fotoUrl;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    public PerfilUsuario perfil;
    @Column(nullable = false)
    public boolean ativo = true;
    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criadoEm = OffsetDateTime.now();

    public Usuario() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getTelefoneAdicional() { return telefoneAdicional; }
    public void setTelefoneAdicional(String telefoneAdicional) { this.telefoneAdicional = telefoneAdicional; }
    public String getPaisTelefoneAdicional() { return paisTelefoneAdicional; }
    public void setPaisTelefoneAdicional(String paisTelefoneAdicional) { this.paisTelefoneAdicional = paisTelefoneAdicional; }
    public String getDocumentoIdentidade() { return documentoIdentidade; }
    public void setDocumentoIdentidade(String documentoIdentidade) { this.documentoIdentidade = documentoIdentidade; }
    public String getRg() { return rg; }
    public void setRg(String rg) { this.rg = rg; }
    public OffsetDateTime getTermosAceitosEm() { return termosAceitosEm; }
    public void setTermosAceitosEm(OffsetDateTime termosAceitosEm) { this.termosAceitosEm = termosAceitosEm; }
    public String getTermosVersao() { return termosVersao; }
    public void setTermosVersao(String termosVersao) { this.termosVersao = termosVersao; }
    public String getFotoUrl() { return fotoUrl; }
    public void setFotoUrl(String fotoUrl) { this.fotoUrl = fotoUrl; }
    public PerfilUsuario getPerfil() { return perfil; }
    public void setPerfil(PerfilUsuario perfil) { this.perfil = perfil; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public OffsetDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(OffsetDateTime criadoEm) { this.criadoEm = criadoEm; }
}
