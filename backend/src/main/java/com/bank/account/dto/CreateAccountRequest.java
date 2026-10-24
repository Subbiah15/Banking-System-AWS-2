package com.bank.account.dto;

import com.bank.account.domain.AccountType;
import com.bank.account.domain.BankName;
import jakarta.validation.constraints.NotNull;

public record CreateAccountRequest(
        @NotNull AccountType type,
        @NotNull BankName bankName,
        String currency
) {
}
