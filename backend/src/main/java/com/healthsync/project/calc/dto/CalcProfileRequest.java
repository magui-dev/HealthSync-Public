package com.healthsync.project.calc.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CalcProfileRequest {

    private String name;
    private LocalDate birth;
    private Double height;
    private Double weight;
    private String gender;
    private int level;

}