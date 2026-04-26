import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredictionService, PredictionInput, PredictionResult } from '../../services/prediction.service';

@Component({
  selector: 'app-prediction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prediction.component.html',
  styleUrl: './prediction.component.scss'
})
export class PredictionComponent implements OnInit {
  inputData: PredictionInput = {
    city: 'Paris',
    station_type: 'Metro',
    lat: 48.8566,
    lon: 2.3522,
    connections: 5,
    daily_traffic: 50000,
    no2: 35.0
  };

  result: PredictionResult | null = null;
  loading = false;
  error: string | null = null;
  apiStatus: 'online' | 'offline' | 'checking' = 'checking';

  cities = ['Paris', 'Lyon', 'Marseille', 'Lille', 'Nice'];
  stationTypes = ['Metro', 'Bus', 'Tram'];

  constructor(private predictionService: PredictionService) {}

  ngOnInit() {
    this.checkApi();
  }

  checkApi() {
    this.apiStatus = 'checking';
    this.predictionService.getHealth().subscribe({
      next: () => this.apiStatus = 'online',
      error: () => this.apiStatus = 'offline'
    });
  }

  onPredict() {
    this.loading = true;
    this.error = null;
    this.result = null;

    this.predictionService.predict(this.inputData).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to get prediction. Ensure the API is running.';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
