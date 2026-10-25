package com.bank.account;

import com.bank.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AccountLedgerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void tellerDepositAndWithdrawAdjustBalance() throws Exception {
        String token = register("acct1@example.com");
        JsonNode account = openAccount(token);
        String accountId = account.get("id").asText();
        String number = account.get("accountNumber").asText();

        tellerDeposit(number, "100.00");

        mvc.perform(post("/api/v1/accounts/" + accountId + "/withdraw")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":30.00}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/accounts/" + accountId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance", is(70.00)));

        String txns = mvc.perform(get("/api/v1/accounts/" + accountId + "/transactions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode arr = mapper.readTree(txns);
        assertThat(arr).hasSize(2);
        assertThat(arr.get(0).get("type").asText()).isEqualTo("WITHDRAWAL");
        assertThat(arr.get(0).get("balanceAfter").asDouble()).isEqualTo(70.00);
        assertThat(arr.get(1).get("type").asText()).isEqualTo("DEPOSIT");
        assertThat(arr.get(1).get("balanceAfter").asDouble()).isEqualTo(100.00);
    }

    @Test
    void customerCanAddSimulatedFundsToOwnAccount() throws Exception {
        String token = register("self.deposit@example.com");
        JsonNode account = openAccount(token);
        String accountId = account.get("id").asText();

        mvc.perform(post("/api/v1/accounts/" + accountId + "/deposit")
                        .header("Authorization", "Bearer " + token)
                        .header("Idempotency-Key", "self-deposit-" + accountId)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":100.00}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance", is(100.00)));

        String txns = mvc.perform(get("/api/v1/accounts/" + accountId + "/transactions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode entries = mapper.readTree(txns);
        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).get("type").asText()).isEqualTo("DEPOSIT");
        assertThat(entries.get(0).get("direction").asText()).isEqualTo("CREDIT");
    }

    @Test
    void repeatedDepositRequestWithSameIdempotencyKeyPostsOnlyOnce() throws Exception {
        String token = register("self.deposit.retry@example.com");
        String accountId = openAccount(token).get("id").asText();
        String key = "deposit-retry-" + accountId;

        for (int attempt = 0; attempt < 2; attempt++) {
            mvc.perform(post("/api/v1/accounts/" + accountId + "/deposit")
                            .header("Authorization", "Bearer " + token)
                            .header("Idempotency-Key", key)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":100.00}"))
                    .andExpect(status().isOk());
        }

        mvc.perform(get("/api/v1/accounts/" + accountId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance", is(100.00)));
        String txns = mvc.perform(get("/api/v1/accounts/" + accountId + "/transactions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(mapper.readTree(txns)).hasSize(1);
    }

    @Test
    void withdrawBeyondBalanceIsRejected() throws Exception {
        String token = register("acct2@example.com");
        String accountId = openAccount(token).get("id").asText();

        mvc.perform(post("/api/v1/accounts/" + accountId + "/withdraw")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":50.00}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void everyTransactionBalancesToZero() throws Exception {
        String token = register("acct3@example.com");
        JsonNode account = openAccount(token);
        tellerDeposit(account.get("accountNumber").asText(), "250.50");
        mvc.perform(post("/api/v1/accounts/" + account.get("id").asText() + "/withdraw")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":100.25}"))
                .andExpect(status().isOk());

        List<java.math.BigDecimal> sums = jdbc.query(
                "select sum(case when direction = 'CREDIT' then amount else -amount end) as s "
                        + "from ledger_entries group by transaction_id",
                (rs, n) -> rs.getBigDecimal("s"));
        assertThat(sums).isNotEmpty();
        assertThat(sums).allSatisfy(s -> assertThat(s.signum()).isZero());
    }

    @Test
    void cannotAccessAnotherUsersAccount() throws Exception {
        String alice = register("alice.acct@example.com");
        String accountId = openAccount(alice).get("id").asText();
        String bob = register("bob.acct@example.com");

        mvc.perform(get("/api/v1/accounts/" + accountId).header("Authorization", "Bearer " + bob))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/accounts/" + accountId + "/withdraw")
                        .header("Authorization", "Bearer " + bob)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":10.00}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/accounts/" + accountId + "/deposit")
                        .header("Authorization", "Bearer " + bob)
                        .header("Idempotency-Key", "unauthorized-deposit-" + accountId)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":10.00}"))
                .andExpect(status().isNotFound());
    }
}
