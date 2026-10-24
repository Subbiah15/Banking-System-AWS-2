ALTER TABLE accounts
    ADD COLUMN bank_name VARCHAR(40) NOT NULL DEFAULT 'SBI';

ALTER TABLE accounts
    ALTER COLUMN currency SET DEFAULT 'INR';

UPDATE accounts SET bank_name = 'SYSTEM' WHERE type = 'SYSTEM';

ALTER TABLE accounts
    ADD CONSTRAINT accounts_bank_name_check
    CHECK (bank_name IN ('SBI', 'IOB', 'HDFC', 'ICICI', 'AXIS', 'SYSTEM'));

INSERT INTO accounts (account_number, owner_user_id, type, currency, bank_name, status)
VALUES ('SYS-SETTLEMENT-INR', NULL, 'SYSTEM', 'INR', 'SYSTEM', 'ACTIVE')
ON CONFLICT (account_number) DO NOTHING;
