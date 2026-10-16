package com.itbm.inf2fm.kinetix.controller;

import com.itbm.inf2fm.kinetix.dto.ApiDtos.ErroResumo;
import com.itbm.inf2fm.kinetix.service.ErroNegocio;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErroResumo> fotoMuitoGrande() {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).body(new ErroResumo(OffsetDateTime.now(),
            413, "Arquivo muito grande", "A foto enviada deve ter até 2 MB após o redimensionamento."));
    }
    @ExceptionHandler(ErroNegocio.class)
    public ResponseEntity<ErroResumo> negocio(ErroNegocio ex) {
        HttpStatus status = ex.getStatus();
        return ResponseEntity.status(status).body(new ErroResumo(OffsetDateTime.now(), status.value(),
            status.getReasonPhrase(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResumo> validacao(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst().map(e -> ("documentoIdentidade".equals(e.getField()) ? "CPF" : e.getField())
                + ": " + e.getDefaultMessage()).orElse("Confira os dados enviados.");
        return ResponseEntity.badRequest().body(new ErroResumo(OffsetDateTime.now(), 400, "Requisição inválida", message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResumo> integridade(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErroResumo(OffsetDateTime.now(), 409,
            "Conflito de dados", "O registro viola uma regra de integridade do banco."));
    }
}
