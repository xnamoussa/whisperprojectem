import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const ministryGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requestedMinistry = route.paramMap.get('ministry');

  return authService.fetchCurrentUser().pipe(
    map((currentUser) => {
      if (currentUser.ministry === requestedMinistry) {
        return true;
      }
      return router.parseUrl('/unauthorized');
    }),
  );
};
