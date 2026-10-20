package com.itbm.inf2fm.kinetix.model.repository;

import com.itbm.inf2fm.kinetix.model.entity.RedefinicaoSenha;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface RedefinicaoSenhaRepository extends JpaRepository<RedefinicaoSenha, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from RedefinicaoSenha r where r.tokenHash = :hash")
    Optional<RedefinicaoSenha> buscarPorToken(String hash);
}
