package com.itbm.inf2fm.kinetix;

import com.itbm.inf2fm.kinetix.dto.ApiDtos.ConfiguracaoPerfilRequest;
import com.itbm.inf2fm.kinetix.model.entity.*;
import com.itbm.inf2fm.kinetix.model.enums.PerfilUsuario;
import com.itbm.inf2fm.kinetix.model.repository.*;
import com.itbm.inf2fm.kinetix.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PerfilServiceTest {
    UsuarioRepository usuarios;
    PacienteRepository pacientes;
    FisioterapeutaRepository fisios;
    FotoPerfilRepository fotos;
    PerfilService service;
    Usuario usuario;
    Paciente paciente;
    Map<Long, FotoPerfil> imagens;

    @BeforeEach
    void setup() {
        usuarios = mock(UsuarioRepository.class); pacientes = mock(PacienteRepository.class);
        fisios = mock(FisioterapeutaRepository.class); fotos = mock(FotoPerfilRepository.class);
        service = new PerfilService(usuarios, pacientes, fisios, fotos);
        usuario = new Usuario(); usuario.id = 7L; usuario.nome = "Conta Teste";
        usuario.perfil = PerfilUsuario.PACIENTE;
        paciente = new Paciente(usuario); paciente.cidade = "Barueri"; paciente.uf = "SP";
        when(usuarios.findById(7L)).thenReturn(Optional.of(usuario));
        when(pacientes.findById(7L)).thenReturn(Optional.of(paciente));
        imagens = new HashMap<>();
        when(fotos.existsById(anyLong())).thenAnswer(call -> imagens.containsKey(call.getArgument(0)));
        when(fotos.findById(anyLong())).thenAnswer(call -> Optional.ofNullable(imagens.get(call.getArgument(0))));
        when(fotos.save(any(FotoPerfil.class))).thenAnswer(call -> {
            FotoPerfil foto = call.getArgument(0); imagens.put(foto.usuarioId, foto); return foto;
        });
        doAnswer(call -> { imagens.remove(call.getArgument(0)); return null; }).when(fotos).deleteById(anyLong());
    }

    ConfiguracaoPerfilRequest dados(boolean remover) {
        return new ConfiguracaoPerfilRequest("06400000", " Rua de Teste ", "123", "Barueri", "Centro", "sp",
            "+12025550123", "US", remover, "12.345.678-X");
    }

    @Test
    void enderecoCompletoLiberaAgendaETelefonePodeSerRemovido() {
        assertThat(service.meuPerfil(7L).completo()).isFalse();
        assertThatThrownBy(() -> service.exigirCompleto(7L)).isInstanceOf(ErroNegocio.class)
            .hasMessageContaining("antes de agendar");
        var salvo = service.salvar(7L, dados(false), null);
        assertThat(salvo.completo()).isTrue();
        assertThat(salvo.cep()).isEqualTo("06400-000");
        assertThat(salvo.logradouro()).isEqualTo("Rua de Teste");
        assertThat(salvo.uf()).isEqualTo("SP");
        assertThat(salvo.telefoneAdicional()).isEqualTo("+12025550123");
        assertThatCode(() -> service.exigirCompleto(7L)).doesNotThrowAnyException();
        assertThat(salvo.rg()).isEqualTo("12.345.678-X");
        service.salvar(7L, new ConfiguracaoPerfilRequest("06400000", "Rua", "123", "Barueri", "Centro", "SP", null, null, false, null), null);
        assertThat(usuario.telefoneAdicional).isNull();
        assertThat(usuario.paisTelefoneAdicional).isNull();
        assertThat(usuario.rg).isNull();
    }

    @Test
    void aceitePersisteVersaoEInstanteSemAlterarEndereco() {
        service.aceitarTermos(7L);
        assertThat(usuario.termosVersao).isEqualTo(PerfilService.VERSAO_TERMOS);
        assertThat(usuario.termosAceitosEm).isNotNull();
        assertThat(service.meuPerfil(7L).termosVersao()).isEqualTo(PerfilService.VERSAO_TERMOS);
        assertThat(service.meuPerfil(7L).completo()).isFalse();
    }

    @Test
    void fotoEGuardadaComoImagemNormalizadaEPodeSerRemovida() throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB), "png", bytes);
        var arquivo = new MockMultipartFile("foto", "foto.png", "image/png", bytes.toByteArray());
        var perfil = service.salvar(7L, dados(false), arquivo);
        assertThat(perfil.fotoDisponivel()).isTrue();
        FotoPerfil foto = service.foto(7L);
        assertThat(foto.tipo).isEqualTo("image/jpeg");
        assertThat(ImageIO.read(new ByteArrayInputStream(foto.conteudo)).getWidth()).isEqualTo(4);
        assertThat(service.salvar(7L, dados(true), null).fotoDisponivel()).isFalse();
        assertThatThrownBy(() -> service.foto(7L)).isInstanceOf(ErroNegocio.class);
    }

    @Test
    void arquivosInvalidosNaoAlteramEndereco() throws Exception {
        var largo = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2049, 1, BufferedImage.TYPE_INT_RGB), "png", largo);
        for (var arquivo : List.of(
            new MockMultipartFile("foto", "foto.svg", "image/svg+xml", "<svg/>".getBytes()),
            new MockMultipartFile("foto", "falso.png", "image/png", "nao e imagem".getBytes()),
            new MockMultipartFile("foto", "grande.png", "image/png", new byte[2 * 1024 * 1024 + 1]),
            new MockMultipartFile("foto", "largo.png", "image/png", largo.toByteArray()))) {
            assertThatThrownBy(() -> service.salvar(7L, dados(false), arquivo)).isInstanceOf(ErroNegocio.class);
        }
        assertThat(paciente.logradouro).isNull();
        assertThat(imagens).isEmpty();
    }

    @Test
    void configuraEnderecoDoFisioterapeutaSemAlterarRegistroProfissional() {
        usuario.perfil = PerfilUsuario.FISIO;
        var fisio = new Fisioterapeuta(usuario); fisio.crefitoNumero = "12345";
        when(fisios.findByUsuario_Id(7L)).thenReturn(Optional.of(fisio));
        assertThat(service.salvar(7L, dados(false), null).completo()).isTrue();
        assertThat(fisio.cep).isEqualTo("06400-000");
        assertThat(fisio.crefitoNumero).isEqualTo("12345");
    }

    @Test
    void contaInexistenteNaoAcessaFotoOuPerfil() {
        assertThatThrownBy(() -> service.meuPerfil(8L)).isInstanceOf(ErroNegocio.class);
        assertThatThrownBy(() -> service.foto(8L)).isInstanceOf(ErroNegocio.class);
    }
}
