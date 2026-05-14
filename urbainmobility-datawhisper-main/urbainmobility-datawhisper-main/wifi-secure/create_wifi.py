#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║          URBAIN MOBILITY — Wi-Fi Hotspot Manager            ║
║                  Secure Network Creator                     ║
╚══════════════════════════════════════════════════════════════╝

Ce script crée un point d'accès Wi-Fi sécurisé.
Le site ne sera accessible QUE depuis ce réseau.

Usage:
    python create_wifi.py                    → Créer le hotspot par défaut
    python create_wifi.py --ssid NOM --key PASS  → Personnalisé
    python create_wifi.py --stop             → Arrêter le hotspot
    python create_wifi.py --status           → Voir le statut

⚠️  Nécessite les droits administrateur sur Windows !
"""

import subprocess
import sys
import os
import time
import argparse
import json
import ctypes
from datetime import datetime

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ═══════════════════════════════════════════════════════════
#                     CONFIGURATION
# ═══════════════════════════════════════════════════════════

DEFAULT_SSID = "DataWhispers"
DEFAULT_KEY = "urbainmobility"
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "wifi_config.json")
HOTSPOT_IP_RANGE = "192.168.137."

# ═══════════════════════════════════════════════════════════
#                     COULEURS TERMINAL
# ═══════════════════════════════════════════════════════════

class Colors:
    HEADER  = '\033[95m'
    BLUE    = '\033[94m'
    CYAN    = '\033[96m'
    GREEN   = '\033[92m'
    YELLOW  = '\033[93m'
    RED     = '\033[91m'
    BOLD    = '\033[1m'
    DIM     = '\033[2m'
    RESET   = '\033[0m'

def print_banner():
    banner = f"""
{Colors.CYAN}{Colors.BOLD}
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║   📡  URBAIN MOBILITY — Wi-Fi Hotspot Manager  📡       ║
    ║                                                          ║
    ║          Sécurisez votre site avec votre réseau          ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
{Colors.RESET}"""
    print(banner)

def log_info(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"  {Colors.DIM}[{ts}]{Colors.RESET} {Colors.BLUE}ℹ{Colors.RESET}  {msg}")

def log_success(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"  {Colors.DIM}[{ts}]{Colors.RESET} {Colors.GREEN}✅{Colors.RESET} {msg}")

def log_error(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"  {Colors.DIM}[{ts}]{Colors.RESET} {Colors.RED}❌{Colors.RESET} {msg}")

def log_warn(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"  {Colors.DIM}[{ts}]{Colors.RESET} {Colors.YELLOW}⚠️{Colors.RESET}  {msg}")

def log_step(step, total, msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"\n  {Colors.DIM}[{ts}]{Colors.RESET} {Colors.CYAN}[{step}/{total}]{Colors.RESET} {Colors.BOLD}{msg}{Colors.RESET}")

# ═══════════════════════════════════════════════════════════
#                  VÉRIFICATIONS SYSTÈME
# ═══════════════════════════════════════════════════════════

def is_admin():
    """Vérifie si le script est exécuté en tant qu'administrateur"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except:
        return False

def check_hosted_network_support():
    """Vérifie si la carte Wi-Fi supporte le hosted network"""
    try:
        result = subprocess.run(
            'netsh wlan show drivers',
            capture_output=True, text=True, shell=True,
            encoding='utf-8', errors='replace'
        )
        output = result.stdout
        
        # Vérifier en anglais et en français
        supported = (
            "Hosted network supported  : Yes" in output or
            "Hosted network supported" in output and "Yes" in output or
            "Réseau hébergé pris en charge" in output and "Oui" in output or
            "Hosted network" in output.lower()
        )
        return supported, output
    except Exception as e:
        return False, str(e)

def get_current_ssid():
    """Obtient le SSID du réseau Wi-Fi actuellement connecté"""
    try:
        result = subprocess.run(
            'netsh wlan show interfaces',
            capture_output=True, text=True, shell=True,
            encoding='utf-8', errors='replace'
        )
        for line in result.stdout.split('\n'):
            if 'SSID' in line and 'BSSID' not in line:
                parts = line.split(':')
                if len(parts) >= 2:
                    return parts[1].strip()
        return None
    except:
        return None

