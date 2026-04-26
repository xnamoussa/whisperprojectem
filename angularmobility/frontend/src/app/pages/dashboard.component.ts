import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart } from 'chart.js';

import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { ChartService } from '../services/chart.service';
import { ChatbotComponent } from './chatbot.component';
import { PredictionComponent } from './prediction/prediction.component';

type Tab = 'overview' | 'classification' | 'regression' | 'clustering' | 'forecasting' | 'deeplearning' | 'predictions' | 'powerbi' | 'advanced' | 'mlops';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChatbotComponent, FormsModule, PredictionComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  /* ── Signals ── */
  readonly data = signal<any>(null);
  readonly mlData = signal<any>(null);
  readonly loading = signal(true);
  readonly mlLoading = signal(true);
  readonly loadingProgress = signal(0);
  readonly loadingTime = signal(0);
  readonly timeRemaining = signal(6.0);
  readonly ministryTitle = signal('');
  readonly ministryKey = signal('');
  readonly activeTab = signal<Tab>('overview');
  readonly selectedPageUrl = signal<SafeResourceUrl | null>(null);
  readonly selectedPageName = signal('');
  readonly sidebarCollapsed = signal(false);
  readonly currentUser = signal<any>(null);

  /* ── Prediction state ── */
  readonly predScenarios = signal<any[]>([]);
  readonly predResult = signal<any>(null);
  readonly predLoading = signal(false);
  selectedScenario: string = '';
  selectedCity: string = 'Paris';
  readonly cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 'Strasbourg'];

  /* ── Chart Canvas refs ── */
  @ViewChild('rocCanvas') rocCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cmCanvas') cmCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('featImpCanvas') featImpCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('classCompCanvas') classCompCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('actualPredCanvas') actualPredCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('residualCanvas') residualCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('regCompCanvas') regCompCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('regFeatCanvas') regFeatCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('elbowCanvas') elbowCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pcaCanvas') pcaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('silhouetteCanvas') silhouetteCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heatmapCanvas') heatmapCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tsCanvas') tsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('decompCanvas') decompCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tsCompCanvas') tsCompCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dlLossCanvas') dlLossCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dlAccCanvas') dlAccCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('predCurveCanvas') predCurveCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('predCityCanvas') predCityCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nlpSentimentCanvas') nlpSentimentCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nlpTopicsCanvas') nlpTopicsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nlpTrendCanvas') nlpTrendCanvas!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  readonly ministryMeta: Record<string, { label: string; icon: string; color: string }> = {
    transport: { label: 'Ministère des Transports', icon: '🚆', color: '#6366f1' },
    transition: { label: 'Transition Écologique', icon: '🌱', color: '#34d399' },
    interieur: { label: 'Intérieur & Sécurité', icon: '🛡️', color: '#06b6d4' },
    amenagement: { label: 'Aménagement & Territoire', icon: '🗺️', color: '#f472b6' },
  };

  readonly tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
    { key: 'classification', label: 'Classification', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { key: 'regression', label: 'Régression', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { key: 'clustering', label: 'Clustering', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9.1 7 12c0 2.9.657 4.657.657 4.657s1.414 2 4.343 2c2.929 0 4.343-2 4.343-2' },
    { key: 'forecasting', label: 'Prévisions', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6-6V5a2 2 0 012-2h2a2 2 0 012 2v8m-4 6h4m4-6v6m2-10a2 2 0 00-2-2h-2a2 2 0 00-2 2v10' },
    { key: 'deeplearning', label: 'Deep Learning', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { key: 'predictions', label: 'Prédictions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { key: 'powerbi', label: 'Power BI', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
    { key: 'advanced', label: 'Avancé', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { key: 'mlops', label: 'IA Industrialisée', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dashboardService: DashboardService,
    private readonly sanitizer: DomSanitizer,
    protected readonly auth: AuthService,
    private readonly chartService: ChartService,
  ) {}

  ngOnInit(): void {
    this.chartService.init();
    const ministry = this.route.snapshot.paramMap.get('ministry') ?? '';
    this.ministryKey.set(ministry);
    const meta = this.ministryMeta[ministry];
    this.ministryTitle.set(meta?.label ?? ministry);
    this.currentUser.set(this.auth.user());
    this.loadMinistryData(ministry);
    this.loadPredictionScenarios(ministry);
  }

  private loadMinistryData(ministry: string) {
    this.loading.set(true);
    this.mlLoading.set(true);
    this.loadingProgress.set(0);
    this.loadingTime.set(0);
    this.timeRemaining.set(6.0);

    const progressInterval = setInterval(() => {
      this.loadingTime.update(t => +(t + 0.1).toFixed(1));
      this.timeRemaining.update(tr => tr > 0.1 ? +(tr - 0.1).toFixed(1) : 0);
      if (this.loadingProgress() < 98) {
        const jump = this.loadingProgress() < 70 ? 2 : (this.loadingProgress() < 90 ? 1 : 0.2);
        this.loadingProgress.update(p => +(p + jump).toFixed(1));
      }
    }, 100);

    this.dashboardService.getMinistryDashboard(ministry).subscribe({
      next: (result: any) => {
        this.data.set(result);
        const firstPage = result?.dashboard?.allowed_pages?.[0];
        if (firstPage) this.selectPage(firstPage.name, firstPage.url);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.dashboardService.getMinistryMl(ministry).subscribe({
      next: (result: any) => {
        clearInterval(progressInterval);
        this.loadingProgress.set(100);
        this.timeRemaining.set(0);
        setTimeout(() => {
          this.mlData.set(result);
          this.mlLoading.set(false);
          this.renderActiveCharts();
        }, 500);
      },
      error: () => {
        clearInterval(progressInterval);
        this.mlLoading.set(false);
      },
    });
  }

  private loadPredictionScenarios(ministry: string) {
    this.dashboardService.getPredictionScenarios(ministry).subscribe({
      next: (result: any) => {
        this.predScenarios.set(result.scenarios || []);
        if (result.scenarios?.length) {
          this.selectedScenario = result.scenarios[0].id;
        }
      },
    });
  }

  runPrediction() {
    if (!this.selectedScenario) return;
    this.predLoading.set(true);
    this.predResult.set(null);
    this.dashboardService.runPrediction(this.ministryKey(), this.selectedScenario, this.selectedCity).subscribe({
      next: (result: any) => {
        this.predResult.set(result);
        this.predLoading.set(false);
        setTimeout(() => this.renderPredictionCharts(), 100);
      },
      error: () => this.predLoading.set(false),
    });
  }

  private renderPredictionCharts() {
    const pred = this.predResult();
    if (!pred) return;
    // Destroy previous prediction charts
    this.charts = this.charts.filter(c => {
      if ((c as any)._predChart) { c.destroy(); return false; }
      return true;
    });
    // Prediction curve
    if (this.predCurveCanvas?.nativeElement) {
      const chart = new Chart(this.predCurveCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: pred.prediction_curve.hours.map((h: number) => `${h}h`),
          datasets: [{
            label: 'Prédiction',
            data: pred.prediction_curve.values,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#94a3b8' } }, title: { display: true, text: 'Courbe de Prédiction (24h)', color: '#f1f5f9' } },
          scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,.05)' } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,.05)' } } },
        },
      });
      (chart as any)._predChart = true;
      this.charts.push(chart);
    }
    // City comparison bar chart
    if (this.predCityCanvas?.nativeElement && pred.city_comparison) {
      const chart = new Chart(this.predCityCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: pred.city_comparison.map((c: any) => c.city),
          datasets: [{
            label: 'Valeur par ville',
            data: pred.city_comparison.map((c: any) => c.value),
            backgroundColor: ['#6366f1', '#06b6d4', '#f472b6', '#34d399', '#fbbf24', '#a78bfa'],
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false }, title: { display: true, text: 'Comparaison par Ville', color: '#f1f5f9' } },
          scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,.05)' } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,.05)' } } },
        },
      });
      (chart as any)._predChart = true;
      this.charts.push(chart);
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    setTimeout(() => this.renderActiveCharts(), 50);
  }

  selectPage(name: string, url: string) {
    this.selectedPageName.set(name);
    this.selectedPageUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  renderActiveCharts() {
    const ml = this.mlData();
    if (!ml) return;
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    const tab = this.activeTab();

    if ((tab === 'overview' || tab === 'classification') && this.rocCanvas?.nativeElement) {
      this.charts.push(this.chartService.createROCChart(this.rocCanvas.nativeElement, ml.classification?.roc_curves ?? []));
    }
    if ((tab === 'overview' || tab === 'classification') && this.cmCanvas?.nativeElement) {
      this.charts.push(this.chartService.createConfusionMatrix(this.cmCanvas.nativeElement, ml.classification?.confusion_matrix ?? {}));
    }
    if (tab === 'classification' && this.featImpCanvas?.nativeElement) {
      this.charts.push(this.chartService.createFeatureImportance(this.featImpCanvas.nativeElement, ml.classification?.feature_importance ?? [], 'Classification Feature Importance'));
    }
    if (tab === 'classification' && this.classCompCanvas?.nativeElement) {
      this.charts.push(this.chartService.createMetricsComparison(this.classCompCanvas.nativeElement, ml.classification?.models ?? [], ['accuracy', 'precision', 'recall', 'f1'], 'Model Comparison'));
    }
    if ((tab === 'overview' || tab === 'regression') && this.actualPredCanvas?.nativeElement) {
      const bestReg = ml.regression?.models?.[0]?.name ?? '';
      const avp = ml.regression?.actual_vs_predicted?.[bestReg] ?? [];
      this.charts.push(this.chartService.createActualVsPredicted(this.actualPredCanvas.nativeElement, avp));
    }
    if (tab === 'regression' && this.residualCanvas?.nativeElement) {
      this.charts.push(this.chartService.createResidualPlot(this.residualCanvas.nativeElement, ml.regression?.residuals ?? {}));
    }
    if (tab === 'regression' && this.regCompCanvas?.nativeElement) {
      this.charts.push(this.chartService.createMetricsComparison(this.regCompCanvas.nativeElement, ml.regression?.models ?? [], ['rmse', 'mae', 'r2'], 'Regression Model Comparison'));
    }
    if (tab === 'regression' && this.regFeatCanvas?.nativeElement) {
      this.charts.push(this.chartService.createFeatureImportance(this.regFeatCanvas.nativeElement, ml.regression?.feature_importance ?? [], 'Regression Feature Importance'));
    }
    if ((tab === 'overview' || tab === 'clustering') && this.pcaCanvas?.nativeElement) {
      this.charts.push(this.chartService.createPCAScatter(this.pcaCanvas.nativeElement, ml.clustering?.pca_scatter ?? []));
    }
    if (tab === 'clustering' && this.elbowCanvas?.nativeElement) {
      this.charts.push(this.chartService.createElbowChart(this.elbowCanvas.nativeElement, ml.clustering?.elbow ?? []));
    }
    if (tab === 'clustering' && this.silhouetteCanvas?.nativeElement) {
      this.charts.push(this.chartService.createSilhouetteChart(this.silhouetteCanvas.nativeElement, ml.clustering?.silhouette_analysis ?? []));
    }
    if (tab === 'clustering' && this.heatmapCanvas?.nativeElement) {
      this.charts.push(this.chartService.createHeatmap(this.heatmapCanvas.nativeElement, ml.clustering?.heatmap ?? { columns: [], rows: [] }));
    }
    if ((tab === 'overview' || tab === 'forecasting') && this.tsCanvas?.nativeElement) {
      this.charts.push(this.chartService.createTimeSeriesChart(this.tsCanvas.nativeElement, ml.forecasting?.full_series ?? { dates: [], values: [] }, ml.forecasting?.forecast_comparison ?? { dates: [], actual: [], arima: [], sarima: [], xgboost: [] }));
    }
    if (tab === 'forecasting' && this.decompCanvas?.nativeElement) {
      this.charts.push(this.chartService.createDecompositionChart(this.decompCanvas.nativeElement, ml.forecasting?.decomposition ?? {}));
    }
    if (tab === 'forecasting' && this.tsCompCanvas?.nativeElement) {
      const tsModels = (ml.forecasting?.models ?? []).filter((m: any) => m.metrics);
      this.charts.push(this.chartService.createMetricsComparison(this.tsCompCanvas.nativeElement, tsModels, ['rmse', 'mae', 'mape'], 'Forecasting Model Comparison'));
    }

    // Deep Learning charts
    if (tab === 'deeplearning') {
      this.renderDLCharts(ml);
    }
    
    // NLP Charts
    if (tab === 'advanced') {
       this.renderNLPCharts(ml);
    }
  }

  private renderNLPCharts(ml: any) {
    const nlp = ml?.advanced_objectives?.nlp;
    if (!nlp) return;

    // 1. Sentiment Radar/Doughnut
    if (this.nlpSentimentCanvas?.nativeElement) {
      this.charts.push(new Chart(this.nlpSentimentCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(nlp.sentiment.distribution),
          datasets: [{
            data: Object.values(nlp.sentiment.distribution),
            backgroundColor: ['#34d399', '#f87171', '#94a3b8'],
            borderWidth: 0,
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          cutout: '75%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } },
            title: { display: true, text: 'Répartition du Sentiment Global', color: '#f1f5f9' }
          }
        }
      }));
    }

    // 2. Topics Spider Chart
    if (this.nlpTopicsCanvas?.nativeElement) {
      this.charts.push(new Chart(this.nlpTopicsCanvas.nativeElement, {
        type: 'radar',
        data: {
          labels: nlp.topic_modeling.topics.map((t: any) => t.name),
          datasets: [{
            label: 'Importance du Sujet',
            data: nlp.topic_modeling.topics.map((t: any) => t.weight),
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: '#6366f1',
            borderWidth: 2,
            pointBackgroundColor: '#6366f1'
          }]
        },
        options: {
          responsive: true,
          scales: {
            r: {
              angleLines: { color: 'rgba(255,255,255,0.1)' },
              grid: { color: 'rgba(255,255,255,0.1)' },
              pointLabels: { color: '#94a3b8', font: { size: 10 } },
              ticks: { display: false }
            }
          },
          plugins: { legend: { display: false } }
        }
      }));
    }

    // 3. Sentiment Trend Line
    if (this.nlpTrendCanvas?.nativeElement) {
      this.charts.push(new Chart(this.nlpTrendCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: nlp.sentiment.trend.map((h: any) => h.time),
          datasets: [
            { label: 'Positif', data: nlp.sentiment.trend.map((h: any) => h.positive), borderColor: '#34d399', tension: 0.4, fill: false },
            { label: 'Négatif', data: nlp.sentiment.trend.map((h: any) => h.negative), borderColor: '#f87171', tension: 0.4, fill: false }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#94a3b8' } },
            title: { display: true, text: 'Évolution du Sentiment (24h)', color: '#f1f5f9' }
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
          }
        }
      }));
    }
  }

  private renderDLCharts(ml: any) {
    const dl = ml?.advanced_objectives?.deep_learning;
    if (!dl?.models?.length) return;

    const epochs = dl.epochs || Array.from({ length: 50 }, (_, i) => i + 1);
    const colors = ['#6366f1', '#f472b6', '#34d399', '#fbbf24'];

    // Loss comparison
    if (this.dlLossCanvas?.nativeElement) {
      const datasets = dl.models.map((m: any, i: number) => ({
        label: `${m.type} (train)`,
        data: m.training_history.loss,
        borderColor: colors[i],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      }));
      dl.models.forEach((m: any, i: number) => {
        datasets.push({
          label: `${m.type} (val)`,
          data: m.training_history.val_loss,
          borderColor: colors[i],
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
        } as any);
      });
      this.charts.push(new Chart(this.dlLossCanvas.nativeElement, {
        type: 'line',
        data: { labels: epochs, datasets },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } }, title: { display: true, text: 'Training & Validation Loss — Comparaison DL', color: '#f1f5f9', font: { size: 14 } } },
          scales: { x: { title: { display: true, text: 'Epoch', color: '#64748b' }, ticks: { color: '#64748b', maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,.05)' } }, y: { title: { display: true, text: 'Loss', color: '#64748b' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,.05)' } } },
        },
      }));
    }

    // Accuracy comparison
    if (this.dlAccCanvas?.nativeElement) {
      const datasets = dl.models.map((m: any, i: number) => ({
        label: `${m.type} (train)`,
        data: m.training_history.accuracy.map((v: number) => +(v * 100).toFixed(1)),
        borderColor: colors[i],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      }));
      dl.models.forEach((m: any, i: number) => {
        datasets.push({
          label: `${m.type} (val)`,
          data: m.training_history.val_acc.map((v: number) => +(v * 100).toFixed(1)),
          borderColor: colors[i],
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
        } as any);
      });
      this.charts.push(new Chart(this.dlAccCanvas.nativeElement, {
        type: 'line',
        data: { labels: epochs, datasets },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } }, title: { display: true, text: 'Training & Validation Accuracy — Comparaison DL', color: '#f1f5f9', font: { size: 14 } } },
          scales: { x: { title: { display: true, text: 'Epoch', color: '#64748b' }, ticks: { color: '#64748b', maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,.05)' } }, y: { title: { display: true, text: 'Accuracy (%)', color: '#64748b' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,.05)' }, min: 30 } },
        },
      }));
    }
  }

  getScenarioLabel(id: string): string {
    const s = this.predScenarios().find((sc: any) => sc.id === id);
    return s ? `${s.icon} ${s.label}` : id;
  }

  /* KPI helpers */
  get kpis() {
    const k = this.mlData()?.kpis;
    if (!k) return [];
    return [
      { label: 'Accuracy', value: k.accuracy, icon: '🎯', color: '#6366f1' },
      { label: 'F1-Score', value: k.f1_score, icon: '⚡', color: '#06b6d4' },
      { label: 'ROC-AUC', value: k.roc_auc, icon: '📈', color: '#34d399' },
      { label: 'RMSE', value: k.rmse, icon: '📉', color: '#f472b6' },
      { label: 'R²', value: k.r2, icon: '🔬', color: '#fbbf24' },
      { label: 'Silhouette', value: k.silhouette, icon: '🔮', color: '#a78bfa' },
      { label: 'MAPE', value: k.forecast_mape?.toFixed(2) + '%', icon: '📊', color: '#fb923c' },
    ];
  }

  get today(): string {
    return new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  objectEntries(obj: any): [string, any][] {
    return obj ? Object.entries(obj) : [];
  }

  getProfileColumns(profile: any[]): string[] {
    if (!profile?.length) return [];
    return Object.keys(profile[0]).filter(k => k !== 'cluster');
  }

  getClusterColor(cluster: number): string {
    const colors = ['#6366f1', '#06b6d4', '#f472b6', '#34d399', '#fbbf24', '#a78bfa'];
    return colors[cluster % colors.length];
  }

  formatAdvLabel(key: string): string {
    const map: Record<string, string> = {
      nlp: 'NLP — Traitement du Langage',
      recommendation_systems: 'Systèmes de Recommandation',
      deep_learning: 'Deep Learning',
      anomaly_detection: 'Détection d\'Anomalies',
      reinforcement_learning: 'Apprentissage par Renforcement',
    };
    return map[key] ?? key;
  }

  formatParams(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
  }

  get any(): any { return (obj: any) => obj; }
}
