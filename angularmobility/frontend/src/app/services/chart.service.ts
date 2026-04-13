import { Injectable } from '@angular/core';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Legend,
  Title,
  Tooltip,
  LineController,
  BarController,
  DoughnutController,
  ScatterController,
  RadarController,
  RadialLinearScale,
  BubbleController,
} from 'chart.js';

@Injectable({ providedIn: 'root' })
export class ChartService {
  private initialized = false;

  init() {
    if (this.initialized) return;
    Chart.register(
      CategoryScale, LinearScale, PointElement, LineElement, BarElement,
      ArcElement, Filler, Legend, Title, Tooltip,
      LineController, BarController, DoughnutController, ScatterController,
      RadarController, RadialLinearScale, BubbleController,
    );
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend!.labels!.usePointStyle = true;
    Chart.defaults.plugins.legend!.labels!.padding = 16;
    this.initialized = true;
  }

  private palette = [
    '#6366f1', '#06b6d4', '#f472b6', '#34d399',
    '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf',
  ];

  createROCChart(canvas: HTMLCanvasElement, curves: any[]): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          // Diagonal reference
          {
            label: 'Random (AUC=0.50)',
            data: [{x:0,y:0},{x:1,y:1}],
            borderColor: 'rgba(255,255,255,0.15)',
            borderDash: [6, 4],
            pointRadius: 0,
            borderWidth: 1.5,
          },
          ...curves.map((c: any, i: number) => ({
            label: `${c.name} (AUC=${c.auc})`,
            data: c.fpr.map((fpr: number, j: number) => ({ x: fpr, y: c.tpr[j] })),
            borderColor: this.palette[i],
            backgroundColor: this.palette[i] + '20',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2.5,
          })),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { type: 'linear', title: { display: true, text: 'False Positive Rate' }, min: 0, max: 1 },
          y: { type: 'linear', title: { display: true, text: 'True Positive Rate' }, min: 0, max: 1 },
        },
        plugins: { title: { display: true, text: 'ROC Curves', font: { size: 14, weight: 'bold' as const }, padding: { bottom: 12 } } },
      },
    });
  }

  createConfusionMatrix(canvas: HTMLCanvasElement, cm: any): Chart {
    const labels = ['Predicted Positive', 'Predicted Negative'];
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['True Positive', 'True Negative', 'False Positive', 'False Negative'],
        datasets: [{
          data: [cm.tp, cm.tn, cm.fp, cm.fn],
          backgroundColor: ['#34d399', '#6366f1', '#f472b6', '#fbbf24'],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Confusion Matrix', font: { size: 14, weight: 'bold' as const } },
        },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  createFeatureImportance(canvas: HTMLCanvasElement, features: any[], title: string): Chart {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: features.map((f: any) => f.feature || f.name),
        datasets: [{
          label: 'Importance',
          data: features.map((f: any) => f.importance || f.coefficient || f.score),
          backgroundColor: features.map((_: any, i: number) => this.palette[i % this.palette.length] + 'cc'),
          borderColor: features.map((_: any, i: number) => this.palette[i % this.palette.length]),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: title, font: { size: 14, weight: 'bold' as const } },
        },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  createActualVsPredicted(canvas: HTMLCanvasElement, data: any[]): Chart {
    return new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Actual vs Predicted',
            data: data.map((d: any) => ({ x: d.actual, y: d.predicted })),
            backgroundColor: '#6366f1cc',
            borderColor: '#6366f1',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Perfect (y=x)',
            data: (() => {
              const min = Math.min(...data.map((d: any) => Math.min(d.actual, d.predicted)));
              const max = Math.max(...data.map((d: any) => Math.max(d.actual, d.predicted)));
              return [{ x: min, y: min }, { x: max, y: max }];
            })(),
            borderColor: 'rgba(255,255,255,0.2)',
            borderDash: [5, 3],
            pointRadius: 0,
            showLine: true,
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Actual vs Predicted', font: { size: 14, weight: 'bold' as const } },
        },
        scales: {
          x: { title: { display: true, text: 'Actual' } },
          y: { title: { display: true, text: 'Predicted' } },
        },
      },
    });
  }

  createResidualPlot(canvas: HTMLCanvasElement, residuals: { [key: string]: number[] }): Chart {
    const datasets = Object.entries(residuals).map(([name, vals], i) => ({
      label: name,
      data: vals.map((v: number, j: number) => ({ x: j, y: v })),
      backgroundColor: this.palette[i] + '80',
      borderColor: this.palette[i],
      pointRadius: 3,
    }));

    return new Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Residual Plot', font: { size: 14, weight: 'bold' as const } },
        },
        scales: {
          x: { title: { display: true, text: 'Observation' } },
          y: { title: { display: true, text: 'Residual' } },
        },
      },
    });
  }

  createElbowChart(canvas: HTMLCanvasElement, data: any[]): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((d: any) => `K=${d.k}`),
        datasets: [{
          label: 'Inertia',
          data: data.map((d: any) => d.inertia),
          borderColor: '#06b6d4',
          backgroundColor: '#06b6d420',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#06b6d4',
          borderWidth: 2.5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Elbow Method', font: { size: 14, weight: 'bold' as const } },
        },
      },
    });
  }

  createPCAScatter(canvas: HTMLCanvasElement, points: any[]): Chart {
    const clusters = [...new Set(points.map((p: any) => p.cluster))];
    const datasets = clusters.map((c, i) => ({
      label: `Cluster ${c}`,
      data: points.filter((p: any) => p.cluster === c).map((p: any) => ({ x: p.x, y: p.y })),
      backgroundColor: this.palette[i % this.palette.length] + '90',
      borderColor: this.palette[i % this.palette.length],
      pointRadius: 4,
      pointHoverRadius: 6,
    }));

    return new Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'PCA 2D Cluster Visualization', font: { size: 14, weight: 'bold' as const } },
        },
        scales: {
          x: { title: { display: true, text: 'PC1' } },
          y: { title: { display: true, text: 'PC2' } },
        },
      },
    });
  }

  createTimeSeriesChart(canvas: HTMLCanvasElement, fullSeries: any, forecast: any): Chart {
    const allDates = [...fullSeries.dates];
    const actualFull = [...fullSeries.values];
    const arimaData = new Array(allDates.length).fill(null);
    const sarimaData = new Array(allDates.length).fill(null);
    const xgbData = new Array(allDates.length).fill(null);

    forecast.dates.forEach((d: string, i: number) => {
      const idx = allDates.indexOf(d);
      if (idx >= 0) {
        arimaData[idx] = forecast.arima[i];
        sarimaData[idx] = forecast.sarima[i];
        xgbData[idx] = forecast.xgboost[i];
      }
    });

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: allDates,
        datasets: [
          {
            label: 'Actual',
            data: actualFull,
            borderColor: '#6366f1',
            backgroundColor: '#6366f120',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'ARIMA',
            data: arimaData,
            borderColor: '#f472b6',
            borderDash: [4, 2],
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2.5,
          },
          {
            label: 'SARIMA',
            data: sarimaData,
            borderColor: '#34d399',
            borderDash: [6, 3],
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2.5,
          },
          {
            label: 'XGBoost TS',
            data: xgbData,
            borderColor: '#fbbf24',
            borderDash: [3, 3],
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Time Series — Actual vs Forecast', font: { size: 14, weight: 'bold' as const } },
        },
        scales: {
          x: {
            ticks: { maxTicksLimit: 12 },
          },
        },
      },
    });
  }

  createDecompositionChart(canvas: HTMLCanvasElement, decomp: any): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: decomp.dates,
        datasets: [
          { label: 'Observed', data: decomp.observed, borderColor: '#6366f1', borderWidth: 1.5, pointRadius: 0, tension: .3 },
          { label: 'Trend', data: decomp.trend, borderColor: '#f472b6', borderWidth: 2, pointRadius: 0, tension: .3 },
          { label: 'Seasonal', data: decomp.seasonal, borderColor: '#34d399', borderWidth: 1.5, pointRadius: 0, tension: .3 },
          { label: 'Residual', data: decomp.residual, borderColor: '#fbbf2480', borderWidth: 1, pointRadius: 0, tension: .3 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Time Series Decomposition', font: { size: 14, weight: 'bold' as const } },
        },
        scales: { x: { ticks: { maxTicksLimit: 12 } } },
      },
    });
  }

  createSilhouetteChart(canvas: HTMLCanvasElement, data: any[]): Chart {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map((d: any) => `K=${d.k}`),
        datasets: [{
          label: 'Silhouette Score',
          data: data.map((d: any) => d.silhouette),
          backgroundColor: data.map((_: any, i: number) => this.palette[i % this.palette.length] + 'cc'),
          borderColor: data.map((_: any, i: number) => this.palette[i % this.palette.length]),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Silhouette Analysis', font: { size: 14, weight: 'bold' as const } },
          legend: { display: false },
        },
        scales: { y: { beginAtZero: true, max: 1 } },
      },
    });
  }

  createHeatmap(canvas: HTMLCanvasElement, heatmap: any): Chart {
    // Render as grouped bar chart (column per cluster)
    const datasets = heatmap.rows.map((row: any, i: number) => ({
      label: `Cluster ${row.cluster}`,
      data: row.values,
      backgroundColor: this.palette[i % this.palette.length] + 'cc',
      borderColor: this.palette[i % this.palette.length],
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
    }));

    return new Chart(canvas, {
      type: 'bar',
      data: { labels: heatmap.columns, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Cluster Profiling Heatmap', font: { size: 14, weight: 'bold' as const } },
        },
      },
    });
  }

  createMetricsComparison(canvas: HTMLCanvasElement, models: any[], metricKeys: string[], title: string): Chart {
    const datasets = metricKeys.map((key, i) => ({
      label: key.toUpperCase(),
      data: models.map((m: any) => m.metrics[key]),
      backgroundColor: this.palette[i % this.palette.length] + 'cc',
      borderColor: this.palette[i % this.palette.length],
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
    }));

    return new Chart(canvas, {
      type: 'bar',
      data: { labels: models.map((m: any) => m.name), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: title, font: { size: 14, weight: 'bold' as const } },
        },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  destroyChart(chart: Chart | null) {
    if (chart) chart.destroy();
  }
}
