#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yapresto.settings')
django.setup()

from microcreditos.models import Diario

def crear_diarios_ejemplo():
    """Crear diarios de ejemplo para pruebas"""
    
    diarios_ejemplo = [
        {
            'nombre': 'Efectivo',
            'codigo': 'EFE',
            'descripcion': 'Movimientos en dinero efectivo',
            'activo': True
        },
        {
            'nombre': 'Banco Central',
            'codigo': 'BCO',
            'descripcion': 'Cuenta corriente en banco principal',
            'activo': True
        },
        {
            'nombre': 'Tarjeta de Crédito',
            'codigo': 'TJT',
            'descripcion': 'Pagos con tarjeta de crédito y débito',
            'activo': True
        },
        {
            'nombre': 'Cheques',
            'codigo': 'CHQ',
            'descripcion': 'Pagos y cobros con cheques',
            'activo': True
        },
        {
            'nombre': 'Transferencias',
            'codigo': 'TRF',
            'descripcion': 'Transferencias bancarias electrónicas',
            'activo': True
        },
        {
            'nombre': 'Caja Chica',
            'codigo': 'CCH',
            'descripcion': 'Fondo de caja chica para gastos menores',
            'activo': False
        }
    ]
    
    print("Creando diarios de ejemplo...")
    
    for diario_data in diarios_ejemplo:
        diario, created = Diario.objects.get_or_create(
            codigo=diario_data['codigo'],
            defaults=diario_data
        )
        
        if created:
            print(f"✓ Creado: {diario.nombre} ({diario.codigo})")
        else:
            print(f"- Ya existe: {diario.nombre} ({diario.codigo})")
    
    print(f"\nTotal de diarios en el sistema: {Diario.objects.count()}")
    print(f"Diarios activos: {Diario.objects.filter(activo=True).count()}")
    print(f"Diarios inactivos: {Diario.objects.filter(activo=False).count()}")

if __name__ == '__main__':
    crear_diarios_ejemplo()