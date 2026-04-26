import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { ministryGuard } from './guards/ministry.guard';
import { DashboardComponent } from './pages/dashboard.component';
import { LoginComponent } from './pages/login.component';
import { UnauthorizedComponent } from './pages/unauthorized.component';
import { PredictionComponent } from './pages/prediction/prediction.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard/:ministry',
    component: DashboardComponent,
    canActivate: [authGuard, ministryGuard],
  },
  {
    path: 'prediction',
    component: PredictionComponent,
    canActivate: [authGuard],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: 'login' },
];
