package com.itbm.inf2fm.kinetix.config;

import com.itbm.inf2fm.kinetix.model.entity.*;
import com.itbm.inf2fm.kinetix.model.enums.PerfilUsuario;
import com.itbm.inf2fm.kinetix.model.repository.*;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.*;

@Configuration
@ConditionalOnProperty(name = "kinetix.demo.seed", havingValue = "true")
public class DemoDataConfig {
    @Bean
    ApplicationRunner criarFisioterapeutasDemo(Environment env, UsuarioRepository usuarios,
        FisioterapeutaRepository fisios, EspecialidadeRepository especialidades, ServicoRepository servicos,
        DisponibilidadeRepository agenda, PasswordEncoder encoder, TransactionTemplate tx) {
        return args -> {
            String senha = env.getProperty("KINETIX_DEMO_PASSWORD", "");
            if (senha.length() < 12 || senha.getBytes(StandardCharsets.UTF_8).length > 72)
                throw new IllegalStateException("Configure KINETIX_DEMO_PASSWORD com 12 a 72 bytes.");
            try (var reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("demo/fisioterapeutas.csv").getInputStream(), StandardCharsets.UTF_8))) {
                var linhas = reader.lines().toList();
                tx.executeWithoutResult(status -> {
                    int criados = 0;
                    var listaEspecialidades = especialidades.findByAtivaTrueOrderByNome();
                    for (String linha : linhas) {
                        String[] c = linha.split(";", -1);
                        if (usuarios.existsByEmailIgnoreCase(c[0])) continue;
                        Usuario u = new Usuario(); u.email = c[0]; u.nome = c[1];
                        u.perfil = PerfilUsuario.FISIO; u.senhaHash = encoder.encode(senha); u.demonstracao = true;
                        usuarios.save(u);
                        Fisioterapeuta f = new Fisioterapeuta(u);
                        f.uf = c[2]; f.cidade = c[3]; f.bairro = c[4];
                        f.crefitoUf = c[2]; f.crefitoNumero = c[5]; f.crefitoVerificado = false;
                        f.nomeClinica = "Clínica fictícia de demonstração";
                        f.apresentacao = "Perfil fictício para testes do KINETIX. Não representa um profissional real. Endereço, registro, serviços e horários são ilustrativos.";
                        f.logradouro = "Endereço fictício para testes"; f.numero = "0"; f.atendeOnline = true;
                        if (!listaEspecialidades.isEmpty()) f.especialidades.add(listaEspecialidades.get(criados % listaEspecialidades.size()));
                        fisios.save(f);
                        Servico s = new Servico(); s.fisioterapeuta = f; s.nome = "Sessão demonstrativa";
                        s.descricao = "Atendimento fictício para testar agendamentos, sem prestação de serviço real.";
                        s.duracaoMinutos = 50; s.preco = new BigDecimal("120.00"); servicos.save(s);
                        for (int dia = 1; dia <= 5; dia++) {
                            DisponibilidadeSemanal d = new DisponibilidadeSemanal(); d.fisioterapeuta = f;
                            d.diaSemana = dia; d.horaInicio = LocalTime.of(9, 0); d.horaFim = LocalTime.of(17, 0);
                            d.vigenciaInicio = LocalDate.now(ZoneId.of("America/Sao_Paulo")); agenda.save(d);
                        }
                        criados++;
                    }
                    org.slf4j.LoggerFactory.getLogger(DemoDataConfig.class).info("Perfis de demonstração criados: {}. Contas existentes preservadas.", criados);
                });
            }
        };
    }
}
