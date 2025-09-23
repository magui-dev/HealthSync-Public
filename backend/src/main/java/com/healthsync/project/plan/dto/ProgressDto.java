package com.healthsync.project.plan.dto;

import java.util.List;

public record ProgressDto(List<Point> forecast, List<Point> actual, double percent) {
    public record Point(int week, double weight) {

    }
}
