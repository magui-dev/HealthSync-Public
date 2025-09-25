package com.healthsync.project.plan.service;

import com.healthsync.project.plan.domain.GoalType;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class PlanCalcService {

    private static final int KCAL_PER_G_CARB = 4;
    private static final int KCAL_PER_G_PROT = 4;
    private static final int KCAL_PER_G_FAT  = 9;

    public int calcDailyDelta(double startKg, double targetKg, int weeks) {
        if (weeks <= 0) return 0;
        double kgChange = targetKg - startKg;
        int days = weeks * 7;
        return (int) Math.round((kgChange * 7700) / days);
    }

    public Map<String,Integer> ratioFor(GoalType type) {
        Map<String,Integer> r = new HashMap<>();
        switch (type) {
            case LEAN -> { r.put("carb", 40); r.put("protein", 35); r.put("fat", 25); }
            case HEALTH -> { r.put("carb", 50); r.put("protein", 25); r.put("fat", 25); }
            default -> { r.put("carb", 50); r.put("protein", 30); r.put("fat", 20); }
        }
        return r;
    }

    public Map<String,Integer> macroGPerDay(int targetDaily, Map<String,Integer> ratio) {
        int carbG = Math.max(0, Math.round(targetDaily * (ratio.getOrDefault("carb", 0)     / 100f) / KCAL_PER_G_CARB));
        int protG = Math.max(0, Math.round(targetDaily * (ratio.getOrDefault("protein", 0)  / 100f) / KCAL_PER_G_PROT));
        int fatG  = Math.max(0, Math.round(targetDaily * (ratio.getOrDefault("fat", 0)      / 100f) / KCAL_PER_G_FAT));
        return Map.of("carb", carbG, "protein", protG, "fat", fatG);
    }

    public Map<String,Integer> macroGPerMeal(Map<String,Integer> perDay, int meals) {
        if (meals <= 0) meals = 3;
        int carb = Math.round(perDay.getOrDefault("carb", 0)    / (float) meals);
        int prot = Math.round(perDay.getOrDefault("protein", 0) / (float) meals);
        int fat  = Math.round(perDay.getOrDefault("fat", 0)     / (float) meals);
        return Map.of("carb", Math.max(0, carb), "protein", Math.max(0, prot), "fat", Math.max(0, fat));
    }

    public Integer perMeal(Integer targetDaily, int meals) {
        if (targetDaily == null) return null;
        if (meals <= 0) meals = 3;
        return Math.round(targetDaily / (float) meals);
    }

    public int clampByPlanLimit(GoalType type, int deltaRaw, Integer tdee) {
        if (type == null) return deltaRaw;
        int absMaxDeficit = -750; // LeanFit
        int absMaxSurplus =  400; // BalanceFit

        if (tdee != null && tdee > 0) {
            int pctDeficit = Math.round(-0.25f * tdee);
            int pctSurplus = Math.round( 0.15f * tdee);
            absMaxDeficit = Math.max(absMaxDeficit, pctDeficit);
            absMaxSurplus = Math.min(absMaxSurplus, pctSurplus);
        }
        return switch (type) {
            case LEAN   -> Math.max(deltaRaw, absMaxDeficit);
            case HEALTH -> Math.min(deltaRaw, absMaxSurplus);
            default     -> deltaRaw;
        };
    }

    public int applyFloor(int targetDaily, String sex /* "M"|"F"|null */) {
        int femaleFloor = 1200;
        int maleFloor   = 1500;
        int floor = (sex != null && sex.equalsIgnoreCase("M")) ? maleFloor : femaleFloor;
        return Math.max(targetDaily, floor);
    }

    public void collectWarnings(
            List<String> out, GoalType type,
            double startKg, double targetKg, int weeks, Integer tdee,
            int targetDailyAfterClamp
    ) {
        int days = Math.max(1, weeks * 7);
        if (days <= 30 && Math.abs(targetKg - startKg) >= 5.0) {
            out.add("기간이 너무 짧습니다. 안전 범위 내에서 다시 설정하세요. (30일 ±5kg 초과)");
        }
        if (weeks > 0 && startKg > 0) {
            double weeklyPct = Math.abs((targetKg - startKg) / weeks) / startKg;
            if (type == GoalType.LEAN && weeklyPct > 0.01) {
                out.add("LeanFit 권장 감량 속도(≤1%/주)를 초과합니다.");
            } else if (type == GoalType.HEALTH && weeklyPct > 0.005) {
                out.add("BalanceFit 권장 증량 속도(≤0.5%/주)를 초과합니다.");
            }
        }
        if (tdee == null) out.add("TDEE가 제공되지 않아 비율 한도(±% of TDEE)는 적용되지 않았습니다.");
        if (targetDailyAfterClamp < 1300) out.add("권장 섭취가 매우 낮습니다. 전문가와 상담을 권장합니다.");
    }

    // === TDEE (Mifflin–St Jeor × 활동계수) + TEF 10% ===
    public int calcTdee(String sex /*"M"|"F"*/, int age, int heightCm, int weightKg, int activityLevel) {
        double bmr;
        if ("M".equalsIgnoreCase(sex)) {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
        } else {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
        }
        double factor = switch (activityLevel) {
            case 1 -> 1.20;
            case 2 -> 1.375;
            case 3 -> 1.55;
            case 4 -> 1.725;
            default -> 1.20;
        };
        double tdee = bmr * factor;
        tdee = tdee * 1.10; // TEF 10%
        return (int) Math.round(tdee);
    }
}