# ═══════════════════════════════════════════════════════════
#              GESTION DU HOTSPOT (WINDOWS)
# ═══════════════════════════════════════════════════════════

def create_hotspot_windows(ssid, key):
    """Crée et démarre un hotspot Wi-Fi sur Windows"""
    
    total_steps = 5
    
    # Étape 1: Vérifier les privilèges admin
    log_step(1, total_steps, "Vérification des privilèges administrateur...")
    if not is_admin():
        log_error("Ce script nécessite les droits administrateur !")
        log_info("Relancez avec: clic droit → 'Exécuter en tant qu'administrateur'")
        print(f"\n  {Colors.YELLOW}💡 Ou dans PowerShell:{Colors.RESET}")
        print(f"     Start-Process python -ArgumentList 'create_wifi.py' -Verb RunAs\n")
        return False
    log_success("Privilèges administrateur confirmés")
    
    # Étape 2: Vérifier le support hosted network
    log_step(2, total_steps, "Vérification du support Wi-Fi Direct / Hosted Network...")
    supported, driver_info = check_hosted_network_support()
    
    # On tente quand même avec le Mobile Hotspot de Windows 10/11
    log_info("Tentative de configuration via netsh...")
    
    # Étape 3: Configurer le hotspot
    log_step(3, total_steps, f"Configuration du hotspot '{ssid}'...")
    
    config_result = subprocess.run(
        f'netsh wlan set hostednetwork mode=allow ssid="{ssid}" key="{key}"',
        capture_output=True, text=True, shell=True,
        encoding='utf-8', errors='replace'
    )
    
    if config_result.returncode != 0:
        log_warn("netsh hostednetwork non disponible, tentative via Mobile Hotspot...")
        return create_mobile_hotspot(ssid, key)
    
    log_success(f"SSID configuré : {Colors.BOLD}{ssid}{Colors.RESET}")
    log_success(f"Mot de passe   : {Colors.BOLD}{key}{Colors.RESET}")
    
    # Étape 4: Démarrer le hotspot
    log_step(4, total_steps, "Démarrage du hotspot...")
    
    start_result = subprocess.run(
        'netsh wlan start hostednetwork',
        capture_output=True, text=True, shell=True,
        encoding='utf-8', errors='replace'
    )
    
    if start_result.returncode != 0:
        log_warn("Impossible via hostednetwork, tentative via Mobile Hotspot Windows...")
        return create_mobile_hotspot(ssid, key)
    
    log_success("Hotspot démarré avec succès !")
    
    # Étape 5: Sauvegarder la configuration
    log_step(5, total_steps, "Sauvegarde de la configuration...")
    save_config(ssid, key)
    log_success("Configuration sauvegardée")
    
    # Résumé
    print_summary(ssid, key)
    return True

def create_mobile_hotspot(ssid, key):
    """Utilise le Mobile Hotspot intégré à Windows 10/11"""
    log_info("Configuration via Windows Mobile Hotspot (Windows 10/11)...")
    
    try:
        # Utiliser PowerShell pour configurer le Mobile Hotspot
        ps_script = f'''
        # Activer le Mobile Hotspot via les paramètres Windows
        $connectionProfile = [Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime]::GetInternetConnectionProfile()
        $tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperators,ContentType=WindowsRuntime]::CreateFromConnectionProfile($connectionProfile)
        
        # Configurer SSID et mot de passe
        $config = $tetheringManager.GetCurrentAccessPointConfiguration()
        $config.Ssid = "{ssid}"
        $config.Passphrase = "{key}"
        
        $tetheringManager.ConfigureAccessPointAsync($config).AsTask().Wait()
        $tetheringManager.StartTetheringAsync().AsTask().Wait()
        
        Write-Output "HOTSPOT_STARTED"
        '''
        
        result = subprocess.run(
            ['powershell', '-ExecutionPolicy', 'Bypass', '-Command', ps_script],
            capture_output=True, text=True,
            encoding='utf-8', errors='replace'
        )
        
        if "HOTSPOT_STARTED" in result.stdout:
            log_success("Mobile Hotspot activé via Windows !")
            save_config(ssid, key)
            print_summary(ssid, key)
            return True
        else:
            log_warn("Mobile Hotspot automatique échoué")
            log_info("Activation manuelle nécessaire:")
            print(f"""
  {Colors.YELLOW}╔════════════════════════════════════════════════════════╗
  ║  📱 Activez le Mobile Hotspot manuellement :          ║
  ║                                                        ║
  ║  1. Paramètres Windows → Réseau et Internet            ║
  ║  2. Point d'accès sans fil mobile → Activer            ║
  ║  3. SSID : {ssid:<42} ║
  ║  4. Mot de passe : {key:<36} ║
  ║                                                        ║
  ║  Le serveur vérifiera la connexion automatiquement.    ║
  ╚════════════════════════════════════════════════════════╝{Colors.RESET}
""")
            save_config(ssid, key)
            return True  # On sauve quand même la config
            
    except Exception as e:
        log_error(f"Erreur: {e}")
        log_info("Activez le hotspot manuellement depuis les paramètres Windows")
        save_config(ssid, key)
        return False

