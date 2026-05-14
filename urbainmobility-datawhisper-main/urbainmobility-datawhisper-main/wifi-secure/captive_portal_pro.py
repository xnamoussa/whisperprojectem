"""
╔══════════════════════════════════════════════════════════════╗
║     DATAWHISPERS — Serveur de Production Captive Portal     ║
║                                                              ║
║  1. Héberge le site builder (PRO)                           ║
║  2. Gère le Wi-Fi DataWhispers                              ║
║  3. Redirige tout le trafic vers ton site                   ║
╚══════════════════════════════════════════════════════════════╝
"""

import subprocess
import sys
import os
import socket
import threading
import time
import http.server
import socketserver
import json

# Configuration
SSID = "DataWhispers"
PASSWORD = "urbainmobility"
HOTSPOT_IP = "192.168.137.1"
PORT = 80
DNS_PORT = 53

# Dossier du site builder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# TanStack Start build path is usually dist/client
SITE_DIR = os.path.join(BASE_DIR, "dist", "client")

if not os.path.exists(SITE_DIR):
    SITE_DIR = os.path.join(BASE_DIR, "dist") # Fallback

def log(icon, msg):
    print(f"  [{time.strftime('%H:%M:%S')}] {icon}  {msg}")

# --- DNS SERVER ---
class FakeDNS:
    def __init__(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(('0.0.0.0', DNS_PORT))
    def start(self):
        log("🌐", "DNS Captive Portal actif")
        while True:
            data, addr = self.sock.recvfrom(1024)
            packet = data[:2] + b"\x81\x80\x00\x01\x00\x01\x00\x00\x00\x00" + data[12:] + b"\xc0\x0c\x00\x01\x00\x01\x00\x00\x00\x3c\x00\x04" + socket.inet_aton(HOTSPOT_IP)
            self.sock.sendto(packet, addr)

# --- HTTP SERVER ---
class ProHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SITE_DIR, **kwargs)

    def do_GET(self):
        # Captive Portal Check
        if any(x in self.path for x in ["generate_204", "hotspot-detect", "ncsi.txt", "connecttest"]):
            self.send_response(302)
            self.send_header('Location', f'http://{HOTSPOT_IP}/')
            self.end_headers()
            return
            
        # SPA Routing: if file not found, serve index.html
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = "/index.html"
            
        return super().do_GET()

    def log_message(self, format, *args):
        log("🌍", f"{self.client_address[0]} → {args[0]}")

def start_hotspot():
    log("📡", f"Activation du hotspot '{SSID}'...")
    ps = f'Add-Type -AssemblyName System.Runtime.WindowsRuntime; [Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime] | Out-Null; [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperators,ContentType=WindowsRuntime] | Out-Null; $cp = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile(); $tm = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($cp); $cfg = $tm.GetCurrentAccessPointConfiguration(); $cfg.Ssid = "{SSID}"; $cfg.Passphrase = "{PASSWORD}"; $tm.ConfigureAccessPointAsync($cfg).AsTask().Wait(); $tm.StartTetheringAsync().AsTask().Wait();'
    subprocess.run(['powershell', '-Command', ps], capture_output=True)

def main():
    if not os.path.exists(SITE_DIR):
        log("❌", f"ERREUR: Dossier {SITE_DIR} introuvable. Lancez 'npm run build' d'abord.")
        return

    start_hotspot()
    
    # DNS Thread
    try:
        dns = FakeDNS()
        threading.Thread(target=dns.start, daemon=True).start()
    except: log("⚠️", "DNS bloqué (droits admin ?)")

    # HTTP Server
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), ProHandler) as httpd:
            print(f"\n  ╔══════════════════════════════════════════════════════╗")
            print(f"  ║  🚀  SITE HÉBERGÉ SUR LE WI-FI PRO !               ║")
            print(f"  ║  📡  Wi-Fi : {SSID:<39} ║")
            print(f"  ║  🌐  URL    : http://{HOTSPOT_IP:<26} ║")
            print(f"  ╚══════════════════════════════════════════════════════╝\n")
            httpd.serve_forever()
    except PermissionError: log("❌", "Lancez en tant qu'ADMIN pour utiliser le port 80 !")

if __name__ == "__main__":
    main()
