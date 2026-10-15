package com.itbm.inf2fm.kinetix.controller;

import com.itbm.inf2fm.kinetix.dto.ApiDtos.*;
import com.itbm.inf2fm.kinetix.service.PerfilService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/perfil")
@PreAuthorize("hasAnyRole('PACIENTE','FISIO')")
public class PerfilController {
    private final PerfilService perfis;
    public PerfilController(PerfilService perfis) { this.perfis = perfis; }

    @GetMapping
    public ConfiguracaoPerfilResumo meuPerfil(@AuthenticationPrincipal Jwt jwt) {
        return perfis.meuPerfil(Long.valueOf(jwt.getSubject()));
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ConfiguracaoPerfilResumo salvar(@AuthenticationPrincipal Jwt jwt,
        @Valid @RequestPart("dados") ConfiguracaoPerfilRequest dados,
        @RequestPart(value="foto", required=false) MultipartFile foto) {
        return perfis.salvar(Long.valueOf(jwt.getSubject()), dados, foto);
    }

    @GetMapping("/foto")
    public ResponseEntity<byte[]> foto(@AuthenticationPrincipal Jwt jwt) {
        var foto = perfis.foto(Long.valueOf(jwt.getSubject()));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .header("X-Content-Type-Options", "nosniff")
            .contentType(MediaType.parseMediaType(foto.tipo)).body(foto.conteudo);
    }

    @PostMapping("/consentimento")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void consentir(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ConsentimentoRequest request) {
        perfis.aceitarTermos(Long.valueOf(jwt.getSubject()));
    }
}
