package com.healthsync.project.plan.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.util.Objects;

/**
 * @Embeddable -> 엔티티 내 포함되는 값 타입(별도 테이븙x)
 * DB에는 'weeks' int 컬럼1개로 저장
 */

@Embeddable
public class PlanDuration {

    /** jpa스팩상 기본생성자 protected 권장 */
    protected PlanDuration() {}

    @Column(name = "weeks", nullable = false)
    private int weeks;

    private PlanDuration(int weeks) {
        this.weeks = weeks;
    }

    public static PlanDuration of(int weeks) {
        if (!PlanDurationPreset.isAllowed(weeks)) {
            throw new IllegalArgumentException("목표 설정은 [2, 4, 6, 8, 10, 12, 14, 16] 주 이내로 선택해야합니다.");
        }
        return new PlanDuration(weeks);
    }

    public int value() {
        return weeks;
    }

    // 값타입의 동등성 정의
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PlanDuration that)) return false;
        return weeks == that.weeks;
    }
    @Override public int hashCode() { return Objects.hash(weeks); }

    @Override public String toString() { return weeks + "w"; }
}
