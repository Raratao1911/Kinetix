package com.itbm.inf2fm.kinetix.model.repository;
import com.itbm.inf2fm.kinetix.model.entity.Paciente;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    @Override
    @EntityGraph(attributePaths = "usuario")
    java.util.Optional<Paciente> findById(Long id);
    @EntityGraph(attributePaths = "usuario")
    @Query("select distinct p from Consulta c join c.paciente p where c.fisioterapeuta.usuario.id = :fisioId " +
        "and (c.reservaAtiva = true or c.status = com.itbm.inf2fm.kinetix.model.enums.StatusConsulta.REALIZADA " +
        "or c.status = com.itbm.inf2fm.kinetix.model.enums.StatusConsulta.FALTOU) order by p.usuario.nome")
    List<Paciente> vinculadosAoFisioterapeuta(@Param("fisioId") Long fisioId);
}
