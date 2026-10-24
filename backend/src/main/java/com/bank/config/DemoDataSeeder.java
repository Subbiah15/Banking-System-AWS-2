package com.bank.config;

import com.bank.account.domain.Account;
import com.bank.account.domain.AccountType;
import com.bank.account.domain.BankName;
import com.bank.account.service.AccountService;
import com.bank.auth.domain.Role;
import com.bank.auth.domain.User;
import com.bank.auth.repo.UserRepository;
import com.bank.customer.domain.CustomerProfile;
import com.bank.customer.repo.CustomerProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Seeds fictional customers with funded INR accounts across the supported demo banks.
 * Enabled with app.seed.demo=true. Idempotent.
 */
@Component
@Order(20) // after AdminSeeder
@ConditionalOnProperty(name = "app.seed.demo", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String PASSWORD = "Demo123!";
    private static final List<DemoCustomer> CUSTOMERS = List.of(
            new DemoCustomer("Asha", "Sharma", "demo.sbi@bank.local", BankName.SBI, "25000.00"),
            new DemoCustomer("Rohan", "Kumar", "demo.iob@bank.local", BankName.IOB, "18450.00"),
            new DemoCustomer("Priya", "Patel", "demo.hdfc@bank.local", BankName.HDFC, "61200.00"),
            new DemoCustomer("Arjun", "Rao", "demo.icici@bank.local", BankName.ICICI, "38750.00"),
            new DemoCustomer("Meera", "Iyer", "demo.axis@bank.local", BankName.AXIS, "94300.00"));

    private final UserRepository userRepository;
    private final CustomerProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountService accountService;

    public DemoDataSeeder(UserRepository userRepository,
                          CustomerProfileRepository profileRepository,
                          PasswordEncoder passwordEncoder,
                          AccountService accountService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountService = accountService;
    }

    @Override
    public void run(String... args) {
        UUID adminUserId = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.ADMIN)
                .map(User::getId)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Demo admin must be seeded before demo customers"));
        for (DemoCustomer demo : CUSTOMERS) {
            User user = userRepository.findByEmail(demo.email()).orElseGet(() ->
                    userRepository.save(new User(demo.email(), passwordEncoder.encode(PASSWORD), Role.CUSTOMER)));
            if (profileRepository.findByUserId(user.getId()).isEmpty()) {
                CustomerProfile profile = new CustomerProfile(user.getId(), demo.firstName(), demo.lastName());
                profile.setDateOfBirth(LocalDate.of(1995, 1, 1));
                profile.setPhone("9000000000");
                profile.setAddressLine1("100 Demo Street");
                profile.setCity("Chennai");
                profile.setCountry("India");
                profileRepository.save(profile);
            }

            boolean accountExists = accountService.listAccounts(user.getId()).stream()
                    .anyMatch(account -> account.getCurrency().equals("INR")
                            && account.getBankName().equals(demo.bank().name()));
            if (!accountExists) {
                Account account = accountService.createAccount(user.getId(), AccountType.CHECKING,
                        "INR", demo.bank());
                accountService.tellerDeposit(adminUserId, account.getAccountNumber(),
                        new BigDecimal(demo.openingBalance()));
            }
        }
        log.info("Seeded {} fictional bank demo customers (shared demo password: {})",
                CUSTOMERS.size(), PASSWORD);
    }

    private record DemoCustomer(String firstName, String lastName, String email,
                                BankName bank, String openingBalance) {
    }
}
