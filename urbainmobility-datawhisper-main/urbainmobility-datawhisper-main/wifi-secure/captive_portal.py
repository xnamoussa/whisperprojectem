"""
╔══════════════════════════════════════════════════════════════╗
║     DATAWHISPERS — Captive Portal Wi-Fi + Site Server       ║
║                                                              ║
║  1. Crée un hotspot Wi-Fi "DataWhispers"                    ║
║  2. Redirige TOUT le trafic vers ton site                   ║
║  3. Quand quelqu'un se connecte → il ne voit QUE ton site   ║
╚══════════════════════════════════════════════════════════════╝

Usage (en admin):
    python captive_portal.py
"""

import subprocess
import sys
import os
import socket
import threading
import struct
import time
import http.server
import http.client
import json

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ═══════════════════════════════════════════
#              CONFIGURATION
# ═══════════════════════════════════════════

SSID = "DataWhispers"
PASSWORD = "urbainmobility"
HOTSPOT_IP = "192.168.137.1"
DNS_PORT = 53
HTTP_PORT = 80
SITE_PORT = 8081  # Port du Vite dev server

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)


def log(icon, msg):
    t = time.strftime("%H:%M:%S")
    print(f"  [{t}] {icon}  {msg}")


# ═══════════════════════════════════════════
#         1. CRÉER LE HOTSPOT WI-FI
# ═══════════════════════════════════════════

def create_hotspot():
    """Crée le hotspot DataWhispers via Mobile Hotspot Windows"""
    log("📡", f"Création du hotspot '{SSID}'...")

    # Méthode 1: netsh hostednetwork
    try:
        r = subprocess.run(
            f'netsh wlan set hostednetwork mode=allow ssid={SSID} key={PASSWORD}',
            capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace'
        )
        if r.returncode == 0:
            r2 = subprocess.run(
                'netsh wlan start hostednetwork',
                capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace'
            )
            if r2.returncode == 0:
                log("✅", f"Hotspot '{SSID}' créé via netsh !")
                return True
    except Exception as e:
        log("⚠️", f"netsh échoué: {e}")

    # Méthode 2: Mobile Hotspot via PowerShell WinRT
    log("🔄", "Tentative via Mobile Hotspot Windows...")
    ps_script = f'''
[Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime] | Out-Null
[Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperators,ContentType=WindowsRuntime] | Out-Null
$cp = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
$tm = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($cp)
$cfg = $tm.GetCurrentAccessPointConfiguration()
$cfg.Ssid = "{SSID}"
$cfg.Passphrase = "{PASSWORD}"
$tm.ConfigureAccessPointAsync($cfg).AsTask().GetAwaiter().GetResult() | Out-Null
$result = $tm.StartTetheringAsync().AsTask().GetAwaiter().GetResult()
Write-Output $result.Status
'''
    try:
        r = subprocess.run(
            ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps_script],
            capture_output=True, text=True, timeout=30, encoding='utf-8', errors='replace'
        )
        if 'Success' in r.stdout or r.returncode == 0:
            log("✅", f"Mobile Hotspot '{SSID}' activé !")
            return True
        else:
            log("⚠️", f"Résultat: {r.stdout.strip()} {r.stderr.strip()}")
    except Exception as e:
        log("⚠️", f"PowerShell WinRT échoué: {e}")

    # Méthode 3: Ouvrir les paramètres Windows
    log("📱", "Ouverture des paramètres Mobile Hotspot...")
    subprocess.Popen('start ms-settings:network-mobilehotspot', shell=True)
    print(f"""
  ╔════════════════════════════════════════════════════════╗
  ║  Configurez manuellement le Mobile Hotspot :          ║
  ║                                                        ║
  ║  1. Activez le point d'accès mobile                   ║
  ║  2. Modifiez le nom → DataWhispers                    ║
  ║  3. Modifiez le mot de passe → urbainmobility         ║
  ║  4. Sauvegardez                                        ║
  ║                                                        ║
  ║  Le serveur continue — il capturera le trafic          ║
  ║  dès que le hotspot sera actif.                        ║
  ╚════════════════════════════════════════════════════════╝
""")
    return False


# ═══════════════════════════════════════════
#       2. SERVEUR DNS (CAPTIVE PORTAL)
# ═══════════════════════════════════════════

