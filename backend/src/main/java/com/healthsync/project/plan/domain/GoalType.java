package com.healthsync.project.plan.domain;

/**
 * 목표 유형 : 감량(lean), 근성장(health)
 */
public enum GoalType {
    LEAN, HEALTH;

    public static GoalType from(String raw) {
        if (raw == null) throw new IllegalArgumentException("type is null");
        return GoalType.valueOf(raw.trim().toUpperCase());
    }
}

