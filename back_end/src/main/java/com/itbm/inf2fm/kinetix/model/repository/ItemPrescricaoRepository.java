package com.itbm.inf2fm.kinetix.model.repository;
import com.itbm.inf2fm.kinetix.model.entity.ItemPrescricao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
public interface ItemPrescricaoRepository extends JpaRepository<ItemPrescricao, Long> {
    @EntityGraph(attributePaths = "exercicio")
    List<ItemPrescricao> findByPlano_IdOrderByOrdem(Long planoId);
}
