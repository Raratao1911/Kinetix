package com.itbm.inf2fm.kinetix;

import com.itbm.inf2fm.kinetix.dto.ApiDtos.*;
import com.itbm.inf2fm.kinetix.model.entity.*;
import com.itbm.inf2fm.kinetix.model.repository.*;
import com.itbm.inf2fm.kinetix.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProfissionalServiceTest {
    private FisioterapeutaRepository fisioterapeutas;
    private DisponibilidadeRepository disponibilidades;
    private EspecialidadeRepository especialidades;
    private ProfissionalService service;

    @BeforeEach
    void setup() {
        fisioterapeutas = mock(FisioterapeutaRepository.class);
        disponibilidades = mock(DisponibilidadeRepository.class);
        especialidades = mock(EspecialidadeRepository.class);
        service = new ProfissionalService(fisioterapeutas, mock(ServicoRepository.class),
            mock(AvaliacaoRepository.class), especialidades, mock(PlanoAssinaturaRepository.class), disponibilidades);
    }

    @Test
    void removerHorarioExigePropriedadeEPreservaConsultas() {
        DisponibilidadeSemanal d = new DisponibilidadeSemanal();
        d.ativa = true;
        when(disponibilidades.findByIdAndFisioterapeuta_Usuario_IdAndAtivaTrue(10L, 7L)).thenReturn(Optional.of(d));
        service.removerDisponibilidade(7L, 10L);
        assertFalse(d.ativa);
        assertThrows(ErroNegocio.class, () -> service.removerDisponibilidade(8L, 10L));
    }

    @Test
    void especialidadesInexistentesOuInativasNaoSaoAceitas() {
        Fisioterapeuta f = mock(Fisioterapeuta.class);
        when(fisioterapeutas.findByUsuario_Id(7L)).thenReturn(Optional.of(f));
        when(especialidades.findAllById(Set.of(3L))).thenReturn(List.of());
        assertThrows(ErroNegocio.class, () -> service.atualizarEspecialidades(7L, new EspecialidadesPerfilRequest(Set.of(3L))));
        Especialidade e = new Especialidade();
        e.ativa = false;
        when(especialidades.findAllById(Set.of(3L))).thenReturn(List.of(e));
        assertThrows(ErroNegocio.class, () -> service.atualizarEspecialidades(7L, new EspecialidadesPerfilRequest(Set.of(3L))));
    }

    @Test
    void disponibilidadeDetectaConflitoMasPermiteVigenciasSeparadas() {
        when(fisioterapeutas.bloquearPorUsuarioId(7L)).thenReturn(Optional.of(mock(Fisioterapeuta.class)));
        DisponibilidadeSemanal d = new DisponibilidadeSemanal();
        d.horaInicio = LocalTime.of(8, 0); d.horaFim = LocalTime.of(12, 0);
        d.vigenciaInicio = LocalDate.of(2026, 1, 1); d.vigenciaFim = LocalDate.of(2026, 1, 31);
        when(disponibilidades.findByFisioterapeuta_Usuario_IdAndDiaSemanaAndAtivaTrue(7L, 1)).thenReturn(List.of(d));
        assertThrows(ErroNegocio.class, () -> service.adicionarDisponibilidade(7L,
            new DisponibilidadeRequest(1, LocalTime.of(10, 0), LocalTime.of(13, 0), LocalDate.of(2026, 1, 15), null)));
        service.adicionarDisponibilidade(7L,
            new DisponibilidadeRequest(1, LocalTime.of(10, 0), LocalTime.of(13, 0), LocalDate.of(2026, 2, 1), null));
        verify(disponibilidades).save(any(DisponibilidadeSemanal.class));
    }

    @Test
    void disponibilidadeRejeitaIntervalosInvalidos() {
        when(fisioterapeutas.bloquearPorUsuarioId(7L)).thenReturn(Optional.of(mock(Fisioterapeuta.class)));
        assertThrows(ErroNegocio.class, () -> service.adicionarDisponibilidade(7L,
            new DisponibilidadeRequest(1, LocalTime.of(12, 0), LocalTime.of(8, 0), LocalDate.now(), null)));
    }

    @Test
    void buscaRejeitaCoordenadasERaioInvalidos() {
        assertThrows(ErroNegocio.class, () -> service.buscar(null, null, null, null, Double.NaN, 0.0, null));
        assertThrows(ErroNegocio.class, () -> service.buscar(null, null, null, null, 91.0, 0.0, null));
        assertThrows(ErroNegocio.class, () -> service.buscar(null, null, null, null, 0.0, 0.0, Double.NaN));
        verifyNoInteractions(fisioterapeutas);
    }
}

