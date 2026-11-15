import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AppNotification, NotificationList } from '../../core/api.models';
import { IconComponent } from '../../shared/icon.component';
import { UiService } from '../../shared/ui.service';

@Component({
  selector: 'app-notifications-v2',
  imports: [DatePipe, IconComponent],
  template: `
    <section class="page">
      <header class="page-head"><div><p class="eyebrow">Activity center</p><h1>Notifications</h1><p>Workflow decisions, document updates, and actions requiring attention.</p></div><div class="actions">@if ((data()?.unread || 0) > 0) {<button class="button" type="button" (click)="markAll()">Mark all read</button>}<button class="button" type="button" (click)="load()"><app-icon name="refresh"/> Refresh</button></div></header>
      <div class="tabs" role="tablist" aria-label="Notification view"><button type="button" role="tab" [attr.aria-selected]="view() === 'all'" (click)="view.set('all')">All <span>{{data()?.items?.length || 0}}</span></button><button type="button" role="tab" [attr.aria-selected]="view() === 'unread'" (click)="view.set('unread')">Unread <span>{{data()?.unread || 0}}</span></button></div>
      @if (error()) {<div class="alert" role="alert">{{error()}}</div>}
      @if (loading()) {<div class="panel panel-pad"><div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div></div>}
      @else {<div class="panel notification-list">@if(visible().length){@for(group of groups();track group.label){<section class="notification-group" [attr.aria-label]="group.label"><h2 class="group-heading">{{group.label}} <span>{{group.items.length}}</span></h2>@for(item of group.items;track item.id){<article [class.unread]="!item.readAt"><div class="notification-mark" aria-hidden="true"></div><div><div class="notification-meta"><span class="status">{{label(item.type)}}</span><time>{{item.createdAt | date:'medium'}}</time></div><h3>{{item.title}}</h3><p>{{item.message}}</p></div><div class="item-actions">@if (!item.readAt) {<button class="button" type="button" (click)="read(item)">{{item.targetUrl ? 'Open' : 'Mark read'}}</button>} @else if (item.targetUrl) {<button class="button" type="button" (click)="open(item)">Open record</button>}</div></article>}</section>}}@else{<div class="empty"><app-icon name="bell"/><strong>{{view() === 'unread' ? 'You are all caught up' : 'No notifications yet'}}</strong><span>New workflow activity will appear here.</span></div>}</div>}
    </section>
  `,
  styles: [`
    .tabs{display:flex;gap:.3rem;margin-bottom:1rem;border-bottom:1px solid var(--line)}.tabs button{border:0;border-bottom:2px solid transparent;padding:.75rem 1rem;background:transparent;color:var(--muted);font:inherit;font-weight:700;cursor:pointer}.tabs button[aria-selected=true]{border-color:var(--brand);color:var(--ink)}.tabs span{margin-left:.3rem;padding:.12rem .4rem;border-radius:1rem;background:var(--surface-2);font-size:.72rem}.notification-list{overflow:hidden}.notification-list article{display:grid;grid-template-columns:.45rem 1fr auto;gap:1rem;padding:1.15rem 1.25rem;border-bottom:1px solid var(--line)}.notification-list article:last-child{border:0}.notification-list article.unread{background:var(--brand-soft)}.notification-mark{width:.42rem;height:.42rem;margin-top:.5rem;border-radius:50%;background:transparent}.unread .notification-mark{background:var(--brand)}.notification-meta{display:flex;align-items:center;gap:.7rem;color:var(--muted);font-size:.76rem}.notification-meta time{margin-left:auto}.notification-list h2{margin:.55rem 0 .25rem;font-size:1rem}.notification-list p{margin:0;color:var(--muted);line-height:1.5}.item-actions{align-self:center}.empty{min-height:15rem;display:grid;place-content:center;justify-items:center;gap:.5rem;color:var(--muted)}.empty strong{color:var(--ink)}.skeleton-row{height:4.5rem;margin:.5rem 0;border-radius:var(--radius-md);background:var(--surface-2)}@media(max-width:620px){.notification-list article{grid-template-columns:.35rem 1fr}.item-actions{grid-column:2}.notification-meta{align-items:flex-start;flex-direction:column;gap:.3rem}.notification-meta time{margin:0}}
  `]
})
export class NotificationsV2Component {
  private readonly api=inject(ApiService); private readonly router=inject(Router); private readonly ui=inject(UiService);
  readonly data=signal<NotificationList|null>(null); readonly loading=signal(true); readonly error=signal(''); readonly view=signal<'all'|'unread'>('all');
  readonly visible=computed(()=>{const items=this.data()?.items??[];return this.view()==='unread'?items.filter(x=>!x.readAt):items});
  readonly groups=computed(()=>{const today=new Date().toDateString();const items=this.visible();return [{label:'Today',items:items.filter(item=>new Date(item.createdAt).toDateString()===today)},{label:'Earlier',items:items.filter(item=>new Date(item.createdAt).toDateString()!==today)}].filter(group=>group.items.length)});
  constructor(){this.load()}
  label(value:string){return value.replaceAll('_',' ').toLowerCase()}
  load(){this.loading.set(true);this.api.notifications().pipe(finalize(()=>this.loading.set(false))).subscribe({next:v=>this.data.set(v),error:()=>this.error.set('Notifications could not be loaded.')})}
  read(item:AppNotification){this.api.readNotification(item.id).subscribe({next:()=>{if(item.targetUrl)this.open(item);else this.load()},error:()=>this.error.set('The notification could not be updated.')})}
  open(item:AppNotification){if(item.targetUrl)void this.router.navigateByUrl(item.targetUrl)}
  markAll(){this.api.readAllNotifications().subscribe({next:r=>{this.ui.notify(`${r.updated} notification${r.updated===1?'':'s'} marked read.`);this.load()},error:()=>this.error.set('Notifications could not be marked read.')})}
}
