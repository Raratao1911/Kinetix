package com.itbm.inf2fm.kinetix.controller;

import com.itbm.inf2fm.kinetix.service.RedefinicaoSenhaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class RedefinicaoSenhaController {
    private final RedefinicaoSenhaService service;
    public RedefinicaoSenhaController(RedefinicaoSenhaService service) { this.service = service; }
    public record Solicitar(@NotBlank @Email @Size(max=254) String email) {}
    public record Redefinir(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{43}") String token,
        @NotBlank @Size(min=8,max=72) String senha) {}
    @PostMapping("/esqueci-senha")
    public Map<String,String> solicitar(@Valid @RequestBody Solicitar request) {
        service.solicitar(request.email()); return Map.of("mensagem", RedefinicaoSenhaService.MENSAGEM);
    }
    @PostMapping("/redefinir-senha")
    public Map<String,String> redefinir(@Valid @RequestBody Redefinir request) {
        service.redefinir(request.token(), request.senha()); return Map.of("mensagem", "Senha redefinida. Entre com sua nova senha.");
    }
}
