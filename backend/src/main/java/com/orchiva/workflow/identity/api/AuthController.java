package com.orchiva.workflow.identity.api;

import com.orchiva.workflow.common.error.ResourceNotFoundException;
import com.orchiva.workflow.audit.application.AuditService;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.identity.repository.UserAccountRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final UserAccountRepository users;
    private final AuditService audit;

    public AuthController(AuthenticationManager authenticationManager,
                          SecurityContextRepository contextRepository,
                          UserAccountRepository users, AuditService audit) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.users = users;
        this.audit = audit;
    }

    @GetMapping("/csrf")
    CsrfResponse csrf(CsrfToken csrfToken) {
        return new CsrfResponse(csrfToken.getHeaderName(), csrfToken.getToken());
    }

    @PostMapping("/login")
    AuthenticatedUser login(@Valid @RequestBody LoginRequest login,
                            HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(login.username(), login.password()));
        } catch (AuthenticationException exception) {
            audit.record(null, "LOGIN_FAILED", "USER", null, java.util.Map.of("username", login.username()));
            throw exception;
        }
        request.getSession(true);
        request.changeSessionId();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        users.findByUsernameIgnoreCase(authentication.getName())
                .ifPresent(user -> audit.record(user, "LOGIN_SUCCEEDED", "USER", user.getId(), java.util.Map.of()));
        return current(authentication);
    }

    @GetMapping("/me")
    AuthenticatedUser me(Authentication authentication) {
        return current(authentication);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            users.findByUsernameIgnoreCase(authentication.getName())
                    .ifPresent(user -> audit.record(user, "LOGOUT", "USER", user.getId(), java.util.Map.of()));
        }
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    private AuthenticatedUser current(Authentication authentication) {
        UserAccount account = users.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated account no longer exists."));
        return AuthenticatedUser.from(account);
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    public record CsrfResponse(String headerName, String token) {}
    public record AuthenticatedUser(UUID id, String username, String email, String displayName,
                                    UUID departmentId, String departmentName, List<String> roles) {
        static AuthenticatedUser from(UserAccount account) {
            return new AuthenticatedUser(account.getId(), account.getUsername(), account.getEmail(),
                    account.getFirstName() + " " + account.getLastName(),
                    account.getDepartment() == null ? null : account.getDepartment().getId(),
                    account.getDepartment() == null ? null : account.getDepartment().getName(),
                    account.getRoles().stream().map(role -> role.getName().name()).sorted().toList());
        }
    }
}
