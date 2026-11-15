import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';

describe('LoginComponent',()=>{
 beforeEach(async()=>{await TestBed.configureTestingModule({imports:[LoginComponent],providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])]}).compileComponents()});
 it('requires both credentials before submission',()=>{const fixture=TestBed.createComponent(LoginComponent);const component=fixture.componentInstance;component.submit();expect(component.form.invalid).toBe(true);expect(component.form.controls.username.touched).toBe(true)});
 it('accepts a complete credential form',()=>{const component=TestBed.createComponent(LoginComponent).componentInstance;component.form.setValue({username:'employee',password:'password'});expect(component.form.valid).toBe(true)});
 it('keeps entered usernames in a standard autofill-compatible text input',()=>{const fixture=TestBed.createComponent(LoginComponent);fixture.detectChanges();const input:HTMLInputElement=fixture.nativeElement.querySelector('#username');document.documentElement.dataset['theme']='dark';expect(getComputedStyle(input).color).toBe('var(--ink)');document.documentElement.dataset['theme']='light';input.value='avery';input.dispatchEvent(new Event('input'));expect(input.type).toBe('text');expect(input.autocomplete).toBe('username');expect(fixture.componentInstance.form.controls.username.value).toBe('avery')});
 it('keeps password input masked and available to password managers',()=>{const fixture=TestBed.createComponent(LoginComponent);fixture.detectChanges();const input:HTMLInputElement=fixture.nativeElement.querySelector('#password');input.value='secret';input.dispatchEvent(new Event('input'));expect(input.type).toBe('password');expect(input.autocomplete).toBe('current-password');expect(fixture.componentInstance.form.controls.password.value).toBe('secret')});
});
