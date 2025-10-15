import requests
import re
from urllib.parse import urljoin

base_url = "http://127.0.0.1:8000"
login_url = urljoin(base_url, "/accounts/login/")

# Crear sesión
session = requests.Session()

print("1. Obteniendo página de login...")
response = session.get(login_url)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    # Extraer CSRF token
    csrf_match = re.search(r'name="csrfmiddlewaretoken" value="([^"]+)"', response.text)
    if csrf_match:
        csrf_token = csrf_match.group(1)
        print(f"2. CSRF token obtenido: {csrf_token[:10]}...")
        
        # Hacer login
        login_data = {
            'username': 'admin',
            'password': 'admin123',
            'csrfmiddlewaretoken': csrf_token
        }
        
        print("3. Intentando login...")
        response = session.post(login_url, data=login_data, allow_redirects=False)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 302:
            print(f"✓ Redirección a: {response.headers.get('Location')}")
            
            # Seguir la redirección
            redirect_url = response.headers.get('Location')
            if redirect_url:
                print("4. Siguiendo redirección...")
                final_response = session.get(urljoin(base_url, redirect_url))
                print(f"Status final: {final_response.status_code}")
                print(f"URL final: {final_response.url}")
                
                if "dashboard" in final_response.url:
                    print("✓ ¡Login exitoso! Dashboard cargado.")
                else:
                    print("✗ Login falló o no redirigió al dashboard")
            else:
                print("✗ No se encontró URL de redirección")
        else:
            print(f"✗ Login falló. Status: {response.status_code}")
            print("Response:", response.text[:200])
    else:
        print("✗ No se pudo encontrar CSRF token")
else:
    print(f"✗ Error al cargar página de login: {response.status_code}")