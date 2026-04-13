import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiBase = 'http://localhost:8000/api';

  constructor(private readonly http: HttpClient) {}

  getMinistryDashboard(ministry: string) {
    return this.http.get(`${this.apiBase}/dashboard/${ministry}/`);
  }

  getMinistryMl(ministry: string) {
    return this.http.get(`${this.apiBase}/dashboard/${ministry}/ml/`);
  }

  getPredictionScenarios(ministry: string) {
    return this.http.get<any>(`${this.apiBase}/dashboard/${ministry}/predictions/scenarios/`);
  }

  runPrediction(ministry: string, scenarioId: string, city: string = 'Paris', horizon: string = '24h') {
    return this.http.post<any>(`${this.apiBase}/dashboard/${ministry}/predictions/run/`, {
      scenario_id: scenarioId,
      city,
      horizon,
    });
  }
}
