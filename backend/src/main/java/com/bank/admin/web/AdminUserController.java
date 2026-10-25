package com.bank.admin.web;

import com.bank.customer.dto.CreateCustomerRequest;
import com.bank.customer.dto.ProfileResponse;
import com.bank.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "Admin", description = "Customer and demo profile management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final CustomerService customerService;

    public AdminUserController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    @Operation(summary = "List all customer profiles")
    public List<ProfileResponse> listUsers() {
        return customerService.listAllProfiles();
    }

    @PostMapping
    @Operation(summary = "Create a customer profile and bank account")
    public ResponseEntity<ProfileResponse> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.createCustomer(request));
    }

}
