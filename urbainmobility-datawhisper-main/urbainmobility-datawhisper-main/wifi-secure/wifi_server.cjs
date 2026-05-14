/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       URBAIN MOBILITY — Wi-Fi Secure Gateway Server         ║
 * ║                                                              ║
 * ║   Ce serveur vérifie la connexion Wi-Fi et protège le site   ║
 * ║   Il fait office de proxy vers votre application Vite        ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * Usage:
 *   node wifi_server.js                  → Démarre le serveur sécurisé
 *   node wifi_server.js --port 8080      → Port personnalisé
 *   node wifi_server.js --bypass         → Mode bypass (pas de vérification Wi-Fi)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const os = require('os');

// ═══════════════════════════════════════════════════════════
//                     CONFIGURATION
// ═══════════════════════════════════════════════════════════

const CONFIG_FILE = path.join(__dirname, 'wifi_config.json');
const BLOCKED_PAGE = path.join(__dirname, 'blocked.html');
const DEFAULT_PORT = 3333;
const VITE_PORT = 8081; // Port par défaut de Vite dev server

// Parse args
const args = process.argv.slice(2);
const PORT = args.includes('--port') 
    ? parseInt(args[args.indexOf('--port') + 1]) || DEFAULT_PORT 
    : DEFAULT_PORT;
const BYPASS_MODE = args.includes('--bypass');

// ═══════════════════════════════════════════════════════════
//                     TERMINAL COLORS
// ═══════════════════════════════════════════════════════════

const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[91m',
    green: '\x1b[92m',
    yellow: '\x1b[93m',
    blue: '\x1b[94m',
    magenta: '\x1b[95m',
    cyan: '\x1b[96m',
};

function log(icon, msg) {
    const ts = new Date().toLocaleTimeString();
    console.log(`  ${c.dim}[${ts}]${c.reset} ${icon}  ${msg}`);
}

function logInfo(msg) { log(`${c.blue}ℹ${c.reset}`, msg); }
function logOk(msg) { log(`${c.green}✅${c.reset}`, msg); }
function logWarn(msg) { log(`${c.yellow}⚠️${c.reset}`, msg); }
function logErr(msg) { log(`${c.red}❌${c.reset}`, msg); }
function logAccess(ip, allowed) {
    const icon = allowed ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
    const status = allowed ? `${c.green}AUTORISÉ${c.reset}` : `${c.red}BLOQUÉ${c.reset}`;
    log(icon, `${c.dim}${ip}${c.reset} → ${status}`);
}

// ═══════════════════════════════════════════════════════════
//                  WIFI DETECTION
// ═══════════════════════════════════════════════════════════

/**
 * Obtient le SSID du réseau Wi-Fi actuellement connecté
 * Compatible Windows / Linux / macOS
 */
function getCurrentSSID() {
    try {
        if (process.platform === 'win32') {
            const output = execSync('netsh wlan show interfaces', {
                encoding: 'utf-8',
                timeout: 5000,
                windowsHide: true
            });
            const lines = output.split('\n');
            for (const line of lines) {
                if (line.includes('SSID') && !line.includes('BSSID')) {
                    const parts = line.split(':');
                    if (parts.length >= 2) {
                        return parts.slice(1).join(':').trim();
                    }
                }
            }
        } else if (process.platform === 'linux') {
            return execSync('iwgetid -r', { encoding: 'utf-8', timeout: 5000 }).trim();
        } else if (process.platform === 'darwin') {
            const output = execSync(
                '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I',
                { encoding: 'utf-8', timeout: 5000 }
            );
            const match = output.match(/\sSSID:\s(.+)/);
            return match ? match[1].trim() : null;
        }
    } catch (e) {
        return null;
    }
    return null;
}

/**
 * Obtient les adresses IP du serveur
 */
function getServerIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) {
                ips.push(addr.address);
            }
        }
    }
    return ips;
}

/**
 * Charge la configuration Wi-Fi
 */
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        }
    } catch (e) {
        logWarn('Impossible de lire wifi_config.json');
    }
    return {
        ssid: "UrbainMobility-Secure",
        key: "UrbMob@2026!",
        ip_range: "192.168.137."
    };
}

// ═══════════════════════════════════════════════════════════
//               VÉRIFICATION D'ACCÈS
// ═══════════════════════════════════════════════════════════

/**
 * Vérifie si une requête est autorisée
 * Méthodes de vérification:
 *  1. Le serveur lui-même est sur le bon Wi-Fi
 *  2. L'IP du client est dans la plage du hotspot
 *  3. Localhost est toujours autorisé
 */
