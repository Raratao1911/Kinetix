package com.itbm.inf2fm.kinetix.controller;

import com.itbm.inf2fm.kinetix.dto.ApiDtos.*;
import com.itbm.inf2fm.kinetix.model.entity.DisponibilidadeSemanal;
import com.itbm.inf2fm.kinetix.service.ConsultaService;
import com.itbm.inf2fm.kinetix.service.ProfissionalService;
import com.itbm.inf2fm.kinetix.service.AdminService;
import com.itbm.inf2fm.kinetix.service.ClinicalService;
import com.itbm.inf2fm.kinetix.service.PacienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/fisioterapeuta")
@PreAuthorize("hasRole('FISIO')")
public class FisioterapeutaController {
    private final ProfissionalService profissionais;
    private final ConsultaService consultas;
    private final AdminService admin;
    private final PacienteService pacientes;
    private final ClinicalService clinical;
    public FisioterapeutaController(ProfissionalService profissionais, ConsultaService consultas, AdminService admin,
        PacienteService pacientes, ClinicalService clinical) {
        this.profissionais = profissionais; this.consultas = consultas; this.admin = admin;
        this.pacientes = pacientes; this.clinical = clinical;
    }

    @GetMapping("/perfil")
    public ProfissionalResumo meuPerfil(@AuthenticationPrincipal Jwt jwt) {
        return profissionais.meuPerfilResumo(id(jwt));
    }

    @PutMapping("/perfil")
    public ProfissionalResumo atualizarPerfil(@AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody PerfilFisioRequest request) {
        return profissionais.atualizarPerfil(id(jwt), request);
    }

    @PutMapping("/especialidades")
    public ProfissionalResumo especialidades(@AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody EspecialidadesPerfilRequest request) {
        return profissionais.atualizarEspecialidades(id(jwt), request);
    }

    @DeleteMapping("/disponibilidades/{disponibilidadeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerDisponibilidade(@AuthenticationPrincipal Jwt jwt, @PathVariable Long disponibilidadeId) {
        profissionais.removerDisponibilidade(id(jwt), disponibilidadeId);
    }

    @PostMapping("/servicos")
    @ResponseStatus(HttpStatus.CREATED)
    public ServicoResumo criarServico(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ServicoRequest request) {
        return profissionais.criarServico(id(jwt), request);
    }

    @GetMapping("/servicos")
    public List<ServicoResumo> meusServicos(@AuthenticationPrincipal Jwt jwt) {
        return profissionais.meusServicos(id(jwt));
    }

    @PutMapping("/servicos/{servicoId}")
    public ServicoResumo atualizarServico(@AuthenticationPrincipal Jwt jwt, @PathVariable Long servicoId,
        @Valid @RequestBody ServicoRequest request) {
        return profissionais.atualizarServico(id(jwt), servicoId, request);
    }

    @DeleteMapping("/servicos/{servicoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativarServico(@AuthenticationPrincipal Jwt jwt, @PathVariable Long servicoId) {
        profissionais.desativarServico(id(jwt), servicoId);
    }

    @PostMapping("/disponibilidades")
    @ResponseStatus(HttpStatus.CREATED)
    public void adicionarDisponibilidade(@AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody DisponibilidadeRequest request) {
        profissionais.adicionarDisponibilidade(id(jwt), request);
    }

    @GetMapping("/disponibilidades")
    public List<DisponibilidadeResumo> disponibilidades(@AuthenticationPrincipal Jwt jwt) {
        return profissionais.minhasDisponibilidades(id(jwt)).stream()
            .map(d -> new DisponibilidadeResumo(d.id, d.diaSemana, d.horaInicio, d.horaFim, d.vigenciaInicio, d.vigenciaFim)).toList();
    }

    @GetMapping("/pacientes")
    public List<PacientePerfilResumo> pacientesVinculados(@AuthenticationPrincipal Jwt jwt) {
        return pacientes.vinculadosAoFisioterapeuta(id(jwt));
    }

    @GetMapping("/exercicios")
    public List<ExercicioResumo> exercicios() {
        return clinical.exerciciosAtivos();
    }

    @PostMapping("/exercicios")
    @ResponseStatus(HttpStatus.CREATED)
    public ExercicioResumo criarExercicio(@Valid @RequestBody ExercicioRequest request) {
        return clinical.criarExercicio(request);
    }

    @PostMapping("/bloqueios")
    @ResponseStatus(HttpStatus.CREATED)
    public void bloquearAgenda(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody BloqueioRequest request) {
        consultas.bloquearAgenda(id(jwt), request);
    }

    @PostMapping("/consultas/{consultaId}/confirmar")
    public ConsultaResumo confirmar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long consultaId) {
        return consultas.confirmar(consultaId, id(jwt));
    }

    @PostMapping("/assinaturas")
    @ResponseStatus(HttpStatus.CREATED)
    public AssinaturaResumo solicitarAssinatura(@AuthenticationPrincipal Jwt jwt, @RequestParam Long planoId) {
        return admin.solicitarAssinatura(id(jwt), planoId);
    }

    @GetMapping("/assinaturas")
    public List<AssinaturaResumo> minhasAssinaturas(@AuthenticationPrincipal Jwt jwt) {
        return admin.minhasAssinaturas(id(jwt));
    }

    @DeleteMapping("/assinaturas/{assinaturaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelarAssinatura(@AuthenticationPrincipal Jwt jwt, @PathVariable Long assinaturaId) {
        admin.cancelarMinhaAssinatura(id(jwt), assinaturaId);
    }

    private Long id(Jwt jwt) { return Long.valueOf(jwt.getSubject()); }
}
