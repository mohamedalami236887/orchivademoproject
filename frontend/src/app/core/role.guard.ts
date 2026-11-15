import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from './auth.models';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth=inject(AuthService); const router=inject(Router);
  const roles=(route.data['roles'] ?? []) as Role[];
  return auth.hasRole(...roles) ? true : router.createUrlTree(['/dashboard']);
};
