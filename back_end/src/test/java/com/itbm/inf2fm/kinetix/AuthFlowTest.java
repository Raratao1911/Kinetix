package com.itbm.inf2fm.kinetix;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itbm.inf2fm.kinetix.config.SegurancaConfig;
import com.itbm.inf2fm.kinetix.controller.ApiExceptionHandler;
import com.itbm.inf2fm.kinetix.controller.AuthController;
import com.itbm.inf2fm.kinetix.model.entity.Usuario;
import com.itbm.inf2fm.kinetix.model.repository.*;
import com.itbm.inf2fm.kinetix.service.AuthService;
import com.itbm.inf2fm.kinetix.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Real HTTP validation, password hashing and JWT filters; persistence is isolated here.
@SpringBootTest(classes = AuthFlowTest.Config.class, properties = {
    "kinetix.security.jwt.secret-base64=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
    "debug=false", "logging.level.root=WARN", "logging.level.org.springframework.web=WARN"
})
@AutoConfigureMockMvc
class AuthFlowTest {
    @SpringBootConfiguration
    @EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class, FlywayAutoConfiguration.class})
    @Import({SegurancaConfig.class, AuthController.class, ApiExceptionHandler.class,
        AuthService.class, JwtService.class, Probe.class})
    static class Config {}

    @RestController
    static class Probe {
        @GetMapping("/api/test/me")
        Map<String, String> me(@AuthenticationPrincipal Jwt jwt) {
            return Map.of("usuarioId", jwt.getSubject(), "perfil", jwt.getClaimAsString("role"));
        }
        @GetMapping("/api/test/fisio")
        @PreAuthorize("hasRole('FISIO')")
        String fisio() { return "ok"; }
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired PasswordEncoder encoder;
    @MockitoBean UsuarioRepository usuarios;
    @MockitoBean PacienteRepository pacientes;
    @MockitoBean FisioterapeutaRepository fisioterapeutas;
    @MockitoBean EspecialidadeRepository especialidades;
    private final Map<String, Usuario> contas = new ConcurrentHashMap<>();

    @BeforeEach
    void persistence() {
        contas.clear();
        AtomicLong ids = new AtomicLong();
        when(usuarios.existsByEmailIgnoreCase(anyString()))
            .thenAnswer(call -> contas.containsKey(call.getArgument(0, String.class).toLowerCase()));
        when(usuarios.findByEmailIgnoreCase(anyString()))
            .thenAnswer(call -> Optional.ofNullable(contas.get(call.getArgument(0, String.class).toLowerCase())));
        when(usuarios.save(any(Usuario.class))).thenAnswer(call -> {
            Usuario usuario = call.getArgument(0);
            usuario.id = ids.incrementAndGet();
            contas.put(usuario.email, usuario);
            return usuario;
        });
    }

    private String paciente() throws Exception {
        return mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json")
            .content("""
                {"nome":"Paciente Teste","email":"PACIENTE@example.com","senha":"Senha123!","uf":"sp"}
                """))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.perfil").value("PACIENTE"))
            .andReturn().getResponse().getContentAsString();
    }

    @Test
    void cadastroLoginETokenPaciente() throws Exception {
        paciente();
        assertThat(encoder.matches("Senha123!", contas.get("paciente@example.com").senhaHash)).isTrue();
        verify(pacientes).save(argThat(p -> "SP".equals(p.uf)));
        String response = mvc.perform(post("/api/v1/auth/login").contentType("application/json")
            .content("""
                {"email":"Paciente@example.com","senha":"Senha123!"}
                """))
            .andExpect(status().isOk()).andExpect(jsonPath("$.tipoToken").value("Bearer"))
            .andReturn().getResponse().getContentAsString();
        String token = json.readTree(response).get("token").asText();
        mvc.perform(get("/api/test/me").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.usuarioId").value("1"));
        mvc.perform(get("/api/test/fisio").header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden());
    }

    @Test
    void cadastroLoginFisioterapeuta() throws Exception {
        mvc.perform(post("/api/v1/auth/fisioterapeutas").contentType("application/json")
            .content("""
                {"nome":"Fisio Teste","email":"fisio@example.com","senha":"Senha123!",
                 "crefitoNumero":"12345","crefitoUf":"sp","cidade":"Barueri","uf":"sp"}
                """))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.perfil").value("FISIO"));
        verify(fisioterapeutas).save(argThat(f -> "SP".equals(f.crefitoUf) && !f.crefitoVerificado));
        String response = mvc.perform(post("/api/v1/auth/login").contentType("application/json")
            .content("""
                {"email":"fisio@example.com","senha":"Senha123!"}
                """))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        mvc.perform(get("/api/test/fisio").header("Authorization", "Bearer " + json.readTree(response).get("token").asText()))
            .andExpect(status().isOk());
    }

    @Test
    void emailDuplicado() throws Exception {
        paciente();
        mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json")
            .content("""
                {"nome":"Outro","email":"paciente@example.com","senha":"Senha123!"}
                """))
            .andExpect(status().isConflict());
        verify(usuarios, times(1)).save(any(Usuario.class));
    }

    @Test
    void senhaErradaEContaInativa() throws Exception {
        paciente();
        mvc.perform(post("/api/v1/auth/login").contentType("application/json")
            .content("""
                {"email":"paciente@example.com","senha":"errada"}
                """))
            .andExpect(status().isUnauthorized());
        contas.get("paciente@example.com").ativo = false;
        mvc.perform(post("/api/v1/auth/login").contentType("application/json")
            .content("""
                {"email":"paciente@example.com","senha":"Senha123!"}
                """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void preflightAceitaAsDuasOrigensLocais() throws Exception {
        for (String origin : new String[] { "http://localhost:5173", "http://127.0.0.1:5173" }) {
            mvc.perform(options("/api/v1/auth/login").header("Origin", origin)
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", origin));
        }
    }

    @Test
    void senhaAcimaDoLimiteBcryptRetornaErroControlado() throws Exception {
        for (String senha : new String[] { "a".repeat(73), "\u00e9".repeat(37) }) {
            mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json")
                .content(json.writeValueAsString(Map.of("nome", "Teste", "email", "teste@example.com", "senha", senha))))
                .andExpect(status().isBadRequest());
            mvc.perform(post("/api/v1/auth/login").contentType("application/json")
                .content(json.writeValueAsString(Map.of("email", "teste@example.com", "senha", senha))))
                .andExpect(status().isUnauthorized());
        }
        verify(usuarios, never()).save(any(Usuario.class));
    }

    @Test
    void cadastroInvalidoETokenInvalido() throws Exception {
        mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json")
            .content("""
                {"nome":"Teste","email":"invalido","senha":"curta"}
                """))
            .andExpect(status().isBadRequest());
        verify(usuarios, never()).save(any(Usuario.class));
        mvc.perform(get("/api/test/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/test/me").header("Authorization", "Bearer invalido"))
            .andExpect(status().isUnauthorized());
    }
}
