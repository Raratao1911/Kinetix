package com.itbm.inf2fm.kinetix.model.repository;
import com.itbm.inf2fm.kinetix.model.entity.Paciente;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    @EntityGraph(attributePaths = "usuario")
    @Query("select distinct p from Consulta c join c.paciente p where c.fisioterapeuta.usuario.id = :fisioId order by p.usuario.nome")
    List<Paciente> vinculadosAoFisioterapeuta(@Param("fisioId") Long fisioId);
}
