package com.bank.customer.dto;

import com.bank.account.domain.AccountType;
import com.bank.account.domain.BankName;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateCustomerRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @Past LocalDate dateOfBirth,
        @Size(max = 30) String phone,
        @Size(max = 255) String addressLine1,
        @Size(max = 100) String city,
        @Size(max = 100) String country,
        @NotNull BankName bankName,
        @NotNull AccountType accountType,
        @DecimalMin("0.00") @Digits(integer = 15, fraction = 2) BigDecimal openingDeposit
) {
}
