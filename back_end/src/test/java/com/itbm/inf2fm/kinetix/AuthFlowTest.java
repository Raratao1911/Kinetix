package com.itbm.inf2fm.kinetix;

import tools.jackson.databind.json.JsonMapper;
import com.itbm.inf2fm.kinetix.config.SegurancaConfig;
import com.itbm.inf2fm.kinetix.controller.ApiExceptionHandler;
import com.itbm.inf2fm.kinetix.controller.AuthController;
import com.itbm.inf2fm.kinetix.controller.AdminController;
import com.itbm.inf2fm.kinetix.service.AdminService;
import com.itbm.inf2fm.kinetix.service.ProfissionalService;
import com.itbm.inf2fm.kinetix.service.ConsultaService;
import com.itbm.inf2fm.kinetix.model.entity.Usuario;
import com.itbm.inf2fm.kinetix.model.repository.*;
import com.itbm.inf2fm.kinetix.service.AuthService;
import com.itbm.inf2fm.kinetix.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration;
import org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
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
// Mockito matchers use null placeholders; Jackson results are checked by the HTTP assertions.
@SuppressWarnings("null")
class AuthFlowTest {
    @SpringBootConfiguration
    @EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class, FlywayAutoConfiguration.class})
    @Import({SegurancaConfig.class, AuthController.class, ApiExceptionHandler.class,
        AuthService.class, JwtService.class, Probe.class, AdminController.class})
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
    @Autowired JsonMapper json;
    @Autowired PasswordEncoder encoder;
    @MockitoBean UsuarioRepository usuarios;
    @MockitoBean PacienteRepository pacientes;
    @MockitoBean FisioterapeutaRepository fisioterapeutas;
    @MockitoBean EspecialidadeRepository especialidades;
    @MockitoBean AdminService admin;
    @MockitoBean ProfissionalService profissionais;
    @MockitoBean ConsultaService consultas;
    @Autowired JwtService jwtService;
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

    @Test
    void rotasAdministrativasExigemPerfilAdmin() throws Exception {
        String tokenPaciente = json.readTree(paciente()).get("token").asString();
        for (String rota : new String[] { "fisioterapeutas", "avaliacoes", "assinaturas", "consultas" }) {
            mvc.perform(get("/api/v1/admin/" + rota)).andExpect(status().isUnauthorized());
            mvc.perform(get("/api/v1/admin/" + rota).header("Authorization", "Bearer " + tokenPaciente))
                .andExpect(status().isForbidden());
        }
        verifyNoInteractions(admin);
        Usuario conta = new Usuario(); conta.id = 99L; conta.nome = "Admin teste"; conta.email = "admin@example.com";
        conta.perfil = com.itbm.inf2fm.kinetix.model.enums.PerfilUsuario.ADMIN;
        String tokenAdmin = jwtService.emitir(conta).token();
        when(admin.profissionais()).thenReturn(java.util.List.of());
        mvc.perform(get("/api/v1/admin/fisioterapeutas").header("Authorization", "Bearer " + tokenAdmin))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    private String paciente() throws Exception {
        return mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json")
            .content("""
                {"nome":"Paciente Teste","email":"PACIENTE@example.com","senha":"Senha123!","uf":"sp",
                 "telefone":"+5511999999999","dataNascimento":"2000-01-01","cidade":"Barueri","documentoIdentidade":"529.982.247-25","aceiteTermos":true}
                """))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.perfil").value("PACIENTE"))
            .andReturn().getResponse().getContentAsString();
    }

    @Test
    void cadastroLoginETokenPaciente() throws Exception {
        paciente();
        assertThat(encoder.matches("Senha123!", contas.get("paciente@example.com").senhaHash)).isTrue();
        assertThat(contas.get("paciente@example.com").documentoIdentidade).isEqualTo("52998224725");
        assertThat(contas.get("paciente@example.com").termosAceitosEm).isNotNull();
        verify(pacientes).save(argThat(p -> "SP".equals(p.uf)));
        String response = mvc.perform(post("/api/v1/auth/login").contentType("application/json")
            .content("""
                {"email":"Paciente@example.com","senha":"Senha123!"}
                """))
            .andExpect(status().isOk()).andExpect(jsonPath("$.tipoToken").value("Bearer"))
            .andReturn().getResponse().getContentAsString();
        String token = json.readTree(response).get("token").asString();
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
                 "crefitoNumero":"12345","crefitoUf":"sp","cidade":"Barueri","uf":"sp","documentoIdentidade":"52998224725","aceiteTermos":true}
                """))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.perfil").value("FISIO"));
        verify(fisioterapeutas).save(argThat(f -> "SP".equals(f.crefitoUf) && !f.crefitoVerificado));
        String response = mvc.perform(post("/api/v1/auth/login").contentType("application/json")
            .content("""
                {"email":"fisio@example.com","senha":"Senha123!"}
                """))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        mvc.perform(get("/api/test/fisio").header("Authorization", "Bearer " + json.readTree(response).get("token").asString()))
            .andExpect(status().isOk());
    }

    @Test
    void emailDuplicado() throws Exception {
        paciente();
        mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json")
            .content("""
                {"nome":"Outro","email":"paciente@example.com","senha":"Senha123!","uf":"SP",
                 "telefone":"+5511999999999","dataNascimento":"2000-01-01","cidade":"Barueri","documentoIdentidade":"52998224725","aceiteTermos":true}
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
                .content(json.writeValueAsString(Map.of("nome", "Teste", "email", "teste@example.com", "senha", senha,
                    "documentoIdentidade", "52998224725", "telefone", "+5511999999999", "cidade", "Barueri", "uf", "SP", "dataNascimento", "2000-01-01", "aceiteTermos", true))))
                .andExpect(status().isBadRequest());
            mvc.perform(post("/api/v1/auth/login").contentType("application/json")
                .content(json.writeValueAsString(Map.of("email", "teste@example.com", "senha", senha))))
                .andExpect(status().isUnauthorized());
        }
        verify(usuarios, never()).save(any(Usuario.class));
    }

    @Test
    void cadastroExigeDadosEValidaNascimento() throws Exception {
        Map<String, Object> payload = new java.util.HashMap<>(Map.of("nome", "Teste", "email", "teste@example.com",
            "senha", "Senha123!", "telefone", "+5511999999999", "cidade", "Barueri", "uf", "SP", "dataNascimento", "2000-01-01", "documentoIdentidade", "52998224725", "aceiteTermos", true));
        for (String field : new String[] { "telefone", "cidade", "uf", "dataNascimento", "documentoIdentidade", "aceiteTermos" }) {
            Map<String, Object> invalid = new java.util.HashMap<>(payload);
            invalid.remove(field);
            mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json").content(json.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
        }
        for (String date : new String[] { "1899-12-31", "2017-01-01" }) {
            payload.put("dataNascimento", date);
            mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json").content(json.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
        }
        for (String date : new String[] { "1900-01-01", "2016-12-31" }) {
            payload.put("dataNascimento", date);
            payload.put("email", date + "@example.com");
            mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json").content(json.writeValueAsString(payload)))
                .andExpect(status().isCreated());
        }
    }

    @Test
    void cpfComDigitosInvalidosNaoCriaConta() throws Exception {
        for (String cpf : new String[] { "11111111111", "00000000000", "52998224724", "123", "abc" }) {
            var payload = Map.of("nome", "Teste", "email", "teste@example.com", "senha", "Senha123!",
                "telefone", "+5511999999999", "cidade", "Barueri", "uf", "SP", "dataNascimento", "2000-01-01", "documentoIdentidade", cpf, "aceiteTermos", true);
            mvc.perform(post("/api/v1/auth/pacientes").contentType("application/json").content(json.writeValueAsString(payload)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("CPF")));
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
