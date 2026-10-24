package com.bank.loan.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record LoanApplicationRequest(
        @NotNull UUID accountId,
        @NotNull @Positive @Digits(integer = 15, fraction = 2) BigDecimal principal,
        @DecimalMin("0.00") @DecimalMax("100.00") @Digits(integer = 3, fraction = 2)
        BigDecimal annualRatePercent,
        @Min(1) @Max(60) int termMonths
) {
}