function isRequestAllowed(req, config) {
    // Mode bypass
    if (BYPASS_MODE) return { allowed: true, reason: 'bypass' };
    
    // Localhost est toujours autorisé
    const clientIP = req.connection.remoteAddress || req.socket.remoteAddress || '';
    const cleanIP = clientIP.replace('::ffff:', '');
    
    if (cleanIP === '127.0.0.1' || cleanIP === '::1' || cleanIP === 'localhost') {
        return { allowed: true, reason: 'localhost' };
    }
    
    // Vérifier le SSID du serveur
    const currentSSID = getCurrentSSID();
    if (currentSSID === config.ssid) {
        return { allowed: true, reason: `wifi:${currentSSID}` };
    }
    
    // Vérifier si l'IP du client est dans la plage du hotspot
    if (config.ip_range && cleanIP.startsWith(config.ip_range)) {
        return { allowed: true, reason: `ip_range:${cleanIP}` };
    }
    
    return { 
        allowed: false, 
        reason: `ssid_mismatch (current: ${currentSSID || 'none'}, required: ${config.ssid})`,
        currentSSID,
        requiredSSID: config.ssid
    };
}

// ═══════════════════════════════════════════════════════════
//                  BLOCKED PAGE
// ═══════════════════════════════════════════════════════════

