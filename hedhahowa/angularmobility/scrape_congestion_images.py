import os
import requests
from duckduckgo_search import DDGS
import time

def download_images(query, folder_path, max_images=5):
    os.makedirs(folder_path, exist_ok=True)
    print(f"[{query}] Recherche d'images en cours...")
    
    try:
        with DDGS() as ddgs:
            results = ddgs.images(query, safesearch='off', max_results=max_images)
            if not results:
                print("Aucune image trouvée.")
                return
                
            count = 0
            for i, res in enumerate(results):
                image_url = res.get('image')
                if not image_url: continue
                
                try:
                    # Request timeout prevents hanging
                    img_data = requests.get(image_url, timeout=5).content
                    
                    # Estimate extension
                    ext = image_url.split('.')[-1].split('?')[0]
                    if len(ext) > 4 or not ext.isalpha():
                        ext = "jpg"
                        
                    # File naming
                    filename = os.path.join(folder_path, f"{query.replace(' ', '_')}_{i}.{ext}")
                    with open(filename, 'wb') as handler:
                        handler.write(img_data)
                        
                    print(f" -> OK: {os.path.basename(filename)}")
                    count += 1
                    time.sleep(0.5)
                except Exception as e:
                    print(f" -> KO: {image_url} (Erreur de téléchargement)")
                    
            print(f"[{query}] Succès: {count} images téléchargées.\n")
    except Exception as e:
        print(f"⚠️ Erreur avec DDGS pour {query}: {e}")

if __name__ == "__main__":
    base_folder = r"C:\Users\USER\Desktop\hedhahowa\angularmobility\assets\congestion_images"
    print(f"🚀 Début du scraping dans : {base_folder}\n")
    
    cities = ["Paris", "Lyon"]
    years = ["2019", "2020", "2021", "2022", "2023", "2024", "2025"]
    
    # On va télécharger 3 images pour chaque ville et chaque année
    for city in cities:
        for year in years:
            query = f"traffic congestion bouchon {city} {year}"
            download_images(query, os.path.join(base_folder, city), max_images=3)
            
    print("✨ Scraping terminé ! Toutes les images ont été sauvegardées.")
