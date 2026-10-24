package com.bank.customer.domain;

/**
 * Optional demo identity-status metadata. It does not gate banking actions.
 */
public enum KycStatus {
    PENDING,
    VERIFIED,
    REJECTED
}
