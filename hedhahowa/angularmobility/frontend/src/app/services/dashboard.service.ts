import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiBase = 'http://localhost:8000/api';

  constructor(private readonly http: HttpClient) {}

  getMinistryDashboard(ministry: string) {
    return this.http.get(`${this.apiBase}/dashboard/${ministry}/`);
  }

  getMinistryMl(ministry: string, options?: Record<string, string | number | boolean>) {
    let params = new HttpParams();
    if (options) {
      for (const [key, value] of Object.entries(options)) {
        params = params.set(key, String(value));
      }
    }
    return this.http.get(`${this.apiBase}/dashboard/${ministry}/ml/`, { params });
  }

  getPredictionScenarios(ministry: string) {
    return this.http.get<any>(`${this.apiBase}/dashboard/${ministry}/predictions/scenarios/`);
  }

  runPrediction(
    ministry: string,
    scenarioId: string,
    city: string = 'Paris',
    horizon: string = '24h',
    options?: {
      isWeekend?: boolean;
      isHoliday?: boolean;
      rushHour?: boolean;
      weather?: string;
      eventLevel?: string;
      scenario_date?: string;
    },
  ) {
    return this.http.post<any>(`${this.apiBase}/dashboard/${ministry}/predictions/run/`, {
      scenario_id: scenarioId,
      city,
      horizon,
      ...options,
    });
  }

  runIndustrialPrediction(data: any) {
    // Calling the containerized FastAPI service on port 8001
    return this.http.post<any>('http://localhost:8001/predict', data);
  }

  exportPrediction(ministry: string, format: 'pdf' | 'excel', payload: any) {
    return this.http.post(`${this.apiBase}/dashboard/${ministry}/predictions/export/?format=${format}`, payload, {
      responseType: 'blob',
    });
  }
}
