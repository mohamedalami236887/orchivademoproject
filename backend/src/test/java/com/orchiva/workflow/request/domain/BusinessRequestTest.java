package com.orchiva.workflow.request.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.department.domain.Department;
import com.orchiva.workflow.identity.domain.UserAccount;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class BusinessRequestTest {
    @Test
    void supportsDraftSubmissionAndCancellation() {
        BusinessRequest request = request();
        Instant submitted = Instant.parse("2026-11-13T10:00:00Z");
        request.submit(submitted);
        assertThat(request.getStatus()).isEqualTo(RequestStatus.SUBMITTED);
        assertThat(request.getSubmittedAt()).isEqualTo(submitted);

        request.cancel(submitted.plusSeconds(30));
        assertThat(request.getStatus()).isEqualTo(RequestStatus.CANCELLED);
    }

    @Test
    void preventsEditingAfterSubmission() {
        BusinessRequest request = request();
        request.submit(Instant.now());
        assertThatThrownBy(() -> request.updateDraft(mock(RequestType.class), "Changed", "Changed"))
                .isInstanceOf(BusinessRuleException.class);
    }

    private BusinessRequest request() {
        return new BusinessRequest("REQ-2026-001001", mock(RequestType.class), "Purchase laptops",
                "Replace aging equipment", mock(UserAccount.class), mock(Department.class));
    }
}