function getBlockedPageHTML(config, currentSSID) {
    // Try to load external blocked page
    if (fs.existsSync(BLOCKED_PAGE)) {
        let html = fs.readFileSync(BLOCKED_PAGE, 'utf-8');
        html = html.replace(/\{\{SSID\}\}/g, config.ssid);
        html = html.replace(/\{\{KEY\}\}/g, config.key);
        html = html.replace(/\{\{CURRENT_SSID\}\}/g, currentSSID || 'Non connecté');
        return html;
    }

    // Inline fallback blocked page
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⛔ Accès Refusé — Urbain Mobility</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: #0a0a0a; font-family: 'Segoe UI', system-ui, sans-serif; color: #fff;
        }
        .container { text-align: center; max-width: 600px; padding: 3rem; }
        .lock { font-size: 6rem; margin-bottom: 1rem; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        h1 { font-size: 2rem; margin-bottom: 1rem; color: #ff4444; }
        p { color: #888; margin-bottom: 1rem; line-height: 1.6; }
        .wifi-name { color: #00bfff; font-weight: bold; font-size: 1.3rem; 
            background: rgba(0,191,255,0.1); padding: 0.8rem 1.5rem; border-radius: 12px;
            border: 1px solid rgba(0,191,255,0.3); display: inline-block; margin: 1rem 0; }
        .key-box { color: #ffa500; background: rgba(255,165,0,0.1); padding: 0.5rem 1rem;
            border-radius: 8px; border: 1px solid rgba(255,165,0,0.2); font-family: monospace;
            display: inline-block; margin-top: 0.5rem; }
        .retry { margin-top: 2rem; padding: 12px 30px; border: 2px solid #00bfff;
            background: transparent; color: #00bfff; border-radius: 30px; cursor: pointer;
            font-size: 1rem; transition: all 0.3s; }
        .retry:hover { background: #00bfff; color: #000; }
    </style>
</head>
<body>
    <div class="container">
        <div class="lock">🔒</div>
        <h1>Accès Refusé</h1>
        <p>Ce site est protégé et uniquement accessible depuis le réseau Wi-Fi sécurisé :</p>
        <div class="wifi-name">📡 ${config.ssid}</div>
        <p>Mot de passe :</p>
        <div class="key-box">🔑 ${config.key}</div>
        <br>
        <button class="retry" onclick="location.reload()">🔄 Réessayer</button>
    </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
//            PROXY VERS VITE DEV SERVER
// ═══════════════════════════════════════════════════════════

function proxyToVite(req, res) {
    const options = {
        hostname: '127.0.0.1',
        port: VITE_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${VITE_PORT}` }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        // Vite n'est pas démarré, servir une page d'attente
        res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⏳ Chargement — Urbain Mobility</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, #0f0f23, #1a1a3e, #0f0f23);
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #fff;
            overflow: hidden;
        }
        .container { text-align: center; max-width: 650px; padding: 3rem; position: relative; z-index: 2; }
        .spinner {
            width: 80px; height: 80px; margin: 0 auto 2rem;
            border: 4px solid rgba(196, 170, 130, 0.15);
            border-top: 4px solid #c4aa82;
            border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 1rem;
            background: linear-gradient(135deg, #c4aa82, #e8d8c4);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: rgba(255,255,255,0.6); line-height: 1.7; margin-bottom: 0.5rem; }
        .hint { 
            margin-top: 2rem; padding: 1.2rem 1.5rem; 
            background: rgba(196, 170, 130, 0.08); border: 1px solid rgba(196, 170, 130, 0.2);
            border-radius: 16px; font-size: 0.95rem; 
        }
        .hint code { 
            background: rgba(196, 170, 130, 0.15); padding: 3px 10px; border-radius: 6px;
            font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #c4aa82;
        }
        .auto-refresh { color: rgba(255,255,255,0.3); font-size: 0.85rem; margin-top: 1.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>Application en cours de démarrage...</h1>
        <p>✅ Wi-Fi vérifié — Accès autorisé</p>
        <p>⏳ En attente du serveur de développement Vite</p>
        <div class="hint">
            <p>Lancez dans un autre terminal :</p>
            <p><code>npm run dev</code></p>
        </div>
        <p class="auto-refresh">Rechargement automatique dans 5s...</p>
    </div>
    <script>setTimeout(() => location.reload(), 5000);</script>
</body>
</html>`);
    });

    req.pipe(proxyReq, { end: true });
}

// ═══════════════════════════════════════════════════════════
//                  SERVER PRINCIPAL
// ═══════════════════════════════════════════════════════════

function startServer() {
    const config = loadConfig();
    
    // Banner
    console.log(`
  ${c.cyan}${c.bold}
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   🛡️   URBAIN MOBILITY — Wi-Fi Secure Gateway   🛡️      ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  ${c.reset}`);

    // Infos de config
    logInfo(`Réseau Wi-Fi requis : ${c.bold}${config.ssid}${c.reset}`);
    logInfo(`Plage IP autorisée  : ${c.bold}${config.ip_range}*${c.reset}`);
    logInfo(`Port du gateway     : ${c.bold}${PORT}${c.reset}`);
    logInfo(`Port Vite (proxy)   : ${c.bold}${VITE_PORT}${c.reset}`);
    
    if (BYPASS_MODE) {
        logWarn(`${c.yellow}MODE BYPASS ACTIF — Pas de vérification Wi-Fi !${c.reset}`);
    }
    
    // Vérifier le Wi-Fi actuel
    const currentSSID = getCurrentSSID();
    if (currentSSID) {
        logInfo(`Wi-Fi actuel : ${c.green}${currentSSID}${c.reset}`);
        if (currentSSID === config.ssid) {
            logOk('Connecté au bon réseau !');
        } else {
            logWarn(`Réseau différent de '${config.ssid}'`);
        }
    } else {
        logWarn('Aucun réseau Wi-Fi détecté');
    }

    // API endpoints
    const server = http.createServer((req, res) => {
        const clientIP = (req.connection.remoteAddress || '').replace('::ffff:', '');
        
        // API: Vérification Wi-Fi (toujours accessible)
        if (req.url === '/api/wifi-check') {
            const check = isRequestAllowed(req, config);
            const currentSSID = getCurrentSSID();
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                allowed: check.allowed,
                reason: check.reason,
                currentSSID: currentSSID,
                requiredSSID: config.ssid,
                clientIP: clientIP,
                serverTime: new Date().toISOString()
            }));
            return;
        }

        // API: Statut du serveur
        if (req.url === '/api/wifi-status') {
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                status: 'running',
                ssid: config.ssid,
                currentSSID: getCurrentSSID(),
                serverIPs: getServerIPs(),
                uptime: process.uptime(),
                platform: process.platform
            }));
            return;
        }

        // Vérification Wi-Fi pour toutes les autres requêtes
        const check = isRequestAllowed(req, config);
        logAccess(clientIP, check.allowed);

        if (!check.allowed) {
            // Accès bloqué
            const html = getBlockedPageHTML(config, check.currentSSID);
            res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        }

        // Accès autorisé → Proxy vers Vite
        proxyToVite(req, res);
    });

    // WebSocket proxy pour HMR de Vite
    server.on('upgrade', (req, socket, head) => {
        const check = isRequestAllowed(req, loadConfig());
        if (!check.allowed) {
            socket.destroy();
            return;
        }

        const proxySocket = require('net').connect(VITE_PORT, '127.0.0.1', () => {
            const reqLine = `${req.method} ${req.url} HTTP/1.1\r\n`;
            let headers = '';
            for (let i = 0; i < req.rawHeaders.length; i += 2) {
                if (req.rawHeaders[i].toLowerCase() === 'host') {
                    headers += `Host: 127.0.0.1:${VITE_PORT}\r\n`;
                } else {
                    headers += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
                }
            }
            proxySocket.write(reqLine + headers + '\r\n');
            if (head.length) proxySocket.write(head);
            socket.pipe(proxySocket).pipe(socket);
        });

        proxySocket.on('error', () => socket.destroy());
        socket.on('error', () => proxySocket.destroy());
    });

    server.listen(PORT, '0.0.0.0', () => {
        const serverIPs = getServerIPs();
        
        console.log(`
  ${c.green}${c.bold}═══════════════════════════════════════════════════════${c.reset}
  ${c.green}✅ Serveur sécurisé démarré !${c.reset}
  ${c.green}${c.bold}═══════════════════════════════════════════════════════${c.reset}

  ${c.cyan}Accès local  :${c.reset}  ${c.bold}http://localhost:${PORT}${c.reset}
${serverIPs.map(ip => `  ${c.cyan}Accès réseau :${c.reset}  ${c.bold}http://${ip}:${PORT}${c.reset}`).join('\n')}

  ${c.dim}En attente de connexions...${c.reset}
  ${c.dim}Ctrl+C pour arrêter${c.reset}
`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            logErr(`Le port ${PORT} est déjà utilisé !`);
            logInfo(`Essayez: node wifi_server.js --port ${PORT + 1}`);
        } else {
            logErr(`Erreur serveur: ${err.message}`);
        }
        process.exit(1);
    });
}

// ═══════════════════════════════════════════════════════════
//                     DÉMARRAGE
// ═══════════════════════════════════════════════════════════

startServer();
