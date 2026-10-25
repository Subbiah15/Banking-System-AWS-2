package com.bank.common.event;

/** Canonical action names used across notifications and the audit log. */
public final class EventActions {

    private EventActions() {
    }

    public static final String USER_REGISTERED = "USER_REGISTERED";
    public static final String DEPOSIT = "DEPOSIT";
    public static final String WITHDRAWAL = "WITHDRAWAL";
    public static final String TRANSFER_SENT = "TRANSFER_SENT";
    public static final String TRANSFER_RECEIVED = "TRANSFER_RECEIVED";
    public static final String CARD_PAYMENT = "CARD_PAYMENT";
}
