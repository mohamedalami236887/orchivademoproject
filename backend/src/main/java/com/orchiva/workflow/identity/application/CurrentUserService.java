package com.orchiva.workflow.identity.application;

import com.orchiva.workflow.common.error.ResourceNotFoundException;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.identity.repository.UserAccountRepository;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private final UserAccountRepository users;

    public CurrentUserService(UserAccountRepository users) {
        this.users = users;
    }

    public UserAccount requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("Authentication is required.");
        }
        return users.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated account no longer exists."));
    }

    public boolean hasRole(RoleName role) {
        return requireCurrentUser().getRoles().stream().anyMatch(value -> value.getName() == role);
    }

    public UUID id() {
        return requireCurrentUser().getId();
    }
}
