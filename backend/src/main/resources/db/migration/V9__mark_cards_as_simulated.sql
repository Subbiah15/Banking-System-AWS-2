-- Existing cards are demo-only records, not payment-network credentials.
UPDATE cards
SET last4 = 'DEMO',
    brand = 'SIMULATED';
