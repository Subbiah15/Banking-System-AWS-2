package com.bank.customer.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Fictional profile details for the current user. No identity-verification status is
 * collected, processed, or exposed by the simulator.
 */
public record ProfileResponse(
        UUID userId,
        String email,
        String role,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        String phone,
        String addressLine1,
        String city,
        String country
) {
}
