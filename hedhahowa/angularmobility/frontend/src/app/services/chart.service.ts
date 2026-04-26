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
  private palette = [
    '#6366f1', '#06b6d4', '#f472b6', '#34d399',
    '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf',
  ];

  init() {
    if (this.initialized) return;
    Chart.register(
      CategoryScale, LinearScale, PointElement, LineElement, BarElement,
      ArcElement, Filler, Legend, Title, Tooltip,
      LineController, BarController, DoughnutController, ScatterController,
      RadarController, RadialLinearScale, BubbleController,
    );
    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.08)';
    Chart.defaults.font.family = "'Outfit', 'Inter', sans-serif";
    Chart.defaults.font.size = 13;
    Chart.defaults.plugins.legend!.labels!.usePointStyle = true;
    Chart.defaults.plugins.legend!.labels!.padding = 24;
    Chart.defaults.plugins.legend!.labels!.font = { size: 11, weight: '500' as any };
    this.initialized = true;
  }

  private getProOptions(title: string, showLegend = true, legendPos: 'bottom' | 'right' | 'left' | 'top' = 'bottom'): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 10 },
      plugins: {
        title: {
          display: true,
          text: title.toUpperCase(),
          color: '#f8fafc',
          font: { size: 15, weight: '700', letterSpacing: 1 },
          padding: { bottom: 24 }
        },
        legend: {
          display: showLegend,
          position: legendPos,
          align: legendPos === 'right' ? 'start' : 'center',
          labels: {
            boxWidth: 10,
            usePointStyle: true,
            padding: 20,
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
        }
      },
      scales: {
        x: { 
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        },
        y: { 
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        }
      }
    };
  }

  private safeMetric(model: any, key: string): number {
    const value = model?.metrics?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return 0;
  }

  createROCChart(canvas: HTMLCanvasElement, curves: any[]): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Random Baseline',
            data: [{x:0,y:0},{x:1,y:1}],
            borderColor: 'rgba(255,255,255,0.15)',
            borderDash: [6, 4],
            pointRadius: 0,
            borderWidth: 1.5,
          },
          ...curves.map((c: any, i: number) => ({
            label: `${c.name} (AUC=${c.auc})`,
            data: c.fpr.map((fpr: number, j: number) => ({ x: fpr, y: c.tpr[j] })),
            borderColor: this.palette[i % this.palette.length],
            backgroundColor: this.palette[i % this.palette.length] + '20',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2.5,
          })),
        ],
      },
      options: {
        ...this.getProOptions('Performance ROC — Classification accuracy', true, 'right'),
        scales: {
          x: { type: 'linear', title: { display: true, text: 'False Positive Rate' }, min: 0, max: 1 },
          y: { type: 'linear', title: { display: true, text: 'True Positive Rate' }, min: 0, max: 1 },
        }
      },
    });
  }

  createConfusionMatrix(canvas: HTMLCanvasElement, cm: any): Chart {
    const total = cm.tp + cm.tn + cm.fp + cm.fn;
    const data = [
      { x: 0, y: 1, v: cm.tp, label: 'True Positive', color: 'rgba(52, 211, 153, 0.8)' },
      { x: 1, y: 1, v: cm.fp, label: 'False Positive', color: 'rgba(239, 68, 68, 0.6)' },
      { x: 0, y: 0, v: cm.fn, label: 'False Negative', color: 'rgba(245, 158, 11, 0.6)' },
      { x: 1, y: 0, v: cm.tn, label: 'True Negative', color: 'rgba(99, 102, 241, 0.8)' },
    ];

    return new Chart(canvas, {
      type: 'bubble',
      data: {
        datasets: data.map(d => ({
          label: d.label,
          data: [{ x: d.x, y: d.y, r: 40 }],
          backgroundColor: d.color,
          borderColor: 'rgba(255,255,255,0.1)',
          hoverRadius: 45,
        }))
      },
      options: {
        ...this.getProOptions('Confusion Matrix Heatmap', false),
        layout: { padding: 40 },
        scales: {
          x: {
            type: 'linear', min: -0.5, max: 1.5,
            ticks: { callback: (v) => v === 0 ? 'Actual Pos' : (v === 1 ? 'Actual Neg' : ''), stepSize: 1, color: '#94a3b8' },
            grid: { display: false }
          },
          y: {
            type: 'linear', min: -0.5, max: 1.5,
            ticks: { callback: (v) => v === 0 ? 'Pred Neg' : (v === 1 ? 'Pred Pos' : ''), stepSize: 1, color: '#94a3b8' },
            grid: { display: false }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const item = data[ctx.datasetIndex];
                const pct = ((item.v / total) * 100).toFixed(1);
                return `${item.label}: ${item.v} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  createHeatmap(canvas: HTMLCanvasElement, heatmap: any): Chart {
    const datasets = heatmap.rows.map((row: any, i: number) => ({
      label: `Cluster ${row.cluster}`,
      data: row.values,
      backgroundColor: this.palette[i % this.palette.length] + 'cc',
      borderColor: this.palette[i % this.palette.length],
      borderWidth: 1,
      borderRadius: 4,
    }));

    return new Chart(canvas, {
      type: 'bar',
      data: { labels: heatmap.columns, datasets },
      options: {
        ...this.getProOptions('Cluster Profiling Heatmap', true, 'right'),
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
        ...this.getProOptions(title, false),
        indexAxis: 'y',
        layout: { padding: { left: 10, right: 30, top: 0, bottom: 0 } },
        scales: { 
          x: { beginAtZero: true },
          y: { ticks: { font: { size: 11 }, padding: 10 } }
        },
      },
    });
  }

  createActualVsPredicted(canvas: HTMLCanvasElement, data: any[]): Chart {
    return new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Modèle vs Réalité',
            data: data.map((d: any) => ({ x: d.actual, y: d.predicted })),
            backgroundColor: '#6366f1cc',
            borderColor: '#6366f1',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Baseline (Idéal)',
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
        ...this.getProOptions('Précision des Valeurs Prédites', true, 'right'),
        scales: {
          x: { title: { display: true, text: 'Valeur Réelle', color: '#64748b' } },
          y: { title: { display: true, text: 'Valeur Prédite', color: '#64748b' } },
        },
      },
    });
  }

  createResidualPlot(canvas: HTMLCanvasElement, residuals: { [key: string]: number[] }): Chart {
    const datasets = Object.entries(residuals).map(([name, vals], i) => ({
      label: name,
      data: vals.map((v: number, j: number) => ({ x: j, y: v })),
      backgroundColor: this.palette[i % this.palette.length] + '80',
      borderColor: this.palette[i % this.palette.length],
      pointRadius: 3,
    }));

    return new Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        ...this.getProOptions('Analyse des Résidus', true, 'right'),
        scales: {
          x: { title: { display: true, text: 'Observation' } },
          y: { title: { display: true, text: 'Écart (Résidu)' } },
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
          label: 'Inertie',
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
        ...this.getProOptions('Méthode du Coude (Elbow)', false),
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
      pointRadius: 5,
      pointHoverRadius: 8,
    }));

    return new Chart(canvas, {
      type: 'scatter',
      data: { datasets },
      options: {
        ...this.getProOptions('Visualisation PCA 2D', true, 'right'),
        scales: {
          x: { title: { display: true, text: 'Composante Principale 1' } },
          y: { title: { display: true, text: 'Composante Principale 2' } },
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
            label: 'Réel',
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
            borderWidth: 2,
          },
          {
            label: 'SARIMA',
            data: sarimaData,
            borderColor: '#34d399',
            borderDash: [6, 3],
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2,
          },
          {
            label: 'XGBoost TS',
            data: xgbData,
            borderColor: '#fbbf24',
            borderDash: [3, 3],
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2,
          },
        ],
      },
      options: {
        ...this.getProOptions('Séries Temporelles — Historique & Forecast', true, 'right'),
        scales: { x: { ticks: { maxTicksLimit: 12 } } },
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
        ...this.getProOptions('Décomposition — Tendance & Saisonnalité', true, 'right'),
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
          label: 'Score Silhouette',
          data: data.map((d: any) => d.silhouette),
          backgroundColor: data.map((_: any, i: number) => this.palette[i % this.palette.length] + 'cc'),
          borderColor: data.map((_: any, i: number) => this.palette[i % this.palette.length]),
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        ...this.getProOptions('Analyse de Silhouette', false),
        scales: { y: { beginAtZero: true, max: 1 } },
      },
    });
  }

  createMetricsComparison(canvas: HTMLCanvasElement, models: any[], metricKeys: string[], title: string): Chart {
    const datasets = metricKeys.map((key, i) => ({
      label: key.toUpperCase(),
      data: models.map((m: any) => this.safeMetric(m, key)),
      backgroundColor: this.palette[i % this.palette.length] + 'cc',
      borderColor: this.palette[i % this.palette.length],
      borderWidth: 1,
      borderRadius: 4,
    }));

    return new Chart(canvas, {
      type: 'bar',
      data: { labels: models.map((m: any) => m.name), datasets },
      options: {
        ...this.getProOptions(title, true, 'right'),
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  createDoughnutChart(canvas: HTMLCanvasElement, labels: string[], data: number[], title: string): Chart {
    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: this.palette.slice(0, data.length).map(c => c + 'dd'),
          borderWidth: 0,
          hoverOffset: 20
        }]
      },
      options: {
        ...this.getProOptions(title, true, 'bottom'),
        cutout: '70%',
      }
    });
  }

  createRadarChart(canvas: HTMLCanvasElement, labels: string[], datasets: any[], title: string): Chart {
    return new Chart(canvas, {
      type: 'radar',
      data: { labels, datasets },
      options: {
        ...this.getProOptions(title, false),
        scales: {
          r: {
            angleLines: { color: 'rgba(255,255,255,0.05)' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            pointLabels: { color: '#94a3b8', font: { size: 10 } },
            ticks: { display: false }
          }
        }
      }
    });
  }

  createMultiLineChart(canvas: HTMLCanvasElement, labels: any[], datasets: any[], title: string, xTitle = '', yTitle = ''): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        ...this.getProOptions(title, true, 'right'),
        scales: {
          x: { title: { display: true, text: xTitle }, grid: { display: false } },
          y: { title: { display: true, text: yTitle } }
        }
      }
    });
  }

  createACFChart(canvas: HTMLCanvasElement, acfData: {lag: number, value: number}[], title = 'Autocorrélation (ACF)'): Chart {
    const confidenceBound = 1.96 / Math.sqrt(Math.max(acfData.length, 30));
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: acfData.map(d => `Lag ${d.lag}`),
        datasets: [{
          label: 'ACF',
          data: acfData.map(d => d.value),
          backgroundColor: acfData.map(d => Math.abs(d.value) > confidenceBound ? '#6366f1cc' : '#94a3b860'),
          borderColor: acfData.map(d => Math.abs(d.value) > confidenceBound ? '#6366f1' : '#94a3b8'),
          borderWidth: 1,
          borderRadius: 2,
        }],
      },
      options: {
        ...this.getProOptions(title, false),
        scales: {
          y: { min: -1, max: 1, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { ticks: { maxTicksLimit: 12, font: { size: 10 } } },
        },
        plugins: {
          ...this.getProOptions(title, false).plugins,
          annotation: {
            annotations: {
              upper: { type: 'line', yMin: confidenceBound, yMax: confidenceBound, borderColor: '#f4728680', borderDash: [4, 4], borderWidth: 1 },
              lower: { type: 'line', yMin: -confidenceBound, yMax: -confidenceBound, borderColor: '#f4728680', borderDash: [4, 4], borderWidth: 1 },
            }
          }
        }
      },
    });
  }

  createBeforeAfterChart(
    canvas: HTMLCanvasElement,
    beforeData: {dates: string[], values: number[]},
    afterData: {dates: string[], values: number[]} | null,
    title = 'Comparaison Stationnarité'
  ): Chart {
    const datasets: any[] = [{
      label: 'Série Originale',
      data: beforeData.values,
      borderColor: '#f472b6',
      backgroundColor: '#f472b620',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
    }];
    const labels = beforeData.dates;

    if (afterData) {
      datasets.push({
        label: 'Après Stationnarisation',
        data: afterData.values,
        borderColor: '#34d399',
        backgroundColor: '#34d39920',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      });
    }

    return new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        ...this.getProOptions(title, true, 'right'),
        scales: { x: { ticks: { maxTicksLimit: 12 } } },
      },
    });
  }

  createGaugeChart(canvas: HTMLCanvasElement, value: number, label: string, thresholds = { good: 0.05, warn: 0.1 }): Chart {
    const isGood = value < thresholds.good;
    const isWarn = value >= thresholds.good && value < thresholds.warn;
    const color = isGood ? '#34d399' : isWarn ? '#fbbf24' : '#f87171';
    const remaining = Math.max(0, 1 - Math.min(value, 1));

    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: [label, ''],
        datasets: [{
          data: [Math.min(value, 1), remaining],
          backgroundColor: [color, 'rgba(255,255,255,0.05)'],
          borderWidth: 0,
          hoverOffset: 0,
        }],
      },
      options: {
        ...this.getProOptions('', false),
        cutout: '80%',
        rotation: -90,
        circumference: 180,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    });
  }

  destroyChart(chart: Chart | null) {
    if (chart) chart.destroy();
  }
}
