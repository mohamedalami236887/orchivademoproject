import { Role } from './auth.models';

export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export interface PageResponse<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number; }
export interface RequestType { id: string; code: string; name: string; description: string; }
export interface BusinessRequest { id:string; reference:string; requestTypeId:string; requestType:string; title:string; description:string; creatorId:string; creatorName:string; departmentId:string; departmentName:string; status:RequestStatus; version:number; createdAt:string; updatedAt:string; submittedAt:string|null; completedAt:string|null; }
export interface SaveRequest { requestTypeId:string; title:string; description:string; }
export interface StatusMetric { status:RequestStatus; count:number; }
export interface Dashboard { totalRequests:number; activeRequests:number; approvedRequests:number; pendingApprovals:number; unreadNotifications:number; recentRequests:BusinessRequest[]; statusBreakdown:StatusMetric[]; pendingPreview:ApprovalTask[]; }
export interface WorkflowSummary { name:string; version:number; status:string; currentStep:number; attempt:number; startedAt:string; completedAt:string|null; }
export interface WorkflowStepProgress { position:number; name:string; approverRole:Role; status:string; attempt:number; actor:string|null; createdAt:string|null; decidedAt:string|null; comments:string|null; }
export interface ApprovalHistoryItem { id:string; attempt:number; stepPosition:number; stepName:string; actor:string; decision:string; comments:string|null; decidedAt:string; }
export interface RequestActivity { id:string; action:string; actor:string; occurredAt:string; targetType:string; targetId:string|null; metadata:string; }
export interface RequestWorkspace { request:BusinessRequest; workflow:WorkflowSummary|null; steps:WorkflowStepProgress[]; approvals:ApprovalHistoryItem[]; activity:RequestActivity[]; }
export interface ApprovalTask { id:string; requestId:string; reference:string; requestTitle:string; requestType:string; requester:string; department:string; requestDescription:string; submittedAt:string|null; stepName:string; assigneeRole:Role; status:string; attempt:number; createdAt:string; decidedAt:string|null; }
export interface DocumentVersion { id:string; version:number; filename:string; contentType:string; size:number; sha256:string; uploadedBy:string; createdAt:string; }
export interface ManagedDocument { id:string; requestId:string; requestReference:string; title:string; latestVersion:number; createdAt:string; updatedAt:string; versions:DocumentVersion[]; }
export interface Department { id:string; code:string; name:string; active:boolean; managerId:string|null; }
export interface ManagedUser { id:string; username:string; email:string; firstName:string; lastName:string; enabled:boolean; departmentId:string|null; departmentName:string|null; roles:Role[]; }
export interface Workflow { id:string; name:string; requestTypeId:string; requestType:string; currentVersion:number; steps:{name:string; approverRole:Role}[]; }
export interface AuditEvent { id:string; occurredAt:string; actor:string; actorUsername:string; action:string; targetType:string; targetId:string; requestId:string|null; requestReference:string|null; metadata:string; }
export interface AppNotification { id:string; type:string; title:string; message:string; targetUrl:string|null; readAt:string|null; createdAt:string; }
export interface NotificationList { unread:number; items:AppNotification[]; }
