package com.itbm.inf2fm.kinetix.service;

import static java.util.Objects.requireNonNull;

import com.itbm.inf2fm.kinetix.dto.ApiDtos.*;
import com.itbm.inf2fm.kinetix.model.entity.*;
import com.itbm.inf2fm.kinetix.model.enums.PerfilUsuario;
import com.itbm.inf2fm.kinetix.model.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class PerfilService {
    public static final String VERSAO_TERMOS = "2026-10-15.2";
    private final UsuarioRepository usuarios;
    private final PacienteRepository pacientes;
    private final FisioterapeutaRepository fisioterapeutas;
    private final FotoPerfilRepository fotos;

    public PerfilService(UsuarioRepository usuarios, PacienteRepository pacientes,
        FisioterapeutaRepository fisioterapeutas, FotoPerfilRepository fotos) {
        this.usuarios = usuarios; this.pacientes = pacientes;
        this.fisioterapeutas = fisioterapeutas; this.fotos = fotos;
    }

    @Transactional(readOnly = true)
    public ConfiguracaoPerfilResumo meuPerfil(Long id) { return resumo(usuario(id)); }

    @Transactional(readOnly = true)
    public void exigirCompleto(Long id) {
        if (!meuPerfil(id).completo())
            throw ErroNegocio.conflito("Complete a configuração de perfil e o endereço antes de agendar uma consulta.");
    }

    @Transactional
    public ConfiguracaoPerfilResumo salvar(Long id, ConfiguracaoPerfilRequest request, MultipartFile arquivo) {
        Usuario usuario = usuario(id);
        if (arquivo != null && request.removerFoto())
            throw ErroNegocio.invalido("Escolha entre enviar ou remover a foto.");
        String telefone = limpar(request.telefoneAdicional());
        String pais = limpar(request.paisTelefoneAdicional());
        if (telefone != null && pais == null)
            throw ErroNegocio.invalido("Selecione o país do telefone adicional.");
        byte[] imagem = arquivo == null ? null : prepararFoto(arquivo);
        String cep = limpar(request.cep());
        if (cep != null) {
            String digitos = cep.replaceAll("\\D", "");
            if (digitos.length() != 8) throw ErroNegocio.invalido("Informe um CEP com 8 dígitos.");
            cep = digitos.substring(0, 5) + "-" + digitos.substring(5);
        }
        if (usuario.perfil == PerfilUsuario.PACIENTE) {
            Paciente paciente = paciente(id);
            paciente.cep = cep; paciente.logradouro = limpar(request.logradouro());
            paciente.numero = limpar(request.numero()); paciente.cidade = request.cidade().trim();
            paciente.bairro = limpar(request.bairro()); paciente.uf = request.uf().trim().toUpperCase();
        } else {
            Fisioterapeuta fisio = fisioterapeuta(id);
            fisio.cep = cep; fisio.logradouro = limpar(request.logradouro());
            fisio.numero = limpar(request.numero()); fisio.cidade = request.cidade().trim();
            fisio.bairro = limpar(request.bairro()); fisio.uf = request.uf().trim().toUpperCase();
        }
        usuario.telefoneAdicional = telefone;
        usuario.rg = limpar(request.rg());
        usuario.paisTelefoneAdicional = telefone == null ? null : pais;
        if (imagem != null) fotos.save(new FotoPerfil(id, imagem, "image/jpeg"));
        else if (request.removerFoto() && fotos.existsById(requireNonNull(id))) fotos.deleteById(requireNonNull(id));
        return resumo(usuario);
    }

    @Transactional(readOnly = true)
    public FotoPerfil foto(Long id) {
        usuario(id);
        return fotos.findById(requireNonNull(id)).orElseThrow(() -> ErroNegocio.naoEncontrado("Foto de perfil não encontrada."));
    }

    private Usuario usuario(Long id) {
        Usuario usuario = usuarios.findById(requireNonNull(id)).filter(u -> u.ativo)
            .orElseThrow(() -> ErroNegocio.naoEncontrado("Conta não encontrada."));
        if (usuario.perfil != PerfilUsuario.PACIENTE && usuario.perfil != PerfilUsuario.FISIO)
            throw ErroNegocio.proibido("Esta conta não possui um perfil de atendimento.");
        return usuario;
    }

    private Paciente paciente(Long id) {
        return pacientes.findById(requireNonNull(id)).orElseThrow(() -> ErroNegocio.naoEncontrado("Perfil de paciente não encontrado."));
    }

    private Fisioterapeuta fisioterapeuta(Long id) {
        return fisioterapeutas.findByUsuario_Id(id)
            .orElseThrow(() -> ErroNegocio.naoEncontrado("Perfil de fisioterapeuta não encontrado."));
    }

    private ConfiguracaoPerfilResumo resumo(Usuario usuario) {
        if (usuario.perfil == PerfilUsuario.PACIENTE) {
            Paciente p = paciente(usuario.id);
            return resumo(usuario, p.cep, p.logradouro, p.numero, p.cidade, p.bairro, p.uf);
        }
        Fisioterapeuta f = fisioterapeuta(usuario.id);
        return resumo(usuario, f.cep, f.logradouro, f.numero, f.cidade, f.bairro, f.uf);
    }

    private ConfiguracaoPerfilResumo resumo(Usuario u, String cep, String rua, String numero,
        String cidade, String bairro, String uf) {
        boolean completo = limpar(cep) != null && limpar(rua) != null && limpar(numero) != null
            && limpar(cidade) != null && limpar(bairro) != null && limpar(uf) != null;
        return new ConfiguracaoPerfilResumo(u.id, u.nome, u.email, u.perfil, u.telefone,
            u.telefoneAdicional, u.paisTelefoneAdicional, limpar(cep), rua, numero, cidade, bairro,
            limpar(uf), fotos.existsById(requireNonNull(u.id)), completo, u.rg, u.termosAceitosEm, u.termosVersao);
    }

    @Transactional
    public void aceitarTermos(Long id) {
        registrarAceite(usuario(id));
    }

    public static void registrarAceite(Usuario usuario) {
        usuario.termosAceitosEm = java.time.OffsetDateTime.now();
        usuario.termosVersao = VERSAO_TERMOS;
    }

    private String limpar(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private byte[] prepararFoto(MultipartFile arquivo) {
        if (arquivo.isEmpty() || arquivo.getSize() > 2 * 1024 * 1024)
            throw ErroNegocio.invalido("Envie uma foto de até 2 MB.");
        if (!"image/jpeg".equals(arquivo.getContentType()) && !"image/png".equals(arquivo.getContentType()))
            throw ErroNegocio.invalido("A foto deve ser JPEG ou PNG.");
        try (var stream = arquivo.getInputStream(); var input = ImageIO.createImageInputStream(stream)) {
            if (input == null) throw ErroNegocio.invalido("Arquivo de imagem inválido.");
            var leitores = ImageIO.getImageReaders(input);
            if (!leitores.hasNext()) throw ErroNegocio.invalido("Arquivo de imagem inválido.");
            ImageReader leitor = leitores.next();
            try {
                leitor.setInput(input, true, true);
                String formato = leitor.getFormatName();
                if (!"JPEG".equalsIgnoreCase(formato) && !"PNG".equalsIgnoreCase(formato))
                    throw ErroNegocio.invalido("A foto deve ser JPEG ou PNG.");
                int largura = leitor.getWidth(0), altura = leitor.getHeight(0);
                if (largura < 1 || altura < 1 || largura > 2048 || altura > 2048)
                    throw ErroNegocio.invalido("A foto enviada à API deve ter até 2048 pixels por lado.");
                BufferedImage original = leitor.read(0);
                double escala = Math.min(1.0, 512.0 / Math.max(largura, altura));
                BufferedImage imagem = new BufferedImage(Math.max(1, (int)(largura * escala)),
                    Math.max(1, (int)(altura * escala)), BufferedImage.TYPE_INT_RGB);
                var desenho = imagem.createGraphics();
                try {
                    desenho.setColor(Color.WHITE);
                    desenho.fillRect(0, 0, imagem.getWidth(), imagem.getHeight());
                    desenho.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                    desenho.drawImage(original, 0, 0, imagem.getWidth(), imagem.getHeight(), null);
                } finally { desenho.dispose(); }
                var output = new ByteArrayOutputStream();
                ImageIO.write(imagem, "jpeg", output);
                return output.toByteArray();
            } finally { leitor.dispose(); }
        } catch (IOException | IllegalArgumentException exception) {
            throw ErroNegocio.invalido("Não foi possível ler a foto. Escolha uma imagem JPEG ou PNG válida.");
        }
    }
}
