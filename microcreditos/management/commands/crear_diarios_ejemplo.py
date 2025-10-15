from django.core.management.base import BaseCommand
from microcreditos.models import Diario

class Command(BaseCommand):
    help = 'Crear diarios de ejemplo para pruebas'

    def handle(self, *args, **options):
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
        
        self.stdout.write("Creando diarios de ejemplo...")
        
        for diario_data in diarios_ejemplo:
            diario, created = Diario.objects.get_or_create(
                codigo=diario_data['codigo'],
                defaults=diario_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Creado: {diario.nombre} ({diario.codigo})")
                )
            else:
                self.stdout.write(f"- Ya existe: {diario.nombre} ({diario.codigo})")
        
        total_diarios = Diario.objects.count()
        diarios_activos = Diario.objects.filter(activo=True).count()
        diarios_inactivos = Diario.objects.filter(activo=False).count()
        
        self.stdout.write(f"\nTotal de diarios en el sistema: {total_diarios}")
        self.stdout.write(f"Diarios activos: {diarios_activos}")
        self.stdout.write(f"Diarios inactivos: {diarios_inactivos}")
        
        self.stdout.write(
            self.style.SUCCESS('Diarios de ejemplo creados exitosamente!')
        )