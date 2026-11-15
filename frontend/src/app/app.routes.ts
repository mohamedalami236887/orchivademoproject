import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./shared/app-shell-v2.component').then(m => m.AppShellV2Component), children: [
    {path:'',pathMatch:'full',redirectTo:'dashboard'},
    {path:'dashboard',loadComponent:()=>import('./features/dashboard/dashboard-v2.component').then(m=>m.DashboardV2Component)},
    {path:'requests',loadComponent:()=>import('./features/requests/request-list-v2.component').then(m=>m.RequestListV2Component)},
    {path:'requests/new',loadComponent:()=>import('./features/requests/request-form.component').then(m=>m.RequestFormComponent)},
    {path:'requests/:id/edit',loadComponent:()=>import('./features/requests/request-form.component').then(m=>m.RequestFormComponent)},
    {path:'requests/:id',loadComponent:()=>import('./features/requests/request-detail-v2.component').then(m=>m.RequestDetailV2Component)},
    {path:'approvals',canActivate:[roleGuard],data:{roles:['MANAGER','FINANCE','ADMIN']},loadComponent:()=>import('./features/approvals/approval-inbox-v2.component').then(m=>m.ApprovalInboxV2Component)},
    {path:'documents',loadComponent:()=>import('./features/documents/document-library-v2.component').then(m=>m.DocumentLibraryV2Component)},
    {path:'admin/workflows',canActivate:[roleGuard],data:{roles:['ADMIN']},loadComponent:()=>import('./features/workflows/workflow-admin.component').then(m=>m.WorkflowAdminComponent)},
    {path:'admin/users',canActivate:[roleGuard],data:{roles:['ADMIN']},loadComponent:()=>import('./features/administration/user-admin-v2.component').then(m=>m.UserAdminV2Component)},
    {path:'admin/departments',canActivate:[roleGuard],data:{roles:['ADMIN']},loadComponent:()=>import('./features/administration/department-admin-v2.component').then(m=>m.DepartmentAdminV2Component)},
    {path:'admin/audit',canActivate:[roleGuard],data:{roles:['ADMIN']},loadComponent:()=>import('./features/audit/audit-v2.component').then(m=>m.AuditV2Component)},
    {path:'notifications',loadComponent:()=>import('./features/notifications/notifications-v2.component').then(m=>m.NotificationsV2Component)},
  ]},
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
