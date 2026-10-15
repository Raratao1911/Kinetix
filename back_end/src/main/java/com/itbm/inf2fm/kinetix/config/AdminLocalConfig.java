package com.itbm.inf2fm.kinetix.config;

import com.itbm.inf2fm.kinetix.model.entity.Usuario;
import com.itbm.inf2fm.kinetix.model.enums.PerfilUsuario;
import com.itbm.inf2fm.kinetix.model.repository.UsuarioRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminLocalConfig {
    @Bean
    ApplicationRunner criarAdministradorLocal(Environment env, UsuarioRepository usuarios, PasswordEncoder encoder) {
        return args -> {
            String email = env.getProperty("KINETIX_ADMIN_EMAIL", "").trim().toLowerCase(java.util.Locale.ROOT);
            String senha = env.getProperty("KINETIX_ADMIN_PASSWORD", "");
            if (email.isEmpty() && senha.isEmpty()) return;
            if (!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") || senha.length() < 12
                || senha.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
                throw new IllegalStateException("Configure um email valido e uma senha administrativa de 12 a 72 bytes.");
            var existente = usuarios.findByEmailIgnoreCase(email);
            if (existente.isPresent()) {
                if (existente.get().perfil != PerfilUsuario.ADMIN)
                    throw new IllegalStateException("O email administrativo ja pertence a uma conta nao administrativa.");
                return;
            }
            Usuario admin = new Usuario();
            admin.nome = "Administrador Kinetix"; admin.email = email;
            admin.senhaHash = encoder.encode(senha); admin.perfil = PerfilUsuario.ADMIN;
            usuarios.save(admin);
        };
    }
}
