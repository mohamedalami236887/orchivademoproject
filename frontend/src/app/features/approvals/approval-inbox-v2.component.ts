import { DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ApprovalTask, ManagedDocument, RequestWorkspace } from '../../core/api.models';
import { IconComponent } from '../../shared/icon.component';
import { UiService } from '../../shared/ui.service';

type Decision = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

@Component({
  selector: 'app-approval-inbox-v2',
  imports: [DatePipe, RouterLink, IconComponent],
  template: `
    <section class="page approvals-page">
      <header class="page-head">
        <div><p class="eyebrow">Decision workspace</p><h1 tabindex="-1">Approval inbox</h1><p>Review assigned requests with the context needed to make a decision.</p></div>
        <button class="button" type="button" (click)="load()" [disabled]="loading()"><app-icon name="refresh"/> {{loading() ? 'Refreshing…' : 'Refresh queue'}}</button>
      </header>

      @if (error()) {
        <div class="queue-error" role="alert"><strong>Approval queue unavailable</strong><p>{{error()}}</p><button class="button" type="button" (click)="load()">Try again</button></div>
      } @else if (loading()) {
        <div class="workbench-skeleton" role="status" aria-label="Loading approval queue"><div class="skeleton"></div><div class="skeleton"></div></div>
      } @else if (tasks().length) {
        <div class="approval-workbench" [class.mobile-detail-open]="mobileDetail()">
          <aside class="task-rail" aria-label="Assigned approvals">
            <header><div><span class="section-label">Assigned to your role</span><strong>{{tasks().length}} pending {{tasks().length === 1 ? 'decision' : 'decisions'}}</strong></div><small>Oldest first</small></header>
            <div class="task-list">
              @for (task of tasks(); track task.id) {
                <button type="button" [class.active]="active()?.id === task.id" [attr.aria-current]="active()?.id === task.id ? 'true' : null" (click)="selectTask(task)">
                  <span class="task-top"><span class="task-reference">{{task.reference}}</span><span class="task-date">{{task.createdAt | date:'MMM d, y'}}</span></span>
                  <strong class="task-title">{{task.requestTitle}}</strong>
                  <span class="task-meta">{{task.requestType}} · {{task.requester}} · {{task.department}}</span>
                  <span class="task-bottom"><span class="stage-chip">{{task.stepName}}</span><span class="pending-chip">Decision required</span></span>
                </button>
              }
            </div>
            <footer>Only tasks available to your role and access appear here.</footer>
          </aside>

          @if (active(); as task) {
            <main class="decision-context" id="approval-detail">
              <div class="mobile-back"><button class="button" type="button" (click)="mobileDetail.set(false)"><app-icon name="arrow-right"/> Back to queue</button></div>
              <header class="detail-header">
                <div><p class="section-label">Request awaiting decision</p><a class="reference" [routerLink]="['/requests',task.requestId]">{{task.reference}}</a><h2>{{task.requestTitle}}</h2><p>{{task.requestType}} · {{task.department}} · Requested by {{task.requester}}</p></div>
                <a class="button" [routerLink]="['/requests',task.requestId]">Open full request <app-icon name="arrow-right"/></a>
              </header>
              <div class="detail-body">
                <section class="current-stage" aria-labelledby="stage-title">
                  <div><p class="section-label">Your current responsibility</p><h3 id="stage-title">{{task.stepName}}</h3><p>{{task.assigneeRole}} · Attempt {{task.attempt}}</p></div>
                  <span class="pending-chip">Pending</span>
                </section>
                <div class="context-grid">
                  <section class="context-section" aria-labelledby="business-title">
                    <h3 id="business-title">Business justification</h3>
                    <p class="justification">{{task.requestDescription || 'No description was supplied with this request.'}}</p>
                    <dl class="facts"><div><dt>Submitted</dt><dd>{{task.submittedAt ? (task.submittedAt | date:'medium') : 'Not available'}}</dd></div><div><dt>Assigned</dt><dd>{{task.createdAt | date:'medium'}}</dd></div><div><dt>Approver role</dt><dd>{{task.assigneeRole}}</dd></div></dl>
                  </section>
                  <section class="context-section workflow-section" aria-labelledby="workflow-title">
                    <h3 id="workflow-title">Workflow progress</h3>
                    @if (workspaceLoading()) { <p class="subtle" role="status">Loading workflow history…</p> }
                    @else if (workspaceError()) { <p class="inline-error" role="alert">{{workspaceError()}}</p><button class="button" type="button" (click)="loadWorkspace(task.requestId)">Retry history</button> }
                    @else if (workspace(); as view) {
                      @if (view.steps.length) {
                        <ol class="stage-list">
                          @for (step of view.steps; track step.position) {
                            <li><span class="step-position">{{step.position}}</span><div><strong>{{step.name}}</strong><small>{{step.approverRole}} · {{step.status}}</small>@if (step.actor) { <small>{{step.actor}} @if(step.decidedAt){ · {{step.decidedAt | date:'MMM d, y'}} }</small> }@if (step.comments) { <p class="history-comment">{{step.comments}}</p> }</div></li>
                          }
                        </ol>
                      } @else { <p class="subtle">No workflow stages are available for this request.</p> }
                      @if (view.approvals.length) {
                        <details class="approval-history"><summary>{{view.approvals.length}} recorded {{view.approvals.length === 1 ? 'decision' : 'decisions'}} across all attempts</summary>
                          <ol>@for (item of view.approvals; track item.id) { <li><strong>{{item.stepName}} · {{item.decision}}</strong><span>{{item.actor}} · Attempt {{item.attempt}} · {{item.decidedAt | date:'MMM d, y, h:mm a'}}</span>@if(item.comments){<p>{{item.comments}}</p>}</li> }</ol>
                        </details>
                      }
                    }
                  </section>
                </div>
                <section class="context-section evidence-section" aria-labelledby="documents-title">
                  <div class="section-heading"><div><h3 id="documents-title">Supporting documents</h3><p>Files attached to this request</p></div>@if(!documentsLoading() && !documentsError()){<span class="count">{{documents().length}}</span>}</div>
                  @if (documentsLoading()) { <p class="subtle" role="status">Loading documents…</p> }
                  @else if (documentsError()) { <p class="inline-error" role="alert">{{documentsError()}}</p><button class="button" type="button" (click)="loadDocuments(task.requestId)">Retry documents</button> }
                  @else if (documents().length) { <ul class="document-list">@for(doc of documents(); track doc.id) { <li><app-icon name="documents"/><span><strong>{{doc.title}}</strong><small>{{doc.versions[0]?.filename || 'Document'}} · version {{doc.latestVersion}}</small></span><a class="button" [href]="'/api/documents/'+doc.id+'/content?version='+doc.latestVersion" [attr.aria-label]="'Download ' + doc.title">Download</a></li> }</ul> }
                  @else { <p class="subtle">No supporting documents are attached.</p> }
                </section>
              </div>
              @if (canDecide(task)) {
                <footer class="decision-bar"><div><strong>Record your decision</strong><span>Comments are saved in the approval history.</span></div><div class="decision-actions"><button class="button" type="button" (click)="open(task,'CHANGES_REQUESTED')">Request changes</button><button class="button danger" type="button" (click)="open(task,'REJECTED')">Reject</button><button class="button primary" type="button" (click)="open(task,'APPROVED')">Approve stage</button></div></footer>
              }
            </main>
          }
        </div>
      } @else {
        <div class="queue-empty"><span class="empty-icon"><app-icon name="approvals"/></span><p class="eyebrow">Queue clear</p><h2>Nothing needs your decision</h2><p>There are no approvals requiring your action right now. New tasks assigned to your role will appear here.</p><a class="button" routerLink="/requests">Browse requests <app-icon name="arrow-right"/></a></div>
      }
    </section>

    @if (selected()) {
      <div class="dialog-backdrop" (click)="close()">
        <section class="dialog decision-dialog" role="dialog" aria-modal="true" aria-labelledby="decision-title" (click)="$event.stopPropagation()">
          <div class="dialog-head"><div><p class="eyebrow">Workflow decision</p><h2 id="decision-title">{{title()}} {{selected()!.reference}}</h2></div><button class="icon-button" type="button" aria-label="Close decision dialog" (click)="close()" [disabled]="submitting()"><app-icon name="close"/></button></div>
          <p class="dialog-context">{{selected()!.requestTitle}} · {{selected()!.stepName}}</p>
          <label for="decision-comments">Comments @if (decision() !== 'APPROVED') { <span aria-hidden="true">*</span> }</label>
          <textarea #decisionComments id="decision-comments" rows="5" maxlength="2000" [value]="comments()" (input)="comments.set($any($event.target).value)" [disabled]="submitting()" [attr.aria-required]="decision() !== 'APPROVED'" [attr.aria-invalid]="decisionError() ? 'true' : null" [attr.aria-describedby]="decisionError() ? 'decision-error' : 'decision-help'"></textarea>
          <div class="field-meta" id="decision-help"><span>{{decision() === 'APPROVED' ? 'Optional context for the audit trail' : 'Required to explain this decision'}}</span><span>{{comments().length}} / 2000</span></div>
          @if (decisionError()) { <div id="decision-error" class="alert" role="alert">{{decisionError()}}</div> }
          <div class="dialog-actions"><button class="button" type="button" (click)="close()" [disabled]="submitting()">Cancel</button><button class="button" [class.primary]="decision()==='APPROVED'" [class.danger]="decision()==='REJECTED'" type="button" (click)="submit()" [disabled]="!canSubmit()">{{submitting() ? 'Recording…' : confirmLabel()}}</button></div>
        </section>
      </div>
    }
  `,
  styleUrl: './approval-inbox-v2.component.scss'
})
export class ApprovalInboxV2Component {
  private readonly api = inject(ApiService);
  private readonly ui = inject(UiService);
  private documentRequest = 0;
  private workspaceRequest = 0;
  private queueRequest = 0;
  private returnFocus: HTMLElement | null = null;
  @ViewChild('decisionComments') decisionComments?: ElementRef<HTMLTextAreaElement>;
  readonly tasks = signal<ApprovalTask[]>([]);
  readonly active = signal<ApprovalTask | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly mobileDetail = signal(false);
  readonly documents = signal<ManagedDocument[]>([]);
  readonly documentsLoading = signal(false);
  readonly documentsError = signal('');
  readonly workspace = signal<RequestWorkspace | null>(null);
  readonly workspaceLoading = signal(false);
  readonly workspaceError = signal('');
  readonly selected = signal<ApprovalTask | null>(null);
  readonly decision = signal<Decision | null>(null);
  readonly comments = signal('');
  readonly submitting = signal(false);
  readonly decisionError = signal('');

