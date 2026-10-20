package com.itbm.inf2fm.kinetix.service;

import com.itbm.inf2fm.kinetix.model.entity.*;
import com.itbm.inf2fm.kinetix.model.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.time.OffsetDateTime;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

class RedefinicaoSenhaServiceTest {
    UsuarioRepository usuarios;
    RedefinicaoSenhaRepository tokens;
    JavaMailSender sender;
    RedefinicaoSenhaService service;
    Usuario usuario;
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setup() {
        usuarios = mock(UsuarioRepository.class); tokens = mock(RedefinicaoSenhaRepository.class);
        sender = mock(JavaMailSender.class);
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);
        service = new RedefinicaoSenhaService(usuarios, tokens, encoder, provider, new MockEnvironment());
        usuario = new Usuario(); usuario.id = 1L; usuario.email = "teste@example.com";
        usuario.senhaHash = encoder.encode("SenhaAntiga123");
        when(usuarios.buscarParaRedefinicao(usuario.email)).thenReturn(Optional.of(usuario));
        when(usuarios.findById(1L)).thenReturn(Optional.of(usuario));
    }

    @Test void enviaTokenSomentePorEmailEPersisteHashComExpiracao() {
        service.solicitar(usuario.email);
        var email = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(email.capture());
        String token = email.getValue().getText().split("#token=")[1].split("\\s")[0];
        assertThat(token).matches("[A-Za-z0-9_-]{43}");
        var reset = ArgumentCaptor.forClass(RedefinicaoSenha.class);
        verify(tokens).save(reset.capture());
        assertThat(reset.getValue().tokenHash).isEqualTo(RedefinicaoSenhaService.hash(token)).isNotEqualTo(token);
        assertThat(reset.getValue().expiraEm).isEqualTo(reset.getValue().criadoEm.plusMinutes(30));
    }
    @Test void emailDesconhecidoNaoEnviaMensagem() {
        service.solicitar("ausente@example.com");
        verifyNoInteractions(sender, tokens);
    }
    @Test void limitaReenvioDuranteUmMinuto() {
        RedefinicaoSenha reset = reset(); reset.criadoEm = OffsetDateTime.now();
        when(tokens.findById(1L)).thenReturn(Optional.of(reset));
        service.solicitar(usuario.email); verifyNoInteractions(sender); verify(tokens, never()).save(any());
    }
    @Test void alteraSenhaComBCryptInvalidaSessoesEImpedeReuso() {
        RedefinicaoSenha reset = reset();
        when(tokens.buscarPorToken(anyString())).thenReturn(Optional.of(reset));
        service.redefinir("token", "NovaSenha123!");
        assertThat(encoder.matches("NovaSenha123!", usuario.senhaHash)).isTrue();
        assertThat(encoder.matches("SenhaAntiga123", usuario.senhaHash)).isFalse();
        assertThat(usuario.versaoSenha).isEqualTo(1);
        assertThatThrownBy(() -> service.redefinir("token", "OutraSenha123!")).isInstanceOf(ErroNegocio.class);
        verify(usuarios, times(1)).save(usuario);
    }
    @Test void rejeitaTokenExpiradoSemAlterarSenha() {
        RedefinicaoSenha reset = reset(); reset.expiraEm = OffsetDateTime.now().minusSeconds(1);
        when(tokens.buscarPorToken(anyString())).thenReturn(Optional.of(reset));
        assertThatThrownBy(() -> service.redefinir("token", "NovaSenha123!")).isInstanceOf(ErroNegocio.class);
        verify(usuarios, never()).save(any());
    }
    @Test void rejeitaTokenInexistenteESenhaAcimaDoLimiteDeBytes() {
        assertThatThrownBy(() -> service.redefinir("inexistente", "NovaSenha123!")).isInstanceOf(ErroNegocio.class);
        assertThatThrownBy(() -> service.redefinir("token", "á".repeat(37))).isInstanceOf(ErroNegocio.class);
        verify(usuarios, never()).save(any());
    }
    private RedefinicaoSenha reset() {
        RedefinicaoSenha reset = new RedefinicaoSenha(); reset.usuarioId = 1L;
        reset.expiraEm = OffsetDateTime.now().plusMinutes(30); return reset;
    }
}
