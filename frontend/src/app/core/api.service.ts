import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApprovalTask, AuditEvent, BusinessRequest, Dashboard, Department, ManagedDocument, ManagedUser, NotificationList, PageResponse, RequestStatus, RequestType, RequestWorkspace, SaveRequest, Workflow } from './api.models';
import { Role } from './auth.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  dashboard() { return this.http.get<Dashboard>('/api/dashboard'); }
  requestTypes() { return this.http.get<RequestType[]>('/api/requests/types'); }
  requests(filter: {query?:string; status?:RequestStatus|string; typeId?:string; page?:number; size?:number; sortBy?:string; direction?:'ASC'|'DESC'} = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => { if (value !== undefined && value !== '') params = params.set(key, value); });
    return this.http.get<PageResponse<BusinessRequest>>('/api/requests', { params });
  }
  request(id:string) { return this.http.get<BusinessRequest>(`/api/requests/${id}`); }
  requestWorkspace(id:string) { return this.http.get<RequestWorkspace>(`/api/requests/${id}/workspace`); }
  createRequest(value:SaveRequest) { return this.http.post<BusinessRequest>('/api/requests', value); }
  updateRequest(id:string,value:SaveRequest) { return this.http.put<BusinessRequest>(`/api/requests/${id}`, value); }
  submitRequest(id:string) { return this.http.post<BusinessRequest>(`/api/requests/${id}/submit`, {}); }
  cancelRequest(id:string) { return this.http.post<BusinessRequest>(`/api/requests/${id}/cancel`, {}); }
  approvals() { return this.http.get<ApprovalTask[]>('/api/approvals'); }
  decide(id:string, decision:'APPROVED'|'REJECTED'|'CHANGES_REQUESTED', comments:string) { return this.http.post<ApprovalTask>(`/api/approvals/${id}/decisions`, {decision,comments}); }
  documents(query='') { return this.http.get<ManagedDocument[]>('/api/documents', {params:{query}}); }
  requestDocuments(id:string) { return this.http.get<ManagedDocument[]>(`/api/requests/${id}/documents`); }
  uploadDocument(requestId:string,title:string,file:File) { const data=new FormData(); data.append('title',title); data.append('file',file); return this.http.post<ManagedDocument>(`/api/requests/${requestId}/documents`,data); }
  addDocumentVersion(id:string,file:File) { const data=new FormData(); data.append('file',file); return this.http.post<ManagedDocument>(`/api/documents/${id}/versions`,data); }
  users() { return this.http.get<ManagedUser[]>('/api/users'); }
  createUser(value:{username:string;email:string;password:string;firstName:string;lastName:string;departmentId:string|null;roles:Role[]}) { return this.http.post<ManagedUser>('/api/users',value); }
  updateUser(id:string,value:{email:string;firstName:string;lastName:string;departmentId:string|null;enabled:boolean;roles:Role[]}) { return this.http.put<ManagedUser>(`/api/users/${id}`,value); }
  departments() { return this.http.get<Department[]>('/api/departments'); }
  createDepartment(value:Omit<Department,'id'>) { return this.http.post<Department>('/api/departments',value); }
  updateDepartment(id:string,value:Omit<Department,'id'>) { return this.http.put<Department>(`/api/departments/${id}`,value); }
  workflows() { return this.http.get<Workflow[]>('/api/workflows'); }
  publishWorkflow(value:{requestTypeId:string;name:string;steps:{name:string;approverRole:Role}[]}) { return this.http.post<Workflow>('/api/workflows/publish',value); }
  audit(page=0,query='',action='') { return this.http.get<PageResponse<AuditEvent>>('/api/admin/audit-events',{params:{page,size:25,query,action}}); }
  notifications() { return this.http.get<NotificationList>('/api/notifications'); }
  readNotification(id:string) { return this.http.post(`/api/notifications/${id}/read`,{}); }
  readAllNotifications() { return this.http.post<{updated:number}>('/api/notifications/read-all',{}); }
}