def stop_hotspot():
    """Arrête le hotspot Wi-Fi"""
    log_info("Arrêt du hotspot en cours...")
    
    result = subprocess.run(
        'netsh wlan stop hostednetwork',
        capture_output=True, text=True, shell=True,
        encoding='utf-8', errors='replace'
    )
    
    if result.returncode == 0:
        log_success("Hotspot arrêté avec succès")
    else:
        log_warn("Tentative d'arrêt via Mobile Hotspot...")
        try:
            ps_cmd = '''
            $cp = [Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime]::GetInternetConnectionProfile()
            $tm = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperators,ContentType=WindowsRuntime]::CreateFromConnectionProfile($cp)
            $tm.StopTetheringAsync().AsTask().Wait()
            '''
            subprocess.run(['powershell', '-Command', ps_cmd], capture_output=True)
            log_success("Mobile Hotspot désactivé")
        except:
            log_warn("Désactivez manuellement depuis les paramètres Windows")

def show_status():
    """Affiche le statut du hotspot et du réseau"""
    print(f"\n  {Colors.CYAN}{Colors.BOLD}═══ Statut Réseau ═══{Colors.RESET}\n")
    
    # SSID actuel
    ssid = get_current_ssid()
    if ssid:
        log_info(f"Wi-Fi connecté : {Colors.GREEN}{ssid}{Colors.RESET}")
    else:
        log_info(f"Wi-Fi : {Colors.RED}Non connecté{Colors.RESET}")
    
    # Hosted network
    result = subprocess.run(
        'netsh wlan show hostednetwork',
        capture_output=True, text=True, shell=True,
        encoding='utf-8', errors='replace'
    )
    print(f"\n  {Colors.DIM}{result.stdout}{Colors.RESET}")
    
    # Config sauvegardée
    config = load_config()
    if config:
        print(f"\n  {Colors.CYAN}Configuration sauvegardée :{Colors.RESET}")
        print(f"  ├─ SSID     : {Colors.BOLD}{config.get('ssid', 'N/A')}{Colors.RESET}")
        print(f"  ├─ Key      : {Colors.BOLD}{config.get('key', 'N/A')}{Colors.RESET}")
        print(f"  └─ IP Range : {Colors.BOLD}{config.get('ip_range', HOTSPOT_IP_RANGE)}{Colors.RESET}")

# ═══════════════════════════════════════════════════════════
#                   CONFIGURATION JSON
# ═══════════════════════════════════════════════════════════

def save_config(ssid, key):
    """Sauvegarde la configuration Wi-Fi dans un fichier JSON"""
    config = {
        "ssid": ssid,
        "key": key,
        "ip_range": HOTSPOT_IP_RANGE,
        "created_at": datetime.now().isoformat(),
        "platform": sys.platform
    }
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    return config

