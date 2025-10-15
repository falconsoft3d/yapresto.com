#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yapresto.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

print("=== Prueba de Login YaPresto ===\n")

print("1. Verificando que el usuario existe...")
try:
    user = User.objects.get(username='admin')
    print(f"✓ Usuario encontrado: {user.username}")
    print(f"  - Email: {user.email}")
    print(f"  - Es staff: {user.is_staff}")
    print(f"  - Es superuser: {user.is_superuser}")
    print(f"  - Está activo: {user.is_active}")
except User.DoesNotExist:
    print("✗ Usuario no encontrado")
    exit(1)

print("\n2. Verificando autenticación...")
auth_user = authenticate(username='admin', password='admin123')
if auth_user:
    print("✓ Autenticación exitosa")
    print(f"  - Usuario autenticado: {auth_user.username}")
else:
    print("✗ Fallo en autenticación")
    print("  - Verifica que la contraseña sea correcta")

print("\n3. Verificando URLs...")
from django.urls import reverse
try:
    dashboard_url = reverse('microcreditos:dashboard')
    print(f"✓ URL del dashboard: {dashboard_url}")
except:
    print("✗ Error al obtener URL del dashboard")

print("\n=== Fin de prueba ===")
print("\nSi todo está ✓, el problema puede estar en:")
print("- JavaScript en el frontend")
print("- Configuración de CSRF")
print("- Redirección después del login")