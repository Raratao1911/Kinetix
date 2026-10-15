package com.itbm.inf2fm.kinetix;

import com.itbm.inf2fm.kinetix.dto.ApiDtos.*;
import com.itbm.inf2fm.kinetix.model.entity.*;
import com.itbm.inf2fm.kinetix.model.repository.*;
import com.itbm.inf2fm.kinetix.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminServiceTest {
    private AssinaturaRepository assinaturas;
    private FisioterapeutaRepository fisios;
    private PlanoAssinaturaRepository planos;
    private AdminService service;
    private Fisioterapeuta fisio;
    private PlanoAssinatura plano;

    @BeforeEach
    void setup() {
        assinaturas = mock(AssinaturaRepository.class); fisios = mock(FisioterapeutaRepository.class);
        planos = mock(PlanoAssinaturaRepository.class);
        service = new AdminService(mock(EspecialidadeRepository.class), mock(ExercicioRepository.class),
            planos, assinaturas, fisios, mock(AvaliacaoRepository.class));
        Usuario usuario = new Usuario(); usuario.id = 7L;
        fisio = new Fisioterapeuta(usuario);
        plano = new PlanoAssinatura(); plano.id = 1L; plano.nome = "Plano teste";
        when(fisios.bloquearPorUsuarioId(7L)).thenReturn(Optional.of(fisio));
        when(planos.findById(1L)).thenReturn(Optional.of(plano));
        when(assinaturas.findByFisioterapeuta_Usuario_IdOrderByInicioDesc(7L)).thenReturn(List.of());
        when(assinaturas.save(any())).thenAnswer(call -> { Assinatura a = call.getArgument(0); a.id = 5L; return a; });
    }

    @Test
    void solicitacaoPermanecePendenteSemSimularPagamento() {
        var result = service.solicitarAssinatura(7L, 1L);
        assertEquals("PENDENTE", result.status()); assertEquals(1L, result.planoId());
    }

    @Test
    void impedeSolicitacoesDuplicadasEPlanosInativos() {
        Assinatura a = new Assinatura(); a.status = "PENDENTE";
        when(assinaturas.findByFisioterapeuta_Usuario_IdOrderByInicioDesc(7L)).thenReturn(List.of(a));
        assertThrows(ErroNegocio.class, () -> service.solicitarAssinatura(7L, 1L));
        when(assinaturas.findByFisioterapeuta_Usuario_IdOrderByInicioDesc(7L)).thenReturn(List.of());
        plano.ativo = false;
        assertThrows(ErroNegocio.class, () -> service.solicitarAssinatura(7L, 1L));
    }

    @Test
    void cancelamentoExigeAssinaturaDaPropriaConta() {
        Assinatura a = new Assinatura(); a.id = 5L; a.plano = plano; a.fisioterapeuta = fisio;
        when(assinaturas.findByFisioterapeuta_Usuario_IdOrderByInicioDesc(7L)).thenReturn(List.of(a));
        assertThrows(ErroNegocio.class, () -> service.cancelarMinhaAssinatura(7L, 6L));
        service.cancelarMinhaAssinatura(7L, 5L);
        assertEquals("CANCELADA", a.status); assertNotNull(a.fim);
        assertThrows(ErroNegocio.class, () -> service.cancelarMinhaAssinatura(7L, 5L));
    }

    @Test
    void aprovacaoNaoReabreAssinaturaEncerrada() {
        Assinatura a = new Assinatura(); a.id = 5L; a.plano = plano; a.fisioterapeuta = fisio;
        when(assinaturas.profissionalDaAssinatura(5L)).thenReturn(Optional.of(7L));
        when(assinaturas.findById(5L)).thenReturn(Optional.of(a));
        service.atualizarAssinatura(5L, "ATIVA"); assertEquals("ATIVA", a.status);
        service.atualizarAssinatura(5L, "CANCELADA");
        assertThrows(ErroNegocio.class, () -> service.atualizarAssinatura(5L, "ATIVA"));
    }

    @Test
    void planoRejeitaValorNegativo() {
        assertThrows(ErroNegocio.class, () -> service.criarPlano(new PlanoAssinaturaRequest("Teste", "", new BigDecimal("-1"))));
        verify(planos, never()).save(any());
    }
}
