import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthenticatedUser } from './auth.models';
import { AuthService } from './auth.service';

describe('AuthService',()=>{
 let service:AuthService;let http:HttpTestingController;
 const user:AuthenticatedUser={id:'u1',username:'employee',email:'employee@orchiva.local',displayName:'Evelyn Stone',departmentId:'d1',departmentName:'Operations',roles:['EMPLOYEE']};
 beforeEach(()=>{TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});service=TestBed.inject(AuthService);http=TestBed.inject(HttpTestingController)});afterEach(()=>http.verify());
 it('establishes a CSRF token before login and stores the user',()=>{service.login({username:'employee',password:'password'}).subscribe();http.expectOne('/api/auth/csrf').flush({headerName:'X-XSRF-TOKEN',token:'token'});const request=http.expectOne('/api/auth/login');expect(request.request.body.username).toBe('employee');request.flush(user);expect(service.user()?.displayName).toBe('Evelyn Stone')});
 it('treats an expired session as signed out',()=>{service.initialize().subscribe(value=>expect(value).toBeNull());http.expectOne('/api/auth/me').flush({}, {status:401,statusText:'Unauthorized'});expect(service.authenticated()).toBe(false)});
 it('clears state after logout',()=>{service.initialize().subscribe();http.expectOne('/api/auth/me').flush(user);service.logout().subscribe();http.expectOne('/api/auth/logout').flush(null);expect(service.user()).toBeNull()});
});
