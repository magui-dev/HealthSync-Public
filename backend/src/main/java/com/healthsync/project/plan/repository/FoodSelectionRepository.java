package com.healthsync.project.plan.repository;

import com.healthsync.project.plan.domain.FoodSelection;
import com.healthsync.project.plan.domain.MacroCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FoodSelectionRepository extends JpaRepository<FoodSelection, Long> {

    Optional<FoodSelection> findByGoalIdAndCategory(Long goalId, MacroCategory category);
    List<FoodSelection> findAllByGoalIdOrderByCategoryAsc(Long goalId);
}
