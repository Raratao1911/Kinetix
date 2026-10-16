package com.itbm.inf2fm.kinetix;

import com.itbm.inf2fm.kinetix.model.entity.*;
import com.itbm.inf2fm.kinetix.model.repository.*;
import com.itbm.inf2fm.kinetix.service.ConsultaService;
import com.itbm.inf2fm.kinetix.service.NotificacaoService;
import com.itbm.inf2fm.kinetix.service.PerfilService;
import com.itbm.inf2fm.kinetix.service.ErroNegocio;
import com.itbm.inf2fm.kinetix.dto.ApiDtos.ConsultaRequest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.mockito.Mockito.*;

// Mockito matchers intentionally return null placeholders when defining mock behavior.
@SuppressWarnings("null")
class ConsultaServiceTest {
    @Test
    void avaliacaoExigeProprietarioSessaoRealizadaENaoPodeDuplicar() {
        var consultas = mock(ConsultaRepository.class);
        var avaliacoes = mock(AvaliacaoRepository.class);
        var service = new ConsultaService(mock(FisioterapeutaRepository.class), mock(PacienteRepository.class),
            mock(ServicoRepository.class), mock(DisponibilidadeRepository.class), mock(BloqueioAgendaRepository.class),
            consultas, avaliacoes, mock(NotificacaoService.class), new MockEnvironment(), mock(PerfilService.class));
        Usuario usuario = new Usuario(); usuario.id = 1L;
        Consulta c = new Consulta(); c.id = 10L; c.paciente = new Paciente(usuario);
        when(consultas.bloquearPorId(10L)).thenReturn(Optional.of(c));
        when(consultas.findById(10L)).thenReturn(Optional.of(c));
        var request = new com.itbm.inf2fm.kinetix.dto.ApiDtos.AvaliacaoRequest(5, "Bom atendimento");
        org.junit.jupiter.api.Assertions.assertThrows(ErroNegocio.class, () -> service.avaliar(10L, 2L, request));
        org.junit.jupiter.api.Assertions.assertThrows(ErroNegocio.class, () -> service.minhaAvaliacao(10L, 2L));
        c.status = com.itbm.inf2fm.kinetix.model.enums.StatusConsulta.CONFIRMADA;
        org.junit.jupiter.api.Assertions.assertThrows(ErroNegocio.class, () -> service.avaliar(10L, 1L, request));
        c.status = com.itbm.inf2fm.kinetix.model.enums.StatusConsulta.REALIZADA;
        service.avaliar(10L, 1L, request);
        verify(avaliacoes).save(argThat(a -> a.nota == 5 && "PENDENTE".equals(a.status)));
        when(avaliacoes.existsByConsulta_Id(10L)).thenReturn(true);
        org.junit.jupiter.api.Assertions.assertThrows(ErroNegocio.class, () -> service.avaliar(10L, 1L, request));
    }

    @Test
    void perfilIncompletoImpedeAgendamentoAntesDeReservarHorario() {
        var perfis = mock(PerfilService.class);
        var consultas = mock(ConsultaRepository.class);
        var fisios = mock(FisioterapeutaRepository.class);
        doThrow(ErroNegocio.conflito("Complete o perfil.")).when(perfis).exigirCompleto(1L);
        var service = new ConsultaService(fisios, mock(PacienteRepository.class), mock(ServicoRepository.class),
            mock(DisponibilidadeRepository.class), mock(BloqueioAgendaRepository.class), consultas,
            mock(AvaliacaoRepository.class), mock(NotificacaoService.class), new MockEnvironment(), perfis);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.agendar(1L,
            new ConsultaRequest(2L, 3L, OffsetDateTime.now().plusDays(1))))
            .isInstanceOf(ErroNegocio.class).hasMessageContaining("Complete o perfil");
        verifyNoInteractions(consultas, fisios);
    }

    @Test
    void horariosNaoVoltamAoInicioDoDiaAoCruzarMeiaNoite() {
        var fisioterapeutas = mock(FisioterapeutaRepository.class);
        var servicos = mock(ServicoRepository.class);
        var disponibilidades = mock(DisponibilidadeRepository.class);
        var service = new ConsultaService(fisioterapeutas, mock(PacienteRepository.class), servicos,
            disponibilidades, mock(BloqueioAgendaRepository.class), mock(ConsultaRepository.class),
            mock(AvaliacaoRepository.class), mock(NotificacaoService.class), new MockEnvironment(), mock(PerfilService.class));
        Usuario usuario = new Usuario();
        usuario.id = 1L;
        Fisioterapeuta fisio = new Fisioterapeuta(usuario);
        Servico servico = new Servico();
        servico.duracaoMinutos = 60;
        LocalDate dia = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(1);
        DisponibilidadeSemanal disponibilidade = new DisponibilidadeSemanal();
        disponibilidade.horaInicio = LocalTime.of(22, 0);
        disponibilidade.horaFim = LocalTime.of(23, 59);
        disponibilidade.vigenciaInicio = dia;
        when(fisioterapeutas.buscarPerfilPublico(1L)).thenReturn(Optional.of(fisio));
        when(servicos.findByIdAndFisioterapeuta_Usuario_IdAndAtivoTrue(2L, 1L)).thenReturn(Optional.of(servico));
        when(disponibilidades.findByFisioterapeuta_Usuario_IdAndDiaSemanaAndAtivaTrue(1L, dia.getDayOfWeek().getValue()))
            .thenReturn(List.of(disponibilidade));
        assertTimeoutPreemptively(Duration.ofSeconds(5), () ->
            assertThat(service.horariosDisponiveis(1L, 2L, dia, dia))
                .containsExactly(dia.atTime(22, 0).atZone(ZoneId.of("America/Sao_Paulo")).toOffsetDateTime()));
    }
}
