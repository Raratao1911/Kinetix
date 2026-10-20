package com.itbm.inf2fm.kinetix.service;

import com.itbm.inf2fm.kinetix.model.entity.RedefinicaoSenha;
import com.itbm.inf2fm.kinetix.model.repository.*;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class RedefinicaoSenhaService {
    public static final String MENSAGEM = "Se houver uma conta ativa com esse e-mail, enviaremos um link para redefinir a senha.";
    private final UsuarioRepository usuarios;
    private final RedefinicaoSenhaRepository tokens;
    private final PasswordEncoder encoder;
    private final ObjectProvider<JavaMailSender> mail;
    private final Environment env;
    private final SecureRandom random = new SecureRandom();

    public RedefinicaoSenhaService(UsuarioRepository usuarios, RedefinicaoSenhaRepository tokens,
        PasswordEncoder encoder, ObjectProvider<JavaMailSender> mail, Environment env) {
        this.usuarios = usuarios; this.tokens = tokens; this.encoder = encoder; this.mail = mail; this.env = env;
    }

    @Transactional
    public void solicitar(String email) {
        JavaMailSender sender = mail.getIfAvailable();
        if (sender == null) throw new ErroNegocio(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
            "O envio de e-mail está indisponível. Tente novamente mais tarde.");
        var usuario = usuarios.buscarParaRedefinicao(email.trim()).filter(u -> u.ativo);
        if (usuario.isEmpty()) return;
        var u = usuario.get();
        var agora = OffsetDateTime.now();
        var anterior = tokens.findById(u.id);
        if (anterior.isPresent() && anterior.get().criadoEm.isAfter(agora.minusMinutes(1))) return;
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RedefinicaoSenha reset = anterior.orElseGet(RedefinicaoSenha::new);
        reset.usuarioId = u.id; reset.tokenHash = hash(token); reset.criadoEm = agora;
        reset.expiraEm = agora.plusMinutes(30); reset.utilizado = false;
        tokens.save(reset);
        String origem = env.getProperty("KINETIX_WEB_URL", "http://localhost:5173").replaceAll("/+$", "");
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(env.getProperty("KINETIX_MAIL_FROM", "nao-responda@kinetix.example"));
        message.setTo(u.email); message.setSubject("KINETIX — Redefinição de senha");
        message.setText("Recebemos uma solicitação para redefinir sua senha.\n\n"
            + origem + "/redefinir-senha#token=" + token
            + "\n\nO link expira em 30 minutos e só pode ser usado uma vez. Se não foi você, ignore esta mensagem.");
        try { sender.send(message); }
        catch (org.springframework.mail.MailException e) {
            throw new ErroNegocio(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                "O envio de e-mail está indisponível. Tente novamente mais tarde.");
        }
    }

    @Transactional
    public void redefinir(String token, String senha) {
        if (senha.length() < 8 || senha.getBytes(StandardCharsets.UTF_8).length > 72)
            throw ErroNegocio.invalido("A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes UTF-8.");
        var reset = tokens.buscarPorToken(hash(token)).filter(r -> !r.utilizado && r.expiraEm.isAfter(OffsetDateTime.now()))
            .orElseThrow(() -> ErroNegocio.invalido("Link inválido ou expirado. Solicite um novo link."));
        var usuario = usuarios.findById(reset.usuarioId).filter(u -> u.ativo)
            .orElseThrow(() -> ErroNegocio.invalido("Link inválido ou expirado. Solicite um novo link."));
        usuario.senhaHash = encoder.encode(senha); usuario.versaoSenha++; reset.utilizado = true;
        usuarios.save(usuario); tokens.save(reset);
    }

    static String hash(String token) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
