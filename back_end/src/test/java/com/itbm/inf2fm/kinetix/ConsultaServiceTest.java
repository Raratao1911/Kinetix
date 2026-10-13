package com.itbm.inf2fm.kinetix;

import com.itbm.inf2fm.kinetix.model.entity.*;
import com.itbm.inf2fm.kinetix.model.repository.*;
import com.itbm.inf2fm.kinetix.service.ConsultaService;
import com.itbm.inf2fm.kinetix.service.NotificacaoService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.mock.env.MockEnvironment;
import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ConsultaServiceTest {
    @Test
    @Timeout(5)
    void horariosNaoVoltamAoInicioDoDiaAoCruzarMeiaNoite() {
        var fisioterapeutas = mock(FisioterapeutaRepository.class);
        var servicos = mock(ServicoRepository.class);
        var disponibilidades = mock(DisponibilidadeRepository.class);
        var service = new ConsultaService(fisioterapeutas, mock(PacienteRepository.class), servicos,
            disponibilidades, mock(BloqueioAgendaRepository.class), mock(ConsultaRepository.class),
            mock(AvaliacaoRepository.class), mock(NotificacaoService.class), new MockEnvironment());
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
        assertThat(service.horariosDisponiveis(1L, 2L, dia, dia))
            .containsExactly(dia.atTime(22, 0).atZone(ZoneId.of("America/Sao_Paulo")).toOffsetDateTime());
    }
}