class DNSServer:
    """
    Serveur DNS qui redirige TOUTES les requêtes vers notre IP.
    Quand un appareil se connecte au Wi-Fi et essaie d'accéder
    à n'importe quel site, il est redirigé vers NOTRE serveur.
    """

    def __init__(self, redirect_ip):
        self.redirect_ip = redirect_ip
        self.sock = None

    def build_response(self, data):
        """Construit une réponse DNS qui pointe vers notre IP"""
        try:
            # Parse le header DNS
            transaction_id = data[:2]
            flags = b'\x81\x80'  # Standard response, no error
            questions = data[4:6]
            answers = questions  # Une réponse par question
            authority = b'\x00\x00'
            additional = b'\x00\x00'

            header = transaction_id + flags + questions + answers + authority + additional

            # Copier la section question
            body = b''
            offset = 12
            while offset < len(data):
                length = data[offset]
                if length == 0:
                    offset += 1
                    break
                offset += 1 + length
            qtype = data[offset:offset + 2]
            qclass = data[offset + 2:offset + 4]
            offset += 4

            question = data[12:offset]

            # Construire la réponse (pointer vers notre IP)
            answer = b'\xc0\x0c'  # Pointer vers le nom dans la question
            answer += b'\x00\x01'  # Type A
            answer += b'\x00\x01'  # Class IN
            answer += b'\x00\x00\x00\x3c'  # TTL 60s
            answer += b'\x00\x04'  # Data length 4
            answer += socket.inet_aton(self.redirect_ip)  # Notre IP

            return header + question + answer
        except Exception:
            return None

    def start(self):
        """Démarre le serveur DNS sur le port 53"""
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.sock.bind(('0.0.0.0', DNS_PORT))
            log("🌐", f"Serveur DNS démarré sur le port {DNS_PORT}")
            log("🔀", f"Toutes les requêtes DNS → {self.redirect_ip}")

            while True:
                try:
                    data, addr = self.sock.recvfrom(1024)
                    response = self.build_response(data)
                    if response:
                        self.sock.sendto(response, addr)
                except Exception:
                    continue
        except PermissionError:
            log("⚠️", f"Port {DNS_PORT} nécessite les droits admin")
            log("💡", "Le captive portal DNS ne sera pas actif")
            log("💡", "Les utilisateurs devront accéder au site via l'IP directement")
        except OSError as e:
            if "10048" in str(e) or "address already in use" in str(e).lower():
                log("⚠️", f"Port {DNS_PORT} déjà utilisé (un autre DNS tourne)")
            else:
                log("⚠️", f"Erreur DNS: {e}")


# ═══════════════════════════════════════════
#    3. SERVEUR HTTP (PROXY VERS VITE)
# ═══════════════════════════════════════════

class CaptivePortalHandler(http.server.BaseHTTPRequestHandler):
    """
    Serveur HTTP qui :
    - Redirige les checks captive portal (Android/iOS/Windows)
    - Proxy le reste vers Vite dev server
    """

    # URLs de détection captive portal
    CAPTIVE_URLS = [
        '/generate_204',           # Android
        '/hotspot-detect.html',    # Apple
        '/ncsi.txt',               # Windows
        '/connecttest.txt',        # Windows
        '/redirect',               # Windows
        '/success.txt',            # Firefox
        '/canonical.html',         # Chrome
    ]

    def log_message(self, format, *args):
        """Custom log format"""
        t = time.strftime("%H:%M:%S")
        client = self.client_address[0]
        print(f"  [{t}] 🌍  {client} → {args[0] if args else ''}")

    def do_GET(self):
        # Captive portal detection → redirige vers notre site
        if any(self.path.endswith(url) for url in self.CAPTIVE_URLS):
            self.send_response(302)
            self.send_header('Location', f'http://{HOTSPOT_IP}:{HTTP_PORT}/')
            self.end_headers()
            return

        # API wifi-check
        if self.path == '/api/wifi-check':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "allowed": True,
                "ssid": SSID,
                "message": "Connecté au réseau DataWhispers"
            }).encode())
            return

        # Proxy vers Vite
        self._proxy_to_vite()

    def do_POST(self):
        self._proxy_to_vite()

    def _proxy_to_vite(self):
        """Proxy la requête vers le serveur Vite"""
        try:
            conn = http.client.HTTPConnection('127.0.0.1', SITE_PORT, timeout=5)

            # Forward headers
            headers = {}
            for key, val in self.headers.items():
                if key.lower() != 'host':
                    headers[key] = val
            headers['Host'] = f'127.0.0.1:{SITE_PORT}'

            # Forward body if present
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None

            conn.request(self.command, self.path, body=body, headers=headers)
            response = conn.getresponse()

            # Send response back
            self.send_response(response.status)
            for key, val in response.getheaders():
                if key.lower() not in ('transfer-encoding',):
                    self.send_header(key, val)
            self.end_headers()
            self.wfile.write(response.read())
            conn.close()

        except Exception:
            # Vite pas encore démarré → page d'attente
            self._serve_waiting_page()

    def _serve_waiting_page(self):
        """Page d'attente quand Vite n'est pas encore prêt"""
        html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DataWhispers — Chargement</title>
