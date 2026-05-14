<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>Observatoire National des Mobilités · IA & Territoires</title>
    <!-- Google Fonts + Font Awesome 6 -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- Chart.js CDN (pour petits graphiques interactifs) -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: #f4f7fc;
            color: #1a2c3e;
            scroll-behavior: smooth;
            line-height: 1.5;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        /* Gradient hero avec animation subtile */
        .hero {
            background: linear-gradient(135deg, #0A2540 0%, #1C4E6F 100%);
            border-radius: 0 0 2rem 2rem;
            margin: 0 0 2.5rem 0;
            padding: 2.5rem 0 3rem 0;
            color: white;
            box-shadow: 0 20px 35px -10px rgba(0,0,0,0.2);
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: "🌍";
            font-size: 22rem;
            position: absolute;
            bottom: -3rem;
            right: -2rem;
            opacity: 0.08;
            pointer-events: none;
        }

        .hero h1 {
            font-size: 2.8rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            background: linear-gradient(120deg, #FFFFFF, #9FE6FF);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .badge-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
            margin: 1.5rem 0 1rem 0;
        }

        .badge {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(4px);
            padding: 0.4rem 1rem;
            border-radius: 60px;
            font-size: 0.85rem;
            font-weight: 500;
            border: 1px solid rgba(255,255,255,0.3);
        }

        .badge i {
            margin-right: 6px;
        }

        .card {
            background: white;
            border-radius: 1.5rem;
            box-shadow: 0 8px 24px rgba(0,0,0,0.05);
            padding: 1.6rem 1.8rem;
            margin-bottom: 2rem;
            transition: transform 0.2s ease, box-shadow 0.2s;
            border: 1px solid #eef2f5;
        }

        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 28px -12px rgba(0,0,0,0.12);
        }

        .grid-2 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
            gap: 1.8rem;
        }

        .grid-3 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.8rem;
        }

        .ministry-tag {
            background: #eef2ff;
            padding: 0.25rem 0.8rem;
            border-radius: 30px;
            font-size: 0.8rem;
            font-weight: 600;
            color: #0A2540;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: #fafcff;
            border-radius: 1rem;
            overflow: hidden;
        }

        th, td {
            padding: 0.9rem 1rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }

        th {
            background: #eef2fa;
            font-weight: 600;
        }

        .neo4j-graph-placeholder {
            background: linear-gradient(145deg, #1E2A3A, #10161f);
            border-radius: 1.2rem;
            padding: 1.5rem;
            text-align: center;
            color: white;
        }

        .kpi-badge {
            background: #0f2f3f;
            color: white;
            padding: 1rem;
            border-radius: 1rem;
            text-align: center;
        }

        footer {
            background: #0F212E;
            color: #bcd0df;
            border-radius: 2rem 2rem 0 0;
            margin-top: 3rem;
            padding: 2.5rem 0;
        }

        .icon-lg {
            font-size: 2rem;
            color: #1C6E8F;
        }

        .mermaid {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 1.2rem;
            margin: 1rem 0;
        }

        @media (max-width: 780px) {
            .container {
                padding: 0 1.2rem;
            }
            .hero h1 {
                font-size: 1.9rem;
            }
        }
    </style>
    <!-- Mermaid.js pour diagrammes vectoriels -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
    <script>
        mermaid.initialize({ startOnLoad: true, theme: 'base', themeVariables: { primaryColor: '#0A2540', primaryBorderColor: '#1C6E8F', primaryTextColor: '#0A2540', lineColor: '#2c7da0', fontSize: '14px' } });
    </script>
</head>
<body>

<div class="hero">
    <div class="container">
        <div class="badge-container">
            <span class="badge"><i class="fas fa-chart-line"></i> Intelligence Territoriale</span>
            <span class="badge"><i class="fas fa-microchip"></i> AI-Powered</span>
            <span class="badge"><i class="fas fa-project-diagram"></i> Neo4j Graph</span>
            <span class="badge"><i class="fas fa-robot"></i> MLOps · Digital Twin</span>
        </div>
        <h1>🚀 Observatoire National des Mobilités<br> & du Territoire</h1>
        <p style="font-size: 1.25rem; max-width: 750px; margin-top: 1rem; opacity: 0.9;">Plateforme unifiée pour monitorer, prédire et optimiser la mobilité multimodale à l’échelle nationale.</p>
        <div style="margin-top: 1.8rem;">
            <span style="background: #00D4FF20; backdrop-filter: blur(8px); padding: 0.4rem 1rem; border-radius: 60px; font-size: 0.9rem;"><i class="fas fa-chart-simple"></i> Angular • Django • Neo4j • XGBoost • MLflow</span>
        </div>
    </div>
</div>

<div class="container">
    <!-- Vision & Objectifs -->
    <div class="card">
        <h2><i class="fas fa-brain" style="color: #1C6E8F; margin-right: 12px;"></i> Vision stratégique</h2>
        <p style="margin-bottom: 1.2rem;">Transformer des données fragmentées en <strong>intelligence territoriale actionable</strong> grâce à l'IA, l'analyse de graphes et la simulation prédictive.</p>
        <div class="grid-2" style="margin-top: 1rem;">
            <div><i class="fas fa-chart-pie"></i> <strong>Tableaux de bord interministériels unifiés</strong></div>
            <div><i class="fas fa-robot"></i> <strong>IA & MLOps avancés</strong></div>
            <div><i class="fas fa-share-alt"></i> <strong>Analyse de graphes Neo4j</strong></div>
            <div><i class="fas fa-exclamation-triangle"></i> <strong>Détection d'anomalies temps réel</strong></div>
            <div><i class="fas fa-map-marked-alt"></i> <strong>Intelligence d'accessibilité territoriale</strong></div>
            <div><i class="fas fa-cubes"></i> <strong>Jumeau numérique (Digital Twin)</strong></div>
        </div>
    </div>

    <!-- Ministères impliqués -->
    <div class="card">
        <h2><i class="fas fa-landmark"></i> Ministères partenaires</h2>
        <div class="grid-3" style="margin-top: 1rem;">
            <div class="ministry-tag"><i class="fas fa-train"></i> Transports – Optimisation multimodal</div>
            <div class="ministry-tag"><i class="fas fa-shield-alt"></i> Intérieur – Sécurité routière & incidents</div>
            <div class="ministry-tag"><i class="fas fa-draw-polygon"></i> Aménagement du territoire – Accessibilité & équité</div>
            <div class="ministry-tag"><i class="fas fa-leaf"></i> Transition Écologique – Durabilité & émissions</div>
        </div>
    </div>

    <!-- Architecture Globale Mermaid -->
    <div class="card">
        <h2><i class="fas fa-project-diagram"></i> Architecture Globale</h2>
        <div class="mermaid">
            flowchart TD
            A[🌐 Angular Frontend<br>Premium Dashboard] --> B[Django Backend<br>REST APIs + JWT]
            A --> C[Power BI<br>KPIs Stratégiques]
            B <--> D[Neo4j<br>Graph Mobility]
            B <--> E[ML Engine<br>AI Models]
            E <--> F[MLflow<br>Tracking & Versioning]
            D <--> G[GTFS Import<br>Routes & Stops]
            B <--> H[SSE Real-Time<br>Event Streaming]
            H <--> I[Grafana + Prometheus<br>Observabilité]
            E <--> J[n8n<br>Automation Pipelines]
        </div>
        <div style="text-align: center; font-size: 0.8rem; margin-top: 0.5rem;"><i class="fas fa-cloud-upload-alt"></i> Flux temps réel, routage multimodal, retraining MLOps</div>
    </div>

    <!-- Moteur Intelligence Artificielle + tableau modèles -->
    <div class="card">
        <h2><i class="fas fa-microchip"></i> Moteur d'Intelligence Artificielle</h2>
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr><th>Catégorie</th><th>Modèles</th><th>Usage Principal</th></tr>
                </thead>
                <tbody>
                    <tr><td>Classification</td><td>Random Forest, Logistic Regression</td><td>Prédiction de risques</td></tr>
                    <tr><td>Régression</td><td>XGBoost, Ridge, Lasso</td><td>Prévision trafic & CO₂</td></tr>
                    <tr><td>Clustering</td><td>KMeans, DBSCAN, GMM</td><td>Segmentation territoriale</td></tr>
                    <tr><td>Time Series</td><td>SARIMA, XGBoost TS</td><td>Analyse prédictive de mobilité</td></tr>
                </tbody>
            </table>
        </div>
        <div class="grid-2" style="margin-top: 1.2rem;">
            <div><i class="fas fa-sync-alt"></i> <strong>MLOps</strong> : Retraining auto via Cron + Drift Detection, MLflow complet, pipelines n8n</div>
            <div><i class="fas fa-chart-line"></i> <strong>Détection d'anomalies</strong> temps réel sur flux transports</div>
        </div>
    </div>

    <!-- Moteur Neo4j & GTFS -->
    <div class="card">
        <h2><i class="fas fa-project-diagram"></i> Moteur Neo4j Smart Mobility</h2>
        <div class="grid-2">
            <div>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li><i class="fas fa-route"></i> Routage multimodal (Dijkstra + contraintes temporelles)</li>
                    <li><i class="fas fa-bell"></i> Détection d'incidents & propagation dans le graphe</li>
                    <li><i class="fas fa-choropleth-map"></i> Accessibilité territoriale (isochrones, DRT)</li>
                    <li><i class="fas fa-database"></i> Import GTFS automatique (stops, trips, stop_times → Neo4j)</li>
                </ul>
            </div>
            <div class="neo4j-graph-placeholder">
                <i class="fas fa-share-alt" style="font-size: 2.5rem;"></i>
                <p style="margin-top: 8px;"><strong>Visualisation réseau multimodal</strong><br> <span style="font-size:0.75rem;">nœuds: gares / arrêts, relations: lignes, temps de parcours</span></p>
                <div style="height: 4px; width: 80px; background: #00D4FF; margin: 0.6rem auto;"></div>
                <i class="fas fa-train"></i> + <i class="fas fa-bus"></i> + <i class="fas fa-bicycle"></i> interconnexion
            </div>
        </div>
    </div>

    <!-- Jumeau numérique & simulations -->
    <div class="card">
        <h2><i class="fas fa-cube"></i> Jumeau numérique & Simulations prédictives</h2>
        <p>Simulation de : fermetures de routes / gares, disruptions massives, propagation des congestions, impacts environnementaux.</p>
        <div style="background: #deeaf3; border-radius: 1rem; padding: 0.8rem; margin-top: 1rem; text-align: center;">
            <span class="badge" style="background:#1C6E8F; color:white;"><i class="fas fa-chart-simple"></i> Scénario "Fermeture Ligne A" → impact +23% congestion</span>
            <span class="badge" style="background:#1C6E8F; color:white;"><i class="fas fa-chart-simple"></i> Réduction CO₂ potentielle -14% avec reports modaux</span>
        </div>
    </div>

    <!-- KPIs + Observabilité Grafana + chart.js preview -->
    <div class="grid-2">
        <div class="card">
            <h2><i class="fas fa-chart-simple"></i> KPIs Stratégiques</h2>
            <div class="grid-2" style="gap: 0.7rem;">
                <div class="kpi-badge"><i class="fas fa-car"></i> Taux congestion<br><span style="font-size: 1.5rem;">68%</span></div>
                <div class="kpi-badge"><i class="fas fa-clock"></i> Ponctualité<br><span style="font-size: 1.5rem;">91%</span></div>
                <div class="kpi-badge"><i class="fas fa-co2"></i> CO₂ (g/pkm)<br><span style="font-size: 1.5rem;">112</span></div>
                <div class="kpi-badge"><i class="fas fa-wheelchair"></i> Accessibilité<br><span style="font-size: 1.5rem;">74/100</span></div>
            </div>
            <canvas id="kpiTrafficChart" width="300" height="150" style="margin-top: 1rem;"></canvas>
        </div>
        <div class="card">
            <h2><i class="fas fa-tachometer-alt"></i> Stack d'Observabilité temps réel</h2>
            <p><i class="fas fa-chart-line"></i> <strong>Grafana</strong> : Dashboards latence, ML, incidents<br>
            <i class="fas fa-database"></i> <strong>Prometheus</strong> : Métriques infrastructure & applicatives<br>
            <i class="fas fa-bell"></i> <strong>SSE</strong> : Alertes temps réel vers dashboard</p>
            <div style="background: #141f2c; border-radius: 1rem; padding: 0.8rem; color: #9ad0f5; font-family: monospace; margin-top: 1rem;">
                🟢 latence API: 43ms  |  🟡 prédiction trafic: charge 32%  |  🔴 incident détecté (A86)
            </div>
        </div>
    </div>

    <!-- Dashboard navigation & valeur ajoutée -->
    <div class="card">
        <h2><i class="fas fa-compass"></i> Navigation Dashboard Premium</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
            <span class="badge" style="background:#0A2540; color: white;"><i class="fas fa-home"></i> Accueil</span>
            <span class="badge"><i class="fas fa-subway"></i> Mobilité</span>
            <span class="badge"><i class="fas fa-shield-virus"></i> Sécurité</span>
            <span class="badge"><i class="fas fa-seedling"></i> Écologie</span>
            <span class="badge"><i class="fas fa-city"></i> Aménagement</span>
            <span class="badge"><i class="fas fa-robot"></i> Prédictions IA</span>
            <span class="badge"><i class="fas fa-chart-network"></i> Analytics Neo4j</span>
            <span class="badge"><i class="fas fa-broadcast-tower"></i> Monitoring temps réel</span>
        </div>
        <div class="grid-3" style="margin-top: 1rem; text-align: center;">
            <div><i class="fas fa-user-tie fa-2x"></i><br><strong>Décideurs publics</strong><br>Vision unifiée, gouvernance IA</div>
            <div><i class="fas fa-users fa-2x"></i><br><strong>Citoyens</strong><br>Transparence, mobilité améliorée</div>
            <div><i class="fas fa-building fa-2x"></i><br><strong>Administration</strong><br>Automatisation, gestion prédictive</div>
        </div>
    </div>

    <!-- Wi-Fi sécurisé + section technique -->
    <div class="grid-2">
        <div class="card">
            <h2><i class="fas fa-wifi"></i> Système Wi-Fi sécurisé urbain</h2>
            <p>Structure <code>wifi-secure/</code> : hotspot sécurisé, contrôle d'accès, isolation réseau. <br> <code>create_wifi.py</code> + <code>wifi_server.js</code> + <code>blocked.html</code> + configuration JSON.</p>
            <div style="background:#f0f4f9; border-radius: 1rem; padding: 0.8rem; margin-top: 0.6rem; font-family: monospace; font-size:0.8rem;">
                <i class="fas fa-terminal"></i> python create_wifi.py --ssid "Mobilites_Publique" --secure
            </div>
        </div>
        <div class="card">
            <h2><i class="fas fa-code-branch"></i> Technologies clés</h2>
            <p>Angular • Django • Neo4j • Python • XGBoost • MLflow • n8n • Grafana • Prometheus • GTFS</p>
            <div class="badge-container" style="margin-top: 1rem;">
                <span class="badge"><i class="fab fa-angular"></i> Angular 17</span>
                <span class="badge"><i class="fab fa-python"></i> Django + DRF</span>
                <span class="badge"><i class="fas fa-database"></i> Neo4j</span>
                <span class="badge"><i class="fas fa-chart-line"></i> MLflow</span>
            </div>
        </div>
    </div>

    <!-- captures d'écran style (placeholders avec icônes et style) -->
    <div class="card">
        <h2><i class="fas fa-camera"></i> Aperçu du tableau de bord</h2>
        <div class="grid-3" style="gap:1rem;">
            <div style="background: linear-gradient(145deg, #1E3A8A, #0f2a5e); border-radius: 1rem; padding: 1.2rem; color: white; text-align: center;">
                <i class="fas fa-chart-pie fa-3x"></i>
                <p style="margin-top: 0.5rem;"><strong>Dashboard Principal</strong><br>KPIs nationaux & alertes</p>
            </div>
            <div style="background: linear-gradient(145deg, #166534, #0a3622); border-radius: 1rem; padding: 1.2rem; color: white; text-align: center;">
                <i class="fas fa-map-marked-alt fa-3x"></i>
                <p><strong>Carte isochrone</strong><br>Accessibilité 15/30/45min</p>
            </div>
            <div style="background: linear-gradient(145deg, #7F1D1D, #4c1010); border-radius: 1rem; padding: 1.2rem; color: white; text-align: center;">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <p><strong>Détection anomalies IA</strong><br>Congestion / incidents</p>
            </div>
        </div>
        <p style="margin-top: 0.8rem; font-size: 0.85rem; text-align: center;"><i class="fas fa-image"></i> Interface Angular interactive – remplacez les visuels par vos captures réelles.</p>
    </div>

    <!-- Démarrage rapide + github -->
    <div class="card" style="background: #eef2fa;">
        <h2><i class="fab fa-github"></i> Pour commencer</h2>
        <pre style="background: #0A2540; color: #ccdeee; padding: 1rem; border-radius: 1rem; overflow-x: auto;">git clone https://github.com/votre-org/observatoire-mobilites.git
cd observatoire-mobilites/wifi-secure
python create_wifi.py
npm run dev   # lancement interface wifi + dashboard local</pre>
        <div style="display: flex; gap: 1rem; justify-content: flex-start; margin-top: 1rem;">
            <span><i class="fab fa-docker"></i> Déploiement conteneurisé</span>
            <span><i class="fas fa-chart-network"></i> Exemple dataset GTFS intégré</span>
        </div>
    </div>

    <footer>
        <div class="container" style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;">
            <div><i class="fas fa-heart" style="color:#FFB347;"></i> Made with intelligence for French territories</div>
            <div>Observatoire National des Mobilités – version IA 2.0 · <i class="fas fa-chart-line"></i> Digital Twin ready</div>
            <div><i class="fas fa-envelope"></i> contact@observatoire-mobilites.fr</div>
        </div>
    </footer>
</div>

<script>
    // petit graphique trafic / émissions KPI démo
    const ctx = document.getElementById('kpiTrafficChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            datasets: [
                {
                    label: 'Indice de congestion (IA)',
                    data: [72, 78, 74, 81, 88, 54],
                    borderColor: '#1C6E8F',
                    backgroundColor: 'rgba(28,110,143,0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Émissions CO₂ (tonnes)',
                    data: [210, 225, 218, 240, 265, 190],
                    borderColor: '#E9A23B',
                    borderDash: [5,5],
                    backgroundColor: 'transparent',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' } }
        }
    });
</script>
</body>
</html>
