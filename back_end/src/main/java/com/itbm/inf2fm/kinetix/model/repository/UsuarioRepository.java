package com.itbm.inf2fm.kinetix.model.repository;
import com.itbm.inf2fm.kinetix.model.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmailIgnoreCase(String email);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from Usuario u where lower(u.email) = lower(:email)")
    Optional<Usuario> buscarParaRedefinicao(String email);
    @org.springframework.data.jpa.repository.Query("select u.versaoSenha from Usuario u where u.id = :id and u.ativo = true")
    Optional<Integer> versaoSenha(Long id);
    boolean existsByEmailIgnoreCase(String email);
}
