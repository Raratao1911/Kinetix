package com.itbm.inf2fm.kinetix.model.entity;

import com.itbm.inf2fm.kinetix.model.enums.StatusConsulta;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "consultas")
public class Consulta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "paciente_id")
    public Paciente paciente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "fisioterapeuta_id")
    public Fisioterapeuta fisioterapeuta;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "servico_id")
    public Servico servico;
    @Column(nullable = false)
    public OffsetDateTime inicio;
    @Column(nullable = false)
    public OffsetDateTime fim;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24)
    public StatusConsulta status = StatusConsulta.CONFIRMADA;
    @Column(name = "reserva_ativa", nullable = false)
    public boolean reservaAtiva = true;
    @Column(nullable = false, precision = 10, scale = 2)
    public BigDecimal preco;
    @Column(name = "duracao_minutos", nullable = false)
    @JdbcTypeCode(SqlTypes.SMALLINT)
    public int duracaoMinutos;
    @Column(name = "motivo_cancelamento", length = 500)
    public String motivoCancelamento;
    @Column(name = "criado_em", nullable = false)
    public OffsetDateTime criadoEm = OffsetDateTime.now();
    @Column(name = "atualizado_em", nullable = false)
    public OffsetDateTime atualizadoEm = OffsetDateTime.now();
    @PreUpdate void atualizarData() { atualizadoEm = OffsetDateTime.now(); }
    public Consulta() {}

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }
    public Fisioterapeuta getFisioterapeuta() { return fisioterapeuta; }
    public void setFisioterapeuta(Fisioterapeuta fisioterapeuta) { this.fisioterapeuta = fisioterapeuta; }
    public Servico getServico() { return servico; }
    public void setServico(Servico servico) { this.servico = servico; }
    public OffsetDateTime getInicio() { return inicio; }
    public void setInicio(OffsetDateTime inicio) { this.inicio = inicio; }
    public OffsetDateTime getFim() { return fim; }
    public void setFim(OffsetDateTime fim) { this.fim = fim; }
    public StatusConsulta getStatus() { return status; }
    public void setStatus(StatusConsulta status) { this.status = status; }
    public boolean isReservaAtiva() { return reservaAtiva; }
    public void setReservaAtiva(boolean reservaAtiva) { this.reservaAtiva = reservaAtiva; }
    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }
    public int getDuracaoMinutos() { return duracaoMinutos; }
    public void setDuracaoMinutos(int duracaoMinutos) { this.duracaoMinutos = duracaoMinutos; }
    public String getMotivoCancelamento() { return motivoCancelamento; }
    public void setMotivoCancelamento(String motivoCancelamento) { this.motivoCancelamento = motivoCancelamento; }
    public OffsetDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(OffsetDateTime criadoEm) { this.criadoEm = criadoEm; }
    public OffsetDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(OffsetDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