  constructor() { this.load(); }
  @HostListener('document:keydown.escape') escape() { this.close(); }
  @HostListener('document:keydown.tab', ['$event']) keepDialogFocus(event: Event) {
    if (!this.selected()) return;
    const dialog = this.decisionComments?.nativeElement.closest('.decision-dialog');
    const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled])') ?? []);
    if (!controls.length) return;
    const first = controls[0], last = controls[controls.length - 1];
    if ((event as KeyboardEvent).shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!(event as KeyboardEvent).shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  load() {
    const request = ++this.queueRequest;
    this.loading.set(true);
    this.error.set('');
    this.api.approvals().pipe(finalize(() => { if (request === this.queueRequest) this.loading.set(false); })).subscribe({
      next: tasks => {
        if (request !== this.queueRequest) return;
        const pending = tasks.filter(task => task.status === 'PENDING');
        this.tasks.set(pending);
        const current = pending.find(task => task.id === this.active()?.id) ?? pending[0] ?? null;
        this.active.set(current);
        if (current) this.loadContext(current.requestId);
        else this.clearContext();
      },
      error: () => {
        if (request !== this.queueRequest) return;
        this.tasks.set([]);
        this.active.set(null);
        this.clearContext();
        this.error.set('Approval tasks could not be loaded.');
      }
    });
  }
  private clearContext() {
    this.documentRequest++;
    this.workspaceRequest++;
    this.documents.set([]);
    this.workspace.set(null);
    this.documentsLoading.set(false);
    this.workspaceLoading.set(false);
  }
  private loadContext(id: string) { this.loadDocuments(id); this.loadWorkspace(id); }
  selectTask(task: ApprovalTask) { this.active.set(task); this.mobileDetail.set(true); this.loadContext(task.requestId); }
  loadDocuments(id: string) {
    const request = ++this.documentRequest;
    this.documents.set([]);
    this.documentsError.set('');
    this.documentsLoading.set(true);
    this.api.requestDocuments(id).pipe(finalize(() => { if (request === this.documentRequest) this.documentsLoading.set(false); })).subscribe({
      next: docs => { if (request === this.documentRequest && this.active()?.requestId === id) this.documents.set(docs); },
      error: () => { if (request === this.documentRequest) this.documentsError.set('Documents could not be loaded.'); }
    });
  }
  loadWorkspace(id: string) {
    const request = ++this.workspaceRequest;
    this.workspace.set(null);
    this.workspaceError.set('');
    this.workspaceLoading.set(true);
    this.api.requestWorkspace(id).pipe(finalize(() => { if (request === this.workspaceRequest) this.workspaceLoading.set(false); })).subscribe({
      next: view => { if (request === this.workspaceRequest && this.active()?.requestId === id) this.workspace.set(view); },
      error: () => { if (request === this.workspaceRequest) this.workspaceError.set('Workflow history could not be loaded.'); }
    });
  }
  canDecide(task: ApprovalTask) { return task.status === 'PENDING' && this.tasks().some(item => item.id === task.id); }
  open(task: ApprovalTask, decision: Decision) {
    if (!this.canDecide(task)) return;
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.selected.set(task);
    this.decision.set(decision);
    this.comments.set('');
    this.decisionError.set('');
    setTimeout(() => this.decisionComments?.nativeElement.focus());
  }
  close() {
    if (this.submitting()) return;
    this.selected.set(null);
    this.decision.set(null);
    this.restoreFocus();
  }
  private restoreFocus() {
    setTimeout(() => {
      const target = this.returnFocus?.isConnected ? this.returnFocus : document.querySelector<HTMLElement>('.task-list button, .queue-empty a, .approvals-page h1');
      target?.focus();
    });
  }
  title() { return this.decision() === 'APPROVED' ? 'Approve' : this.decision() === 'REJECTED' ? 'Reject' : 'Request changes for'; }
  confirmLabel() { return this.decision() === 'APPROVED' ? 'Approve stage' : this.decision() === 'REJECTED' ? 'Reject request' : 'Request changes'; }
  canSubmit() { return !!this.selected() && this.canDecide(this.selected()!) && !!this.decision() && !this.submitting() && (this.decision() === 'APPROVED' || !!this.comments().trim()); }
  submit() {
    if (!this.canSubmit()) return;
    const task = this.selected()!;
    const decision = this.decision()!;
    this.submitting.set(true);
    this.decisionError.set('');
    this.api.decide(task.id, decision, this.comments().trim()).pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => { this.selected.set(null); this.decision.set(null); this.ui.notify(`${task.reference} decision recorded.`); this.load(); this.restoreFocus(); },
      error: error => this.decisionError.set(error.error?.message ?? 'The decision could not be recorded. Please try again.')
    });
  }
}