def load_config():
    """Charge la configuration Wi-Fi depuis le fichier JSON"""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def print_summary(ssid, key):
    """Affiche un résumé final"""
    print(f"""
  {Colors.GREEN}{Colors.BOLD}
  ╔══════════════════════════════════════════════════════════╗
  ║              🎉 HOTSPOT PRÊT À UTILISER !               ║
  ╠══════════════════════════════════════════════════════════╣
  ║                                                          ║
  ║  📡 Réseau    : {ssid:<40} ║
  ║  🔑 Mot passe : {key:<40} ║
  ║  🌐 IP Serveur: 192.168.137.1                           ║
  ║  📦 Plage IP  : 192.168.137.x                           ║
  ║                                                          ║
  ╠══════════════════════════════════════════════════════════╣
  ║                                                          ║
  ║  Prochaine étape :                                       ║
  ║  ➤ Lancez le serveur avec: npm run wifi                  ║
  ║  ➤ Ou: node wifi_server.js                               ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  {Colors.RESET}""")

# ═══════════════════════════════════════════════════════════
#                        LINUX
# ═══════════════════════════════════════════════════════════

def create_hotspot_linux(ssid, key):
    """Crée un hotspot Wi-Fi sur Linux avec nmcli"""
    log_step(1, 3, "Détection de l'interface Wi-Fi...")
    
    try:
        # Vérifier nmcli
        subprocess.run('which nmcli', shell=True, check=True, capture_output=True)
        
        log_step(2, 3, f"Création du hotspot '{ssid}'...")
        result = subprocess.run(
            f'nmcli device wifi hotspot ssid "{ssid}" password "{key}"',
            shell=True, capture_output=True, text=True
        )
        
        if result.returncode == 0:
            log_success("Hotspot créé avec succès !")
            log_step(3, 3, "Sauvegarde de la configuration...")
            save_config(ssid, key)
            print_summary(ssid, key)
            return True
        else:
            log_error(f"Erreur: {result.stderr}")
            return False
            
    except subprocess.CalledProcessError:
        log_warn("nmcli non disponible, tentative avec create_ap...")
        subprocess.run('sudo apt install create_ap -y', shell=True)
        subprocess.Popen(
            f'sudo create_ap wlan0 eth0 "{ssid}" "{key}"',
            shell=True
        )
        save_config(ssid, key)
        print_summary(ssid, key)
        return True

# ═══════════════════════════════════════════════════════════
#                     POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Urbain Mobility — Wi-Fi Hotspot Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples:
  python create_wifi.py                          Créer le hotspot par défaut
  python create_wifi.py --ssid MonWifi --key 1234 Créer avec nom personnalisé
  python create_wifi.py --stop                    Arrêter le hotspot
  python create_wifi.py --status                  Voir le statut
        """
    )
    parser.add_argument('--ssid', default=DEFAULT_SSID, help=f'Nom du réseau (défaut: {DEFAULT_SSID})')
    parser.add_argument('--key', default=DEFAULT_KEY, help=f'Mot de passe (défaut: {DEFAULT_KEY})')
    parser.add_argument('--stop', action='store_true', help='Arrêter le hotspot')
    parser.add_argument('--status', action='store_true', help='Afficher le statut')
    
    args = parser.parse_args()
    
    # Activer les couleurs sur Windows
    if sys.platform == 'win32':
        os.system('')  # Active le support ANSI sur Windows
    
    print_banner()
    
    if args.status:
        show_status()
        return
    
    if args.stop:
        stop_hotspot()
        return
    
    # Créer le hotspot
    log_info(f"Plateforme détectée : {Colors.BOLD}{sys.platform}{Colors.RESET}")
    
    if sys.platform == "win32":
        success = create_hotspot_windows(args.ssid, args.key)
    elif sys.platform.startswith("linux"):
        success = create_hotspot_linux(args.ssid, args.key)
    else:
        log_error(f"Plateforme '{sys.platform}' non supportée")
        log_info("Créez le hotspot manuellement depuis les paramètres réseau")
        save_config(args.ssid, args.key)
        success = False
    
    if not success:
        log_warn("Le hotspot n'a pas pu être créé automatiquement")
        log_info("Vous pouvez l'activer manuellement et le serveur fonctionnera quand même")

if __name__ == "__main__":
    main()
