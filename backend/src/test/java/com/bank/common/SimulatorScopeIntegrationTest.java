package com.bank.common;

import com.bank.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SimulatorScopeIntegrationTest extends AbstractIntegrationTest {

    @Test
    void loanAndPaymentGatewayRoutesAreNotExposed() throws Exception {
        String token = register("scope-check@example.com");
        String authorization = "Bearer " + token;

        mvc.perform(get("/api/v1/loans").header("Authorization", authorization))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/admin/loans").header("Authorization", authorization))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/admin/users/" + meId(token) + "/kyc")
                        .header("Authorization", authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"VERIFIED\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/payments/top-up")
                        .header("Authorization", authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/payments/webhook")
                        .header("Authorization", authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void cardIssuanceCreatesOnlyFictionalVisualMetadata() throws Exception {
        String token = register("demo-card@example.com");
        String accountId = openAccount(token).get("id").asText();

        mvc.perform(post("/api/v1/cards")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountId\":\"" + accountId + "\",\"monthlyLimit\":250}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.card.brand").value("SIMULATED"))
                .andExpect(jsonPath("$.card.last4").value("DEMO"))
                .andExpect(jsonPath("$.cardNumber").doesNotExist());
    }
}
