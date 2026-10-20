package com.itbm.inf2fm.kinetix.model.repository;
import com.itbm.inf2fm.kinetix.model.entity.Assinatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;
public interface AssinaturaRepository extends JpaRepository<Assinatura,Long> {
    @Override
    @EntityGraph(attributePaths = {"plano", "fisioterapeuta.usuario"})
    Optional<Assinatura> findById(Long id);
    @org.springframework.data.jpa.repository.Query("select a.fisioterapeuta.usuario.id from Assinatura a where a.id = :id")
    java.util.Optional<Long> profissionalDaAssinatura(@org.springframework.data.repository.query.Param("id") Long id);
    @EntityGraph(attributePaths = "plano")
    List<Assinatura> findByFisioterapeuta_Usuario_IdOrderByInicioDesc(Long id);
    @EntityGraph(attributePaths = {"plano", "fisioterapeuta.usuario"})
    List<Assinatura> findAllByOrderByInicioDesc();
}
