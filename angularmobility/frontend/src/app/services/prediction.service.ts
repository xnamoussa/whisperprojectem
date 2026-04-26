import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PredictionInput {
  city: string;
  station_type: string;
  lat: number;
  lon: number;
  connections: number;
  daily_traffic: number;
  no2: number;
}

export interface PredictionResult {
  prediction: number;
  risk_level: string;
  probability: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  predict(data: PredictionInput): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(`${this.apiUrl}/predict`, data);
  }
}
