package com.bank.admin;

import com.bank.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminCustomerIntegrationTest extends AbstractIntegrationTest {

    @Test
    void adminCreatesCustomerProfileAndFundedIndianBankAccount() throws Exception {
        String admin = adminToken();
        String request = """
                {
                  "email":"new.customer@example.com",
                  "password":"Customer123!",
                  "firstName":"Demo",
                  "lastName":"Customer",
                  "dateOfBirth":"1995-05-10",
                  "phone":"9000000001",
                  "addressLine1":"10 Demo Road",
                  "city":"Chennai",
                  "country":"India",
                  "bankName":"IOB",
                  "accountType":"SAVINGS",
                  "openingDeposit":12500
                }
                """;

        mvc.perform(post("/api/v1/admin/users").header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email", is("new.customer@example.com")))
                .andExpect(jsonPath("$.firstName", is("Demo")))
                .andExpect(jsonPath("$.phone", is("9000000001")));

        String customer = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"new.customer@example.com\",\"password\":\"Customer123!\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String customerToken = mapper.readTree(customer).get("accessToken").asText();

        mvc.perform(get("/api/v1/accounts").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bankName", is("IOB")))
                .andExpect(jsonPath("$[0].currency", is("INR")))
                .andExpect(jsonPath("$[0].balance", is(12500.0)));
    }
}
