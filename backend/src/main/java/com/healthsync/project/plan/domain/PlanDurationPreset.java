package com.healthsync.project.plan.domain;


/**
 * 목표기간 프리셋 (ui 라벨/정책용)
 *  -db는 Int(weekds)aks wjwkd , 프리셋은 검증/라벨 용도 사용
 */
public enum PlanDurationPreset {
    W2(2), W4(4), W6(6), W8(8), W10(10), W12(12), W14(14), W16(16);

    private final int weeks;

    PlanDurationPreset(int weeks) {
        this.weeks = weeks;
    }

    public int weeks() {
        return weeks;
    }

    /**
     *  허용된 주차인지 검증
     */
    public static boolean isAllowed(int w) {
        for (var p : values())
            if (p.weeks == w) {
                return true;
            }
        return false;
    }

}
