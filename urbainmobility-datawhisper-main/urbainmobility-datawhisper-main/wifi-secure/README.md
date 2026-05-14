# 🛡️ Urbain Mobility — Wi-Fi Secure System

## Architecture

```
wifi-secure/
├── create_wifi.py      → Crée le hotspot Wi-Fi (Python, admin requis)
├── wifi_server.js      → Serveur gateway qui vérifie le Wi-Fi (Node.js)
├── blocked.html        → Page d'accès refusé (UI premium)
└── wifi_config.json    → Configuration partagée (SSID, mot de passe)

start_secure.bat        → Lanceur tout-en-un (1 clic)
```

## 🚀 Utilisation Rapide

### Option 1 : Lanceur automatique
```bash
# Double-cliquez sur start_secure.bat (clic droit → Exécuter en admin)
```

### Option 2 : Étape par étape

```bash
# Terminal 1 — Créer le hotspot (admin requis)
cd wifi-secure
python create_wifi.py

# Terminal 2 — Lancer le site Vite
npm run dev

# Terminal 3 — Lancer le gateway Wi-Fi
node wifi-secure/wifi_server.js
```

Puis ouvrez **http://localhost:3333**

## ⚙️ Configuration

Modifiez `wifi-secure/wifi_config.json` :
```json
{
  "ssid": "UrbainMobility-Secure",
  "key": "UrbMob@2026!",
  "ip_range": "192.168.137."
}
```

## 🔧 Options du serveur

```bash
node wifi-secure/wifi_server.js                # Normal
node wifi-secure/wifi_server.js --port 8080    # Port custom
node wifi-secure/wifi_server.js --bypass       # Sans vérification Wi-Fi
```

## 📡 Comment ça marche

1. `create_wifi.py` crée un hotspot Wi-Fi sur votre machine
2. `wifi_server.js` écoute sur le port 3333 et vérifie le Wi-Fi
3. Si l'appareil est sur le bon réseau → proxy vers Vite (port 5173)
4. Sinon → affiche la page `blocked.html` avec les instructions
