import { DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BusinessRequest, Dashboard, ManagedDocument, PageResponse, RequestStatus, RequestType, RequestWorkspace } from '../../core/api.models';
import { AuthService } from '../../core/auth.service';
import { IconComponent } from '../../shared/icon.component';
import { StatusLabelPipe } from '../../shared/status-label.pipe';

@Component({
  selector: 'app-request-list-v2',
  imports: [FormsModule, RouterLink, DatePipe, StatusLabelPipe, IconComponent],
  template: `
    <section class="requests-workspace" [class.inspector-closed]="!selectedId()">
      <div class="breadcrumb"><span>Workspace</span><app-icon name="expand"/><strong>Requests</strong></div>
      <header class="workspace-heading">
        <div><h1>Requests</h1><p>Find a record, inspect its progress, and move directly to the full workspace.</p></div>
        <a class="button primary new-request" routerLink="/requests/new"><app-icon name="plus"/> New request</a>
      </header>

      <nav class="record-views" aria-label="Request status views">
        <button type="button" [class.active]="status===''" [attr.aria-current]="status===''?'page':null" (click)="setStatus('')">All requests @if(statusCount('')){<span>{{statusCount('')}}</span>}</button>
        <button type="button" [class.active]="status==='IN_REVIEW'" [attr.aria-current]="status==='IN_REVIEW'?'page':null" (click)="setStatus('IN_REVIEW')">In review @if(statusCount('IN_REVIEW')){<span>{{statusCount('IN_REVIEW')}}</span>}</button>
        <button type="button" [class.active]="status==='CHANGES_REQUESTED'" [attr.aria-current]="status==='CHANGES_REQUESTED'?'page':null" (click)="setStatus('CHANGES_REQUESTED')">Needs action @if(statusCount('CHANGES_REQUESTED')){<span>{{statusCount('CHANGES_REQUESTED')}}</span>}</button>
        <button type="button" [class.active]="status==='APPROVED'" [attr.aria-current]="status==='APPROVED'?'page':null" (click)="setStatus('APPROVED')">Approved @if(statusCount('APPROVED')){<span>{{statusCount('APPROVED')}}</span>}</button>
        <button type="button" [class.active]="status==='REJECTED'" [attr.aria-current]="status==='REJECTED'?'page':null" (click)="setStatus('REJECTED')">Rejected @if(statusCount('REJECTED')){<span>{{statusCount('REJECTED')}}</span>}</button>
      </nav>

      <div class="records-layout">
        <aside class="discovery" aria-label="Request filters">
          <div class="discovery-heading"><div><app-icon name="filter"/><strong>Filters</strong></div><button type="button" (click)="clear()" [disabled]="!hasFilters()">Clear all</button></div>
          <form class="discovery-form" (ngSubmit)="load(0)">
            <label class="search-field"><span class="sr-only">Search requests</span><app-icon name="search"/><input id="request-search" name="query" [ngModel]="query" (ngModelChange)="searchChanged($event)" placeholder="Search in requests…" autocomplete="off"></label>
            <fieldset class="status-filters"><legend>Status</legend>
              @for(value of filterStatuses;track value){<label><input type="radio" name="filterStatus" [checked]="status===value" (change)="setStatus(value)"><span>{{value|statusLabel}}</span>@if(statusCount(value)){<small>{{statusCount(value)}}</small>}</label>}
              <label><input type="radio" name="filterStatus" [checked]="status===''" (change)="setStatus('')"><span>Any status</span></label>
            </fieldset>
            <label class="select-field"><span>Type</span><select name="typeId" [(ngModel)]="typeId" (change)="load(0)"><option value="">All types</option>@for(type of types();track type.id){<option [value]="type.id">{{type.name}}</option>}</select></label>
            @if(hasFilters()){<button class="reset-filters" type="button" (click)="clear()">Reset filters</button>}
          </form>
        </aside>

        <section class="records-main" aria-label="Request records">
          <div class="records-toolbar"><strong>{{result()?.totalElements ?? 0}} requests</strong><div class="toolbar-actions"><label><span class="sr-only">Sort requests</span><select name="sort" [(ngModel)]="sort" (change)="load(0)"><option value="updatedAt,DESC">Latest activity</option><option value="createdAt,DESC">Newest created</option><option value="reference,ASC">Reference A–Z</option><option value="title,ASC">Title A–Z</option></select></label><button class="icon-control" type="button" aria-label="Refresh requests" [disabled]="loading()" (click)="load(result()?.page ?? 0)"><app-icon name="refresh"/></button></div></div>
          @if(hasFilters()){<div class="active-filters" aria-label="Active filters">@if(query.trim()){<button type="button" (click)="query='';load(0)">Search: {{query}} ×</button>}@if(status){<button type="button" (click)="status='';load(0)">{{status|statusLabel}} ×</button>}@if(typeId){<button type="button" (click)="typeId='';load(0)">{{typeName()}} ×</button>}</div>}
          @if(error()){<div class="records-error" role="alert"><strong>Requests could not be loaded.</strong><span>{{error()}}</span><button class="button" type="button" (click)="load(result()?.page ?? 0)">Retry</button></div>}
          @if(loading()){<div class="record-skeleton" role="status" aria-label="Loading requests">@for(i of [1,2,3,4,5,6,7];track i){<div class="skeleton"></div>}</div>}
          @else if(result();as page){
            @if(page.content.length){
              <div class="desktop-records"><table class="data-table"><thead><tr><th scope="col">Reference</th><th scope="col">Title</th><th scope="col">Type</th><th scope="col">Owner</th><th scope="col">Status</th><th scope="col">Last activity</th><th scope="col"><span class="sr-only">Inspect</span></th></tr></thead><tbody>@for(item of page.content;track item.id){<tr [class.selected]="selectedId()===item.id" tabindex="0" [attr.aria-label]="'Inspect '+item.reference+', '+item.title" (click)="preview(item)" (keydown.enter)="preview(item)" (keydown.space)="preview(item);$event.preventDefault()"><td class="record-ref">{{item.reference}}</td><td class="record-title" [title]="item.title">{{item.title}}</td><td><span class="type-pill"><app-icon name="requests"/>{{item.requestType}}</span></td><td><span class="owner-cell"><i>{{initials(item.creatorName)}}</i><span [title]="item.creatorName">{{item.creatorName}}</span></span></td><td><span [class]="statusClass(item.status)" [title]="item.status|statusLabel">{{compactStatusLabel(item.status)}}</span></td><td><time>{{item.updatedAt|date:'MMM d, y'}}<small>{{item.updatedAt|date:'HH:mm'}}</small></time></td><td><button class="row-action" type="button" [attr.aria-label]="'Inspect '+item.reference" (click)="preview(item);$event.stopPropagation()"><app-icon name="expand"/></button></td></tr>}</tbody></table></div>
              <div class="mobile-records">@for(item of page.content;track item.id){<button type="button" [class.selected]="selectedId()===item.id" (click)="preview(item)"><span class="mobile-record-head"><strong>{{item.reference}}</strong><span [class]="statusClass(item.status)">{{item.status|statusLabel}}</span></span><span class="mobile-title">{{item.title}}</span><span class="mobile-details">{{item.requestType}} · {{item.creatorName}} · {{item.updatedAt|date:'mediumDate'}}</span></button>}</div>
            } @else {<div class="empty"><strong>No requests match these filters</strong><p>Try another search or clear the filters.</p><button class="button" type="button" (click)="clear()">Clear filters</button></div>}
            <nav class="pagination" aria-label="Request pages"><label>Rows per page <select [ngModel]="pageSize" (ngModelChange)="setPageSize($event)" name="pageSize"><option [ngValue]="10">10</option><option [ngValue]="20">20</option><option [ngValue]="50">50</option></select></label><span>@if(page.totalElements){ {{page.page*page.size+1}}–{{endRecord(page)}} of {{page.totalElements}} }@else{ 0 records }</span><div><button type="button" class="page-button" aria-label="Previous page" [disabled]="page.page===0" (click)="load(page.page-1)">‹</button><span class="current-page">{{page.page+1}}</span><span class="page-total">/ {{page.totalPages||1}}</span><button type="button" class="page-button" aria-label="Next page" [disabled]="page.page+1>=page.totalPages" (click)="load(page.page+1)">›</button></div></nav>
          }
        </section>

        @if(selectedId()){<div class="preview-scrim" (click)="closePreview()"></div>
        <aside class="preview-drawer" [attr.role]="isCompact()?'dialog':'region'" [attr.aria-modal]="isCompact()?'true':null" aria-label="Selected request inspector" (keydown.tab)="trapFocus($event)">
          <header class="preview-header"><span class="preview-icon"><app-icon name="requests"/></span><div class="preview-heading"><span class="preview-reference" tabindex="-1" #drawerTitle>{{selectedSummary()?.reference}}</span><h2>{{selectedSummary()?.title}}</h2><span [class]="statusClass(selectedSummary()?.status ?? 'DRAFT')">{{selectedSummary()?.status|statusLabel}}</span></div><button type="button" class="close-preview" aria-label="Close request inspector" (click)="closePreview()"><app-icon name="close"/></button></header>
          <nav class="inspector-tabs" aria-label="Inspector sections"><button type="button" [class.active]="activeTab()==='overview'" [attr.aria-current]="activeTab()==='overview'?'page':null" (click)="activeTab.set('overview')">Overview</button><button type="button" [class.active]="activeTab()==='workflow'" [attr.aria-current]="activeTab()==='workflow'?'page':null" (click)="activeTab.set('workflow')">Workflow & approvals</button><button type="button" [class.active]="activeTab()==='documents'" [attr.aria-current]="activeTab()==='documents'?'page':null" (click)="activeTab.set('documents')">Documents @if(!documentsLoading()){<span>{{documents().length}}</span>}</button></nav>
          @if(previewLoading()){<div class="preview-state" role="status">Loading request context…</div>}
          @else if(previewError()){<div class="preview-state"><p role="alert">{{previewError()}}</p><button class="button" type="button" (click)="retryPreview()">Retry inspector</button></div>}
          @else if(previewData();as view){<div class="preview-body">
            @if(activeTab()==='overview'){
              <dl class="preview-meta"><div><dt>Type</dt><dd><app-icon name="requests"/>{{view.request.requestType}}</dd></div><div><dt>Owner</dt><dd><span class="mini-avatar">{{initials(view.request.creatorName)}}</span>{{view.request.creatorName}}</dd></div><div><dt>Department</dt><dd><app-icon name="departments"/>{{view.request.departmentName}}</dd></div><div><dt>Created</dt><dd><app-icon name="clock"/>{{view.request.createdAt|date:'mediumDate'}}</dd></div><div><dt>Submitted</dt><dd>{{view.request.submittedAt?(view.request.submittedAt|date:'mediumDate'):'Not submitted'}}</dd></div><div><dt>Last activity</dt><dd>{{view.request.updatedAt|date:'medium'}}</dd></div></dl>
              <section><h3>Description</h3><p class="narrative">{{view.request.description||'No description provided.'}}</p></section>
              @if(view.workflow){<section class="workflow-summary" aria-label="Approval workflow progress"><div class="workflow-summary-heading"><div><span class="section-kicker">Approval workflow</span><h3>{{view.workflow.name}}</h3></div><span [class]="statusClass(view.request.status)">{{view.request.status|statusLabel}}</span></div><p class="workflow-progress-label">{{approvedStages(view)}} of {{view.steps.length}} stages approved@if(workflowFocus(view)){ · {{workflowFocus(view)}}}</p><div class="workflow-progress-track" role="progressbar" [attr.aria-valuenow]="approvedStages(view)" [attr.aria-valuemin]="0" [attr.aria-valuemax]="view.steps.length" [attr.aria-label]="'Approved stages for '+view.workflow.name"><span [style.width.%]="view.steps.length?approvedStages(view)/view.steps.length*100:0"></span></div>@if(view.steps.length){<ol class="summary-stages">@for(step of view.steps;track step.position){<li [class]="stepTone(step.status)"><span class="stage-marker"><app-icon [name]="stepIcon(step.status)"/></span><span class="stage-copy"><strong>{{step.name}}</strong><small>{{step.actor||roleName(step.approverRole)}} · {{stepLabel(step.status)}}</small></span></li>}</ol>}<p class="workflow-version">Version {{view.workflow.version}} · Attempt {{view.workflow.attempt}}</p></section>}
            }
            @if(activeTab()==='workflow'){
              <section class="workflow-detail"><span class="section-kicker">Approval timeline</span><h3>{{view.workflow?.name||'Approval route'}}</h3>@if(view.workflow){<p class="workflow-version">Version {{view.workflow.version}} · Attempt {{view.workflow.attempt}}</p>}@if(view.steps.length){<ol class="preview-steps">@for(step of view.steps;track step.position){<li [class]="stepTone(step.status)"><span class="timeline-marker"><app-icon [name]="stepIcon(step.status)"/></span><div class="timeline-content"><div class="timeline-top"><strong>{{step.name}}</strong><span>{{stepLabel(step.status)}}</span></div><p>{{step.actor||roleName(step.approverRole)}}@if(step.decidedAt){ · {{step.decidedAt|date:'medium'}}}</p>@if(step.comments){<blockquote>{{step.comments}}</blockquote>}</div></li>}</ol>}@else{<p>The approval route begins after submission.</p>}</section>
              <section class="decision-history"><h3>Decision history</h3>@if(view.approvals.length){<details><summary>Show {{view.approvals.length}} recorded {{view.approvals.length===1?'decision':'decisions'}}</summary><ol>@for(decision of view.approvals;track decision.id){<li><strong>{{decision.stepName}} · {{decision.decision|statusLabel}}</strong><span>{{decision.actor}} · {{decision.decidedAt|date:'medium'}} · Attempt {{decision.attempt}}</span>@if(decision.comments){<p>{{decision.comments}}</p>}</li>}</ol></details>}@else{<p>No decisions recorded yet.</p>}</section>
            }
            @if(activeTab()==='documents'){
              <section><h3>Supporting documents</h3>@if(documentsLoading()){<p role="status">Loading documents…</p>}@else if(documentsError()){<p role="alert">{{documentsError()}}</p><button class="button" type="button" (click)="loadDocuments(view.request.id)">Retry documents</button>}@else if(documents().length){<ul class="document-list">@for(doc of documents();track doc.id){<li><app-icon name="documents"/><span><strong>{{doc.title}}</strong><small>{{doc.versions[0]?.filename}} · version {{doc.latestVersion}}</small></span><a [href]="contentUrl(doc)" [attr.aria-label]="'Download '+doc.title"><app-icon name="download"/></a></li>}</ul>}@else{<p>No documents attached to this request.</p>}</section>
            }
          </div>}
          <footer class="inspector-footer"><a class="button" [routerLink]="['/requests',selectedId()]" (click)="closePreview(false)">View full request <app-icon name="arrow-right"/></a>@if(previewData();as view){@if(canEdit(view.request)){<a class="button" [routerLink]="['/requests',view.request.id,'edit']" (click)="closePreview(false)">Edit draft</a>}}</footer>
        </aside>}
      </div>
    </section>
  `,
  styleUrl: './request-list-v2.component.scss'
})
export class RequestListV2Component {
  private readonly api=inject(ApiService);
  private readonly route=inject(ActivatedRoute);
  private readonly auth=inject(AuthService);
  readonly result=signal<PageResponse<BusinessRequest>|null>(null);
  readonly types=signal<RequestType[]>([]);
  readonly dashboard=signal<Dashboard|null>(null);
  readonly loading=signal(false);
  readonly error=signal('');
  readonly selectedId=signal<string|null>(null);
  readonly selectedSummary=signal<BusinessRequest|null>(null);
  readonly previewData=signal<RequestWorkspace|null>(null);
  readonly previewLoading=signal(false);
  readonly previewError=signal('');
  readonly documents=signal<ManagedDocument[]>([]);
  readonly documentsLoading=signal(false);
  readonly documentsError=signal('');
  readonly activeTab=signal<'overview'|'workflow'|'documents'>('overview');
  readonly isCompact=signal(false);
  @ViewChild('drawerTitle') drawerTitle?:ElementRef<HTMLElement>;
  private priorFocus:HTMLElement|null=null;
  private requestGeneration=0;
  private listGeneration=0;
  private documentGeneration=0;
  private searchTimer:ReturnType<typeof setTimeout>|null=null;
  readonly filterStatuses:RequestStatus[]=['DRAFT','SUBMITTED','IN_REVIEW','CHANGES_REQUESTED','APPROVED','REJECTED','CANCELLED'];
  query='';status:RequestStatus|''='';typeId='';sort='updatedAt,DESC';pageSize=10;
  constructor(){
    const fromLink=this.route.snapshot.queryParamMap.get('status');
    if(fromLink&&this.filterStatuses.includes(fromLink as RequestStatus))this.status=fromLink as RequestStatus;
    if(typeof window!=='undefined')this.isCompact.set(window.innerWidth<1240);
    this.api.requestTypes().subscribe({next:types=>this.types.set(types),error:()=>this.error.set('Request types could not be loaded.')});
    this.api.dashboard().subscribe({next:data=>this.dashboard.set(data),error:()=>{}});
    this.load(0);
  }
  @HostListener('window:resize') resize(){if(typeof window!=='undefined')this.isCompact.set(window.innerWidth<1240)}
  @HostListener('document:keydown.escape') escape(){if(this.selectedId())this.closePreview()}
  statusClass(value:string){return 'status '+value.toLowerCase().replaceAll('_','-')}
  compactStatusLabel(value:RequestStatus){return value==='CHANGES_REQUESTED'?'Needs changes':value.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
  approvedStages(view:RequestWorkspace){return view.steps.filter(step=>step.status==='APPROVED').length}
  stepTone(status:string){return 'stage-'+status.toLowerCase().replaceAll('_','-')}
  stepIcon(status:string){return status==='APPROVED'?'approvals':status==='PENDING'?'clock':status==='REJECTED'?'close':status==='CHANGES_REQUESTED'?'refresh':'requests'}
  stepLabel(status:string){return status==='PENDING'?'Awaiting decision':status==='NOT_STARTED'?'Not reached':status==='CHANGES_REQUESTED'?'Changes requested':status.charAt(0)+status.slice(1).toLowerCase().replaceAll('_',' ')}
  roleName(role:string){return role==='ADMIN'?'Administrator':role.charAt(0)+role.slice(1).toLowerCase()+' approver'}
  workflowFocus(view:RequestWorkspace){const current=view.steps.find(step=>step.status==='PENDING'||step.status==='REJECTED'||step.status==='CHANGES_REQUESTED');if(current)return current.name+' · '+this.stepLabel(current.status);return view.steps.length&&this.approvedStages(view)===view.steps.length?'All stages approved':''}
  initials(value:string){return value.split(' ').filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'—'}
  canEdit(item:BusinessRequest){return item.creatorId===this.auth.user()?.id&&(item.status==='DRAFT'||item.status==='CHANGES_REQUESTED')}
  typeName(){return this.types().find(type=>type.id===this.typeId)?.name??'Selected type'}
  statusCount(value:RequestStatus|''){return value===''?this.dashboard()?.totalRequests??(this.status===''?this.result()?.totalElements:undefined):this.dashboard()?.statusBreakdown.find(metric=>metric.status===value)?.count}
  setStatus(value:RequestStatus|''){this.status=value;this.load(0)}
  setPageSize(value:number){this.pageSize=value;this.load(0)}
  searchChanged(value:string){this.query=value;if(this.searchTimer)clearTimeout(this.searchTimer);this.searchTimer=setTimeout(()=>this.load(0),300)}
  hasFilters(){return !!(this.query.trim()||this.status||this.typeId||this.sort!=='updatedAt,DESC')}
  clear(){if(this.searchTimer)clearTimeout(this.searchTimer);this.query='';this.status='';this.typeId='';this.sort='updatedAt,DESC';this.load(0)}
  load(page:number){
    const[sortBy,direction]=this.sort.split(',') as [string,'ASC'|'DESC'];
    const generation=++this.listGeneration;
    this.loading.set(true);this.error.set('');this.result.set(null);
    this.api.requests({query:this.query.trim(),status:this.status,typeId:this.typeId,page,size:this.pageSize,sortBy,direction}).pipe(finalize(()=>{if(generation===this.listGeneration)this.loading.set(false)})).subscribe({
      next:r=>{if(generation!==this.listGeneration)return;this.result.set(r);const selected=r.content.find(item=>item.id===this.selectedId())??r.content[0];if(selected){if(selected.id!==this.selectedId()){this.selectedId.set(selected.id);this.selectedSummary.set(selected);this.activeTab.set('overview');this.fetchPreview(selected.id)}else this.selectedSummary.set(selected)}else this.closePreview(false)},
      error:()=>{if(generation===this.listGeneration)this.error.set('Check the connection and try again.')}
    });
  }
  endRecord(page:PageResponse<BusinessRequest>){return Math.min((page.page+1)*page.size,page.totalElements)}
  preview(item:BusinessRequest){this.priorFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;this.selectedId.set(item.id);this.selectedSummary.set(item);this.activeTab.set('overview');this.fetchPreview(item.id);if(this.isCompact())setTimeout(()=>this.drawerTitle?.nativeElement.focus())}
  retryPreview(){const id=this.selectedId();if(id)this.fetchPreview(id)}
  private fetchPreview(id:string){const generation=++this.requestGeneration;this.previewData.set(null);this.previewError.set('');this.previewLoading.set(true);this.documents.set([]);this.loadDocuments(id);this.api.requestWorkspace(id).pipe(finalize(()=>{if(generation===this.requestGeneration)this.previewLoading.set(false)})).subscribe({next:view=>{if(generation===this.requestGeneration)this.previewData.set(view)},error:()=>{if(generation===this.requestGeneration)this.previewError.set('Request context could not be loaded. Try again.')}})}
  loadDocuments(id:string){const generation=++this.documentGeneration;this.documentsLoading.set(true);this.documentsError.set('');this.api.requestDocuments(id).pipe(finalize(()=>{if(generation===this.documentGeneration)this.documentsLoading.set(false)})).subscribe({next:docs=>{if(generation===this.documentGeneration&&id===this.selectedId())this.documents.set(docs)},error:()=>{if(generation===this.documentGeneration)this.documentsError.set('Documents could not be loaded.')}})}
  contentUrl(doc:ManagedDocument){return `/api/documents/${doc.id}/content?version=${doc.latestVersion}`}
  closePreview(restoreFocus=true){this.requestGeneration++;this.documentGeneration++;this.selectedId.set(null);this.selectedSummary.set(null);this.previewData.set(null);this.documents.set([]);this.previewLoading.set(false);this.documentsLoading.set(false);if(restoreFocus)setTimeout(()=>this.priorFocus?.focus())}
  trapFocus(event:Event){if(!this.isCompact())return;const key=event as KeyboardEvent;const drawer=(event.currentTarget as HTMLElement);const controls=Array.from(drawer.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex="0"]'));if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(key.shiftKey&&(document.activeElement===first||document.activeElement===this.drawerTitle?.nativeElement)){event.preventDefault();last.focus()}else if(!key.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
}

