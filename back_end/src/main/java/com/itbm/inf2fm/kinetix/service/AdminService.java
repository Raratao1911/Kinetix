package com.itbm.inf2fm.kinetix.service;

import com.itbm.inf2fm.kinetix.dto.ApiDtos.*;
import com.itbm.inf2fm.kinetix.model.entity.*;
import com.itbm.inf2fm.kinetix.model.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class AdminService {
    private final EspecialidadeRepository especialidades;
    private final ExercicioRepository exercicios;
    private final PlanoAssinaturaRepository planos;
    private final AssinaturaRepository assinaturas;
    private final FisioterapeutaRepository fisioterapeutas;
    private final AvaliacaoRepository avaliacoes;

    public AdminService(EspecialidadeRepository especialidades, ExercicioRepository exercicios,
        PlanoAssinaturaRepository planos, AssinaturaRepository assinaturas, FisioterapeutaRepository fisioterapeutas,
        AvaliacaoRepository avaliacoes) {
        this.especialidades=especialidades; this.exercicios=exercicios; this.planos=planos;
        this.assinaturas=assinaturas; this.fisioterapeutas=fisioterapeutas;
        this.avaliacoes=avaliacoes;
    }

    @Transactional
    public EspecialidadeResumo criarEspecialidade(EspecialidadeRequest request) {
        if (especialidades.existsByNomeIgnoreCase(request.nome().trim()))
            throw ErroNegocio.conflito("Já existe uma especialidade com este nome.");
        Especialidade item = new Especialidade(); item.nome=request.nome().trim(); item.descricao=request.descricao();
        especialidades.save(item);
        return new EspecialidadeResumo(item.id,item.nome,item.descricao);
    }

    @Transactional
    public Long criarExercicio(ExercicioRequest request) {
        Exercicio item=new Exercicio(); item.nome=request.nome().trim(); item.descricao=request.descricao();
        item.videoUrl=request.videoUrl(); return exercicios.save(item).id;
    }

    @Transactional
    public Long criarPlano(PlanoAssinaturaRequest request) {
        if (request.precoMensal()==null || request.precoMensal().signum()<0)
            throw ErroNegocio.invalido("Informe um preço mensal não negativo.");
        PlanoAssinatura plano=new PlanoAssinatura(); plano.nome=request.nome().trim();
        plano.descricao=request.descricao(); plano.precoMensal=request.precoMensal();
        return planos.save(plano).id;
    }

    @Transactional
    public AssinaturaResumo solicitarAssinatura(Long usuarioId, Long planoId) {
        Fisioterapeuta fisio=fisioterapeutas.bloquearPorUsuarioId(usuarioId)
            .orElseThrow(()->ErroNegocio.proibido("Somente fisioterapeutas podem solicitar uma assinatura."));
        PlanoAssinatura plano=planos.findById(planoId).filter(p->p.ativo)
            .orElseThrow(()->ErroNegocio.naoEncontrado("Plano ativo não encontrado."));
        if (assinaturas.findByFisioterapeuta_Usuario_IdOrderByInicioDesc(usuarioId).stream()
            .anyMatch(a -> "PENDENTE".equals(a.status) || "ATIVA".equals(a.status)))
            throw ErroNegocio.conflito("Voce ja possui uma assinatura ativa ou pendente. Cancele-a antes de escolher outro plano.");
        Assinatura assinatura=new Assinatura(); assinatura.fisioterapeuta=fisio;
        assinatura.plano=plano; assinatura.inicio=LocalDate.now(); assinatura.status="PENDENTE";
        assinaturas.save(assinatura);
        return resumir(assinatura);
    }

    @Transactional(readOnly=true)
    public List<AssinaturaResumo> minhasAssinaturas(Long usuarioId) {
        return assinaturas.findByFisioterapeuta_Usuario_IdOrderByInicioDesc(usuarioId).stream().map(this::resumir).toList();
    }

    private AssinaturaResumo resumir(Assinatura a) {
        return new AssinaturaResumo(a.id,a.plano.id,a.plano.nome,a.status,a.inicio,a.fim);
    }

    @Transactional(readOnly=true)
    public List<ProfissionalAdminResumo> profissionais() {
        return fisioterapeutas.findAllByOrderByUsuario_NomeAsc().stream().map(f ->
            new ProfissionalAdminResumo(f.usuario.id, f.usuario.nome, f.usuario.email,
                f.crefitoNumero, f.crefitoUf, f.crefitoVerificado)).toList();
    }

    @Transactional(readOnly=true)
    public List<AvaliacaoAdminResumo> avaliacoes() {
        return avaliacoes.findAllByOrderByCriadoEmDesc().stream().map(a ->
            new AvaliacaoAdminResumo(a.id, a.consulta.id, a.fisioterapeuta.usuario.nome,
                a.nota, a.comentario, a.status)).toList();
    }

    @Transactional(readOnly=true)
    public List<AssinaturaAdminResumo> assinaturas() {
        return assinaturas.findAllByOrderByInicioDesc().stream().map(a ->
            new AssinaturaAdminResumo(a.id, a.fisioterapeuta.usuario.nome, a.plano.nome,
                a.status, a.inicio, a.fim)).toList();
    }

    @Transactional
    public void atualizarAssinatura(Long id, String status) {
        Long profissionalId = assinaturas.profissionalDaAssinatura(id)
            .orElseThrow(() -> ErroNegocio.naoEncontrado("Assinatura nao encontrada."));
        fisioterapeutas.bloquearPorUsuarioId(profissionalId).orElseThrow();
        Assinatura a = assinaturas.findById(id)
            .orElseThrow(() -> ErroNegocio.naoEncontrado("Assinatura nao encontrada."));
        if (!"PENDENTE".equals(a.status) && !"ATIVA".equals(a.status))
            throw ErroNegocio.conflito("Esta assinatura ja foi encerrada.");
        if ("ATIVA".equals(status) && !a.plano.ativo)
            throw ErroNegocio.conflito("O plano nao esta disponivel.");
        a.status = status;
        if ("CANCELADA".equals(status)) a.fim = LocalDate.now();
    }

    @Transactional
    public void cancelarMinhaAssinatura(Long usuarioId, Long id) {
        fisioterapeutas.bloquearPorUsuarioId(usuarioId).orElseThrow();
        Assinatura a = assinaturas.findByFisioterapeuta_Usuario_IdOrderByInicioDesc(usuarioId).stream()
            .filter(item -> item.id.equals(id)).findFirst()
            .orElseThrow(() -> ErroNegocio.naoEncontrado("Assinatura nao encontrada para esta conta."));
        if (!"ATIVA".equals(a.status) && !"PENDENTE".equals(a.status))
            throw ErroNegocio.conflito("Esta assinatura ja foi encerrada.");
        a.status = "CANCELADA"; a.fim = LocalDate.now();
    }
}
