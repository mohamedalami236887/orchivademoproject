package com.orchiva.workflow.workflow.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ApprovalTaskTest {
    @Test
    void commitsOnlyOneDecision() {
        WorkflowInstance instance = mock(WorkflowInstance.class);
        when(instance.getAttempt()).thenReturn(1);
        WorkflowStep step = mock(WorkflowStep.class);
        when(step.getApproverRole()).thenReturn(RoleName.MANAGER);
        ApprovalTask task = new ApprovalTask(instance, step);
        UserAccount actor = mock(UserAccount.class);

        task.decide(DecisionType.APPROVED, actor, Instant.parse("2026-11-13T10:00:00Z"));
        assertThat(task.getStatus()).isEqualTo(TaskStatus.APPROVED);
        assertThatThrownBy(() -> task.decide(DecisionType.REJECTED, actor, Instant.now()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already");
    }

    @Test
    void instanceRetainsItsVersionAndSupportsResubmissionAttempt() {
        WorkflowVersion version = mock(WorkflowVersion.class);
        WorkflowInstance instance = new WorkflowInstance(mock(com.orchiva.workflow.request.domain.BusinessRequest.class), version);
        instance.complete(WorkflowStatus.CHANGES_REQUESTED, Instant.now());
        instance.resume();
        assertThat(instance.getWorkflowVersion()).isSameAs(version);
        assertThat(instance.getAttempt()).isEqualTo(2);
        assertThat(instance.getStatus()).isEqualTo(WorkflowStatus.IN_PROGRESS);
    }
}
