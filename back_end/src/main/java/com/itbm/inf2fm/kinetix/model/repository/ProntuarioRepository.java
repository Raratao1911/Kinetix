package com.itbm.inf2fm.kinetix.model.repository;
import com.itbm.inf2fm.kinetix.model.entity.Prontuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;
public interface ProntuarioRepository extends JpaRepository<Prontuario, Long> {
    Optional<Prontuario> findByConsulta_Id(Long consultaId);
    @EntityGraph(attributePaths = {"consulta", "paciente.usuario", "fisioterapeuta.usuario"})
    List<Prontuario> findByPaciente_Usuario_IdOrderByCriadoEmDesc(Long pacienteId);
    @EntityGraph(attributePaths = {"consulta", "paciente.usuario", "fisioterapeuta.usuario"})
    List<Prontuario> findByPaciente_Usuario_IdAndFisioterapeuta_Usuario_IdOrderByCriadoEmDesc(Long pacienteId, Long fisioId);
}
