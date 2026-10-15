package com.itbm.inf2fm.kinetix.model.repository;
import com.itbm.inf2fm.kinetix.model.entity.PlanoExercicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
public interface PlanoExercicioRepository extends JpaRepository<PlanoExercicio, Long> {
    @EntityGraph(attributePaths = {"consulta", "paciente.usuario", "fisioterapeuta.usuario"})
    List<PlanoExercicio> findByPaciente_Usuario_IdAndAtivoTrueOrderByInicioDesc(Long pacienteId);
    @EntityGraph(attributePaths = {"consulta", "paciente.usuario", "fisioterapeuta.usuario"})
    java.util.Optional<PlanoExercicio> findByIdAndPaciente_Usuario_IdAndAtivoTrue(Long id, Long pacienteId);
    @EntityGraph(attributePaths = {"consulta", "paciente.usuario", "fisioterapeuta.usuario"})
    List<PlanoExercicio> findByPaciente_Usuario_IdAndFisioterapeuta_Usuario_IdOrderByInicioDesc(Long pacienteId, Long fisioId);
}
