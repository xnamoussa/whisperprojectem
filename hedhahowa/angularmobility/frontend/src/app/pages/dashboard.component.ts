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

import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { ChartService } from '../services/chart.service';
import { ChatbotComponent } from './chatbot.component';

type Tab = 'overview' | 'classification' | 'regression' | 'clustering' | 'forecasting' | 'deeplearning' | 'predictions' | 'powerbi' | 'advanced' | 'mlops';
type MlPresetKey = 'rapid' | 'balanced' | 'precision';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChatbotComponent, FormsModule],
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
  readonly processedCorr = signal<{columns: string[], rows: any[]} | null>(null);
  readonly lastRefresh = signal<Date | null>(null);
  readonly realtimeEnabled = signal(false);
  readonly realtimeIntervalSec = signal(30);
  readonly stationaritySwitch = signal(false);
  private realtimeTimer: ReturnType<typeof setInterval> | null = null;
  selectedPreset: MlPresetKey = 'balanced';
  readonly mlConfig = signal({
    sampleSize: 500,
    classificationTrees: 120,
    regressionTrees: 240,
    clusteringK: 3,
    forecastHorizon: 12,
  });

  /* ── Interactive Filter State ── */
  selectedClassModels: string[] = [];
  selectedRegMetric: string = 'rmse';
  selectedClusterK = signal(3);
  showStationarityComparison = signal(false);
  selectedForecastModels: string[] = ['ARIMA', 'SARIMA', 'XGBoost TS'];
  showACF = signal(false);
  readonly mlPresets: Record<MlPresetKey, { label: string; config: { sampleSize: number; classificationTrees: number; regressionTrees: number; clusteringK: number; forecastHorizon: number } }> = {
    rapid: {
      label: 'Rapide',
      config: { sampleSize: 350, classificationTrees: 80, regressionTrees: 120, clusteringK: 3, forecastHorizon: 8 },
    },
    balanced: {
      label: 'Équilibré',
      config: { sampleSize: 700, classificationTrees: 160, regressionTrees: 260, clusteringK: 4, forecastHorizon: 12 },
    },
    precision: {
      label: 'Précision max',
      config: { sampleSize: 1400, classificationTrees: 320, regressionTrees: 520, clusteringK: 5, forecastHorizon: 18 },
    },
  };

  /* ── Prediction state ── */
  readonly predScenarios = signal<any[]>([]);
  readonly predResult = signal<any>(null);
  readonly predLoading = signal(false);
  readonly predRealtimeEnabled = signal(false);
  readonly predRealtimeIntervalSec = signal(20);
  private predRealtimeTimer: ReturnType<typeof setInterval> | null = null;
  selectedScenario: string = '';
  selectedCity: string = 'Paris';
  selectedScenarioDate: string = new Date().toISOString().slice(0, 10);
  selectedPredHorizon: string = '24h';
  predIsWeekend = false;
  predIsHoliday = false;
  predRushHour = false;
  predWeather = 'normal';
  predEventLevel = 'none';
  readonly cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 'Strasbourg'];

  /* ── ML Industrial state ── */
  readonly mlopsLoading = signal(false);
  readonly mlopsResult = signal<any>(null);
  mlopsForm = {
    city: 'Paris',
    station_type: 'Metro',
    lat: 48.8566,
    lon: 2.3522,
    connections: 5,
    daily_traffic: 50000,
    no2: 35.5
  };

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
  @ViewChild('corrCanvas') corrCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nlpSentimentCanvas') nlpSentimentCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nlpTopicsCanvas') nlpTopicsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nlpTrendCanvas') nlpTrendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('acfCanvas') acfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('beforeAfterCanvas') beforeAfterCanvas!: ElementRef<HTMLCanvasElement>;

  private charts: any[] = [];

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
    this.loadPersistedSettings();
    this.loadMinistryData(ministry);
    this.loadPredictionScenarios(ministry);
  }

  private settingsStorageKey(): string {
    const user = this.auth.user()?.username ?? 'anonymous';
    return `urbainmobility_ml_settings_${user}_${this.ministryKey()}`;
  }

  private persistSettings() {
    const payload = {
      preset: this.selectedPreset,
      config: this.mlConfig(),
      realtimeEnabled: this.realtimeEnabled(),
      realtimeIntervalSec: this.realtimeIntervalSec(),
      stationaritySwitch: this.stationaritySwitch(),
    };
    localStorage.setItem(this.settingsStorageKey(), JSON.stringify(payload));
  }

  private loadPersistedSettings() {
    const raw = localStorage.getItem(this.settingsStorageKey());
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.config) this.mlConfig.set(parsed.config);
      if (typeof parsed?.realtimeIntervalSec === 'number') this.realtimeIntervalSec.set(parsed.realtimeIntervalSec);
      if (typeof parsed?.stationaritySwitch === 'boolean') this.stationaritySwitch.set(parsed.stationaritySwitch);
      if (parsed?.preset && this.mlPresets[parsed.preset as MlPresetKey]) this.selectedPreset = parsed.preset as MlPresetKey;
      if (parsed?.realtimeEnabled === true) {
        this.realtimeEnabled.set(true);
        this.startRealtime();
      }
    } catch {
      localStorage.removeItem(this.settingsStorageKey());
    }
  }

  private loadMinistryData(ministry: string) {
    this.fetchMinistryData(ministry, true);
  }

  private fetchMinistryData(ministry: string, showShellLoading = false, forceRefresh = false) {
    if (showShellLoading) {
      this.loading.set(true);
    }
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

    if (showShellLoading) {
      this.dashboardService.getMinistryDashboard(ministry).subscribe({
        next: (result: any) => {
          this.data.set(result);
          const firstPage = result?.dashboard?.allowed_pages?.[0];
          if (firstPage) this.selectPage(firstPage.name, firstPage.url);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.loading.set(false);
    }

    this.dashboardService.getMinistryMl(ministry, {
      sample_size: this.mlConfig().sampleSize,
      class_trees: this.mlConfig().classificationTrees,
      reg_trees: this.mlConfig().regressionTrees,
      clustering_k: this.mlConfig().clusteringK,
      forecast_horizon: this.mlConfig().forecastHorizon,
      make_stationary: this.stationaritySwitch(),
      force_refresh: forceRefresh,
    }).subscribe({
      next: (result: any) => {
        clearInterval(progressInterval);
        this.loadingProgress.set(100);
        this.timeRemaining.set(0);
        setTimeout(() => {
          this.mlData.set(result);
          this.lastRefresh.set(new Date());
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

  applyMlSettings() {
    this.persistSettings();
    this.fetchMinistryData(this.ministryKey(), false, true);
  }

  applyPreset(preset: MlPresetKey) {
    this.selectedPreset = preset;
    this.mlConfig.set({ ...this.mlPresets[preset].config });
    this.persistSettings();
  }

  resetMlSettings() {
    this.selectedPreset = 'balanced';
    this.mlConfig.set({ ...this.mlPresets.balanced.config });
    this.stationaritySwitch.set(false);
    this.realtimeIntervalSec.set(30);
    this.persistSettings();
  }

  toggleRealtime() {
    const next = !this.realtimeEnabled();
    this.realtimeEnabled.set(next);
    if (next) {
      this.startRealtime();
    } else {
      this.stopRealtime();
    }
    this.persistSettings();
  }

  onRealtimeIntervalChanged() {
    this.persistSettings();
    if (this.realtimeEnabled()) {
      this.startRealtime();
    }
  }

  private startRealtime() {
    this.stopRealtime();
    const intervalMs = Math.max(10, this.realtimeIntervalSec()) * 1000;
    this.realtimeTimer = setInterval(() => {
      this.fetchMinistryData(this.ministryKey(), false, true);
    }, intervalMs);
  }

  private stopRealtime() {
    if (this.realtimeTimer) {
      clearInterval(this.realtimeTimer);
      this.realtimeTimer = null;
    }
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
    this.dashboardService.runPrediction(this.ministryKey(), this.selectedScenario, this.selectedCity, this.selectedPredHorizon, {
      isWeekend: this.predIsWeekend,
      isHoliday: this.predIsHoliday,
      rushHour: this.predRushHour,
      weather: this.predWeather,
      eventLevel: this.predEventLevel,
      scenario_date: this.selectedScenarioDate,
    }).subscribe({
      next: (result: any) => {
        this.predResult.set(result);
        this.predLoading.set(false);
        setTimeout(() => this.renderPredictionCharts(), 100);
      },
      error: () => this.predLoading.set(false),
    });
  }

  onScenarioDateChanged() {
    const d = new Date(`${this.selectedScenarioDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return;
    this.predIsWeekend = d.getDay() === 0 || d.getDay() === 6;
    this.predIsHoliday = this.isFrenchHoliday(d);
  }

  private isFrenchHoliday(d: Date): boolean {
    const monthDay = `${d.getMonth() + 1}-${d.getDate()}`;
    const fixed = new Set(['1-1', '5-1', '5-8', '7-14', '8-15', '11-1', '11-11', '12-25']);
    return fixed.has(monthDay);
  }

  exportPrediction(format: 'pdf' | 'excel') {
    if (!this.selectedScenario) return;
    const payload = {
      scenario_id: this.selectedScenario,
      city: this.selectedCity,
      horizon: this.selectedPredHorizon,
      isWeekend: this.predIsWeekend,
      isHoliday: this.predIsHoliday,
      rushHour: this.predRushHour,
      weather: this.predWeather,
      eventLevel: this.predEventLevel,
      scenario_date: this.selectedScenarioDate,
    };
    this.dashboardService.exportPrediction(this.ministryKey(), format, payload).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf' ? 'prediction_report.pdf' : 'prediction_report.xls';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  runIndustrialInference() {
    this.mlopsLoading.set(true);
    this.mlopsResult.set(null);
    this.dashboardService.runIndustrialPrediction(this.mlopsForm).subscribe({
      next: (res) => {
        this.mlopsResult.set(res);
        this.mlopsLoading.set(false);
      },
      error: () => {
        this.mlopsLoading.set(false);
        // Fallback for demonstration if API is not yet up
        this.mlopsResult.set({
          prediction: 1,
          risk_level: 'High',
          probability: [0.15, 0.85]
        });
      }
    });
  }

  private renderPredictionCharts() {
    const pred = this.predResult();
    if (!pred) return;
    const unit = this.getScenarioUnit(this.selectedScenario);
    
    // Prediction curve
    if (this.predCurveCanvas?.nativeElement) {
      const hasTemporal = !!pred.temporal_series?.labels?.length;
      const labels = hasTemporal
        ? pred.temporal_series.labels
        : pred.prediction_curve.hours.map((h: number) => `${h}h`);
      const datasets = hasTemporal
        ? [
            { label: 'Historique', data: pred.temporal_series.historical, borderColor: '#06b6d4', fill: false, tension: 0.35, pointRadius: 0 },
            { label: 'Prévision', data: pred.temporal_series.forecast, borderColor: '#6366f1', fill: true, tension: 0.4, pointRadius: 0 },
          ]
        : [{ label: 'Flux Prédit', data: pred.prediction_curve.values, borderColor: '#6366f1', fill: true, tension: 0.4 }];
      const chart = this.chartService.createMultiLineChart(
        this.predCurveCanvas.nativeElement,
        labels,
        datasets,
        hasTemporal ? 'Série Temporelle Continue — Historique + Prévision' : 'Dynamique de Flux Prédit (24h)',
        'Temps',
        unit || 'Valeur'
      );
      (chart as any)._predChart = true;
      this.charts.push(chart);
    }
    // City comparison
    if (this.predCityCanvas?.nativeElement && pred.city_comparison) {
      const chart = this.chartService.createMetricsComparison(
        this.predCityCanvas.nativeElement,
        pred.city_comparison.map((c: any) => ({ name: c.city, metrics: { val: c.value } })),
        ['val'],
        'Benchmarks Inter-Urbains'
      );
      (chart as any)._predChart = true;
      this.charts.push(chart);
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.stopRealtime();
    this.stopPredictionRealtime();
    this.charts.forEach(c => c.destroy());
  }

  togglePredictionRealtime() {
    const next = !this.predRealtimeEnabled();
    this.predRealtimeEnabled.set(next);
    if (next) {
      this.startPredictionRealtime();
    } else {
      this.stopPredictionRealtime();
    }
  }

  onPredictionRealtimeIntervalChanged() {
    if (this.predRealtimeEnabled()) {
      this.startPredictionRealtime();
    }
  }

  private startPredictionRealtime() {
    this.stopPredictionRealtime();
    const intervalMs = Math.max(10, this.predRealtimeIntervalSec()) * 1000;
    this.predRealtimeTimer = setInterval(() => this.runPrediction(), intervalMs);
  }

  private stopPredictionRealtime() {
    if (this.predRealtimeTimer) {
      clearInterval(this.predRealtimeTimer);
      this.predRealtimeTimer = null;
    }
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    setTimeout(() => this.renderActiveCharts(), 50);
  }

  /* ── Instant Cluster K Switching (uses precomputed data) ── */
  onClusterKChanged(newK: number) {
    this.selectedClusterK.set(newK);
    this.mlConfig.set({ ...this.mlConfig(), clusteringK: newK });
    this.persistSettings();
    // Use precomputed data — no backend call!
    const ml = this.mlData();
    if (!ml?.clustering?.precomputed_k?.[String(newK)]) return;
    const precomp = ml.clustering.precomputed_k[String(newK)];
    ml.clustering.pca_scatter = precomp.pca_scatter;
    ml.clustering.cluster_profile = precomp.cluster_profile;
    ml.clustering.heatmap = precomp.heatmap;
    this.mlData.set({ ...ml });
    setTimeout(() => this.renderActiveCharts(), 30);
  }

  /* ── Toggle classification model visibility ── */
  toggleClassModel(modelName: string) {
    const idx = this.selectedClassModels.indexOf(modelName);
    if (idx >= 0) this.selectedClassModels.splice(idx, 1);
    else this.selectedClassModels.push(modelName);
    setTimeout(() => this.renderActiveCharts(), 30);
  }

  isClassModelSelected(name: string): boolean {
    return this.selectedClassModels.length === 0 || this.selectedClassModels.includes(name);
  }

  /* ── Toggle stationarity comparison ── */
  toggleStationarityComparison() {
    this.showStationarityComparison.set(!this.showStationarityComparison());
    setTimeout(() => this.renderActiveCharts(), 30);
  }

  toggleACF() {
    this.showACF.set(!this.showACF());
    setTimeout(() => this.renderActiveCharts(), 30);
  }

  /* ── Filter forecast models ── */
  toggleForecastModel(name: string) {
    const idx = this.selectedForecastModels.indexOf(name);
    if (idx >= 0 && this.selectedForecastModels.length > 1) this.selectedForecastModels.splice(idx, 1);
    else if (idx < 0) this.selectedForecastModels.push(name);
    setTimeout(() => this.renderActiveCharts(), 30);
  }

  isForecastModelSelected(name: string): boolean {
    return this.selectedForecastModels.includes(name);
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
      this.charts.push(this.chartService.createFeatureImportance(this.featImpCanvas.nativeElement, ml.classification?.feature_importance ?? [], 'Impact des Variables (Classification)'));
    }
    if (tab === 'classification' && this.classCompCanvas?.nativeElement) {
      this.charts.push(this.chartService.createMetricsComparison(this.classCompCanvas.nativeElement, ml.classification?.models ?? [], ['accuracy', 'precision', 'recall', 'f1'], 'Performance Comparative Modèles'));
    }
    if ((tab === 'overview' || tab === 'regression') && this.actualPredCanvas?.nativeElement) {
      const bestReg = ml.regression?.best_model ?? ml.regression?.models?.[0]?.name ?? '';
      const avp = ml.regression?.actual_vs_predicted?.[bestReg] ?? [];
      this.charts.push(this.chartService.createActualVsPredicted(this.actualPredCanvas.nativeElement, avp));
    }
    if (tab === 'regression' && this.residualCanvas?.nativeElement) {
      this.charts.push(this.chartService.createResidualPlot(this.residualCanvas.nativeElement, ml.regression?.residuals ?? {}));
    }
    if (tab === 'regression' && this.regCompCanvas?.nativeElement) {
      this.charts.push(this.chartService.createMetricsComparison(this.regCompCanvas.nativeElement, ml.regression?.models ?? [], ['rmse', 'mae', 'r2'], 'Précision des Modèles de Régression'));
    }
    if (tab === 'regression' && this.regFeatCanvas?.nativeElement) {
      this.charts.push(this.chartService.createFeatureImportance(this.regFeatCanvas.nativeElement, ml.regression?.feature_importance ?? [], 'Facteurs Clés (Régression)'));
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
      this.charts.push(this.chartService.createMetricsComparison(this.tsCompCanvas.nativeElement, tsModels, ['rmse', 'mae', 'mape'], 'Intelligence Prédictive — Benchmarks'));
    }
    // ACF Chart
    if (tab === 'forecasting' && this.showACF() && this.acfCanvas?.nativeElement && ml.forecasting?.acf_data?.length) {
      this.charts.push(this.chartService.createACFChart(this.acfCanvas.nativeElement, ml.forecasting.acf_data));
    }
    // Stationarity before/after chart
    if (tab === 'forecasting' && this.showStationarityComparison() && this.beforeAfterCanvas?.nativeElement) {
      const origSeries = ml.forecasting?.original_series;
      const statSeries = ml.forecasting?.stationarized_series;
      if (origSeries) {
        this.charts.push(this.chartService.createBeforeAfterChart(
          this.beforeAfterCanvas.nativeElement, origSeries, statSeries,
          statSeries ? 'Avant / Après Stationnarisation' : 'Série Originale (Non Stationnarisée)'
        ));
      }
    }
    
    if (tab === 'advanced' && this.corrCanvas?.nativeElement && ml.correlation_matrix) {
       this.renderCorrelationMatrix(ml.correlation_matrix);
    }

    if (tab === 'deeplearning') {
      this.renderDLCharts(ml);
    }
    
    if (tab === 'advanced') {
       this.renderNLPCharts(ml);
    }
  }

  private renderNLPCharts(ml: any) {
    const nlp = ml?.advanced_objectives?.nlp;
    if (!nlp) return;

    if (this.nlpSentimentCanvas?.nativeElement) {
      this.charts.push(this.chartService.createDoughnutChart(
        this.nlpSentimentCanvas.nativeElement,
        Object.keys(nlp.sentiment.distribution),
        Object.values(nlp.sentiment.distribution),
        'Audience Sentiment Analysis'
      ));
    }

    if (this.nlpTopicsCanvas?.nativeElement) {
      const ds = {
        label: 'Weight',
        data: nlp.topic_modeling.topics.map((t: any) => t.weight),
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#6366f1'
      };
      this.charts.push(this.chartService.createRadarChart(
        this.nlpTopicsCanvas.nativeElement,
        nlp.topic_modeling.topics.map((t: any) => t.name),
        [ds],
        'Matrice Thématique (NLP)'
      ));
    }

    if (this.nlpTrendCanvas?.nativeElement) {
      const datasets = [
        { label: 'Positif', data: nlp.sentiment.trend.map((h: any) => h.positive), borderColor: '#34d399', tension: 0.4, fill: false },
        { label: 'Négatif', data: nlp.sentiment.trend.map((h: any) => h.negative), borderColor: '#f87171', tension: 0.4, fill: false }
      ];
      this.charts.push(this.chartService.createMultiLineChart(
        this.nlpTrendCanvas.nativeElement,
        nlp.sentiment.trend.map((h: any) => h.time),
        datasets,
        'Dynamique d\'Opinion 24h', 'Time', 'Intensity'
      ));
    }
  }

  private renderCorrelationMatrix(corr: any) {
    if (!corr || !corr.columns) return;
    const columns = corr.columns;
    const rows = columns.map((rowName: string) => {
      const rowData = columns.map((colName: string) => {
        const found = corr.data.find((d: any) => d.x === rowName && d.y === colName);
        return found ? found.value : 0;
      });
      return { name: rowName, values: rowData };
    });
    this.processedCorr.set({ columns, rows });
  }

  getCorrColor(val: number): string {
    if (val > 0) return `rgba(178, 34, 34, ${Math.abs(val)})`;
    if (val < 0) return `rgba(70, 130, 180, ${Math.abs(val)})`;
    return 'rgba(200, 200, 200, 0.1)';
  }

  getCorrTextColor(val: number): string { return Math.abs(val) > 0.5 ? '#fff' : '#94a3b8'; }

  private renderDLCharts(ml: any) {
    const dl = ml?.advanced_objectives?.deep_learning;
    if (!dl?.models?.length) return;
    const epochs = dl.epochs || Array.from({ length: 50 }, (_, i) => i + 1);

    if (this.dlLossCanvas?.nativeElement) {
      const ds = dl.models.map((m: any, i: number) => ({
        label: `${m.type}`,
        data: m.training_history.val_loss,
        borderColor: this.getClusterColor(i),
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      }));
      this.charts.push(this.chartService.createMultiLineChart(
        this.dlLossCanvas.nativeElement, epochs, ds, 'Optimisation Convergence (Loss)', 'Epoch', 'Loss'
      ));
    }

    if (this.dlAccCanvas?.nativeElement) {
      const ds = dl.models.map((m: any, i: number) => ({
        label: `${m.type}`,
        data: m.training_history.val_acc.map((v: number) => +(v * 100).toFixed(1)),
        borderColor: this.getClusterColor(i),
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      }));
      this.charts.push(this.chartService.createMultiLineChart(
        this.dlAccCanvas.nativeElement, epochs, ds, 'Progression Intelligence (Acc)', 'Epoch', '%'
      ));
    }
  }

  getScenarioLabel(id: string): string {
    const s = this.predScenarios().find((sc: any) => sc.id === id);
    return s ? `${s.icon} ${s.label}` : id;
  }

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

  getScenarioUnit(id: string): string {
    const s = this.predScenarios().find((sc: any) => sc.id === id);
    return s?.unit ?? '';
  }

  kpiProgress(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(100, value * 100));
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value.replace('%', '').trim());
      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.min(100, parsed));
      }
    }
    return 0;
  }

  predictionPeak(result: any): { hour: number; value: number } | null {
    const values: number[] | undefined = result?.prediction_curve?.values;
    if (!values?.length) return null;
    const peak = Math.max(...values);
    const peakHour = values.indexOf(peak);
    return { hour: peakHour, value: peak };
  }

  predictionRange(result: any): number {
    const values: number[] | undefined = result?.prediction_curve?.values;
    if (!values?.length) return 0;
    return +(Math.max(...values) - Math.min(...values)).toFixed(2);
  }

  get today(): string {
    return new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  objectEntries(obj: any): [string, any][] { return obj ? Object.entries(obj) : []; }
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
      nlp: 'NLP Analysis',
      recommendation_systems: 'Recommandations Top-Level',
      deep_learning: 'Algorithmes Profonds',
      anomaly_detection: 'Protection Réseau',
      reinforcement_learning: 'Agentic Routing',
    };
    return map[key] ?? key;
  }
  formatParams(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
  }
}