<meta http-equiv="refresh" content="3">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{min-height:100vh;display:flex;align-items:center;justify-content:center;
background:linear-gradient(135deg,#0a0a1a,#1a1a3a);font-family:system-ui;color:#fff}}
.c{{text-align:center;padding:2rem}}
.spinner{{width:60px;height:60px;margin:0 auto 1.5rem;border:3px solid rgba(196,170,130,.2);
border-top:3px solid #c4aa82;border-radius:50%;animation:s 1s linear infinite}}
@keyframes s{{to{{transform:rotate(360deg)}}}}
h1{{font-size:1.5rem;background:linear-gradient(135deg,#c4aa82,#e8d8c4);
-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}}
p{{color:rgba(255,255,255,.5);font-size:.9rem}}
.wifi{{margin:1.5rem 0;padding:1rem;background:rgba(196,170,130,.08);border-radius:12px;
border:1px solid rgba(196,170,130,.2)}}
.wifi b{{color:#c4aa82}}
</style></head>
<body><div class="c">
<div class="spinner"></div>
<h1>DataWhispers</h1>
<p>Bienvenue sur le réseau sécurisé</p>
<div class="wifi">📡 Connecté à <b>{SSID}</b></div>
<p>Chargement du site en cours...</p>
<p style="margin-top:1rem;font-size:.75rem;color:rgba(255,255,255,.3)">Rechargement automatique...</p>
</div></body></html>'''
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(html.encode())))
        self.end_headers()
        self.wfile.write(html.encode())


# ═══════════════════════════════════════════
#            4. LANCEMENT
# ═══════════════════════════════════════════

def get_local_ip():
    """Détecte l'IP locale du hotspot"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return HOTSPOT_IP


def main():
    print(f"""
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   📡  DATAWHISPERS — Captive Portal Wi-Fi  📡           ║
  ║                                                          ║
  ║   Quand quelqu'un se connecte au Wi-Fi, il ne voit      ║
  ║   QUE votre site — comme un Wi-Fi d'hôtel !             ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
""")

    # Étape 1: Créer le hotspot
    log("📡", "=== ÉTAPE 1 : Création du hotspot Wi-Fi ===")
    create_hotspot()

    # Étape 2: Démarrer le DNS captive portal (en thread)
    log("🌐", "=== ÉTAPE 2 : Démarrage du DNS captive portal ===")
    dns = DNSServer(get_local_ip())
    dns_thread = threading.Thread(target=dns.start, daemon=True)
    dns_thread.start()
    time.sleep(0.5)

    # Étape 3: Démarrer le serveur HTTP
    log("🖥️", "=== ÉTAPE 3 : Démarrage du serveur HTTP ===")

    try:
        server = http.server.HTTPServer(('0.0.0.0', HTTP_PORT), CaptivePortalHandler)
        local_ip = get_local_ip()

        print(f"""
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   ✅  CAPTIVE PORTAL ACTIF !                             ║
  ║                                                          ║
  ║   📡 Wi-Fi    : {SSID:<39} ║
  ║   🔑 Mot passe: {PASSWORD:<39} ║
  ║   🌐 Serveur  : http://{local_ip}:{HTTP_PORT:<23} ║
  ║                                                          ║
  ║   Quand un appareil se connecte au Wi-Fi                 ║
  ║   "{SSID}", il est redirigé vers votre site !   ║
  ║                                                          ║
  ║   Assurez-vous que Vite tourne sur le port {SITE_PORT}        ║
  ║   (npm run dev)                                          ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝

  En attente de connexions... (Ctrl+C pour arrêter)
""")
        server.serve_forever()

    except PermissionError:
        log("⚠️", f"Le port {HTTP_PORT} nécessite les droits admin")
        log("💡", "Tentative sur le port 8888...")
        alt_port = 8888
        server = http.server.HTTPServer(('0.0.0.0', alt_port), CaptivePortalHandler)
        local_ip = get_local_ip()
        print(f"""
  ╔══════════════════════════════════════════════════════════╗
  ║   ✅  SERVEUR ACTIF sur le port {alt_port}                  ║
  ║                                                          ║
  ║   📡 Wi-Fi    : {SSID:<39} ║
  ║   🔑 Mot passe: {PASSWORD:<39} ║
  ║   🌐 Serveur  : http://{local_ip}:{alt_port:<23} ║
  ╚══════════════════════════════════════════════════════════╝
""")
        server.serve_forever()

    except OSError as e:
        log("❌", f"Erreur: {e}")
        log("💡", "Un autre serveur utilise déjà ce port")


if __name__ == '__main__':
    main()
