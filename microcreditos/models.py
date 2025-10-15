from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import os

class Cliente(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('moroso', 'Moroso'),
    ]
    
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    cedula = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=15)
    email = models.EmailField()
    direccion = models.TextField()
    fecha_nacimiento = models.DateField()
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    score_crediticio = models.IntegerField(default=500)
    fecha_registro = models.DateTimeField(default=timezone.now)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    def __str__(self):
        return f"{self.nombre} {self.apellido}"
    
    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"
    
    class Meta:
        verbose_name_plural = "Clientes"

class Prestamo(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('activo', 'Activo'),
        ('completado', 'Completado'),
        ('vencido', 'Vencido'),
    ]
    
    TIPO_CHOICES = [
        ('personal', 'Personal'),
        ('comercial', 'Comercial'),
        ('emergencia', 'Emergencia'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='prestamos')
    configuracion_credito = models.ForeignKey('ConfiguracionCredito', on_delete=models.PROTECT, null=True, blank=True, help_text="Configuración de crédito utilizada")
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tasa_interes = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('15.00'))
    plazo_meses = models.IntegerField()
    cuota_mensual = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES, default='personal')
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(default=timezone.now)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    garantia = models.TextField(blank=True)
    observaciones = models.TextField(blank=True)
    
    def __str__(self):
        return f"Préstamo {self.id} - {self.cliente.nombre_completo}"
    
    @property
    def monto_total(self):
        return self.monto * (1 + (self.tasa_interes / 100))
    
    @property
    def saldo_pendiente(self):
        pagos_realizados = sum(pago.monto for pago in self.pagos.filter(estado='completado'))
        return self.monto_total - pagos_realizados
    
    def generar_tabla_amortizacion(self):
        """Genera la tabla de amortización del préstamo"""
        tabla = []
        balance = float(self.monto)
        tasa_mensual = float(self.tasa_interes) / 100 / 12
        cuota_mensual = float(self.cuota_mensual)
        
        # Fecha inicial
        from datetime import datetime, timedelta
        if self.fecha_aprobacion:
            fecha_actual = self.fecha_aprobacion.date()
        else:
            fecha_actual = self.fecha_solicitud.date()
        
        for numero_cuota in range(1, self.plazo_meses + 1):
            # Calcular interés del período
            interes_periodo = balance * tasa_mensual
            
            # Calcular capital (abono a capital)
            capital_periodo = cuota_mensual - interes_periodo
            
            # Asegurar que el último pago no genere balance negativo
            if numero_cuota == self.plazo_meses:
                capital_periodo = balance
                cuota_real = capital_periodo + interes_periodo
            else:
                cuota_real = cuota_mensual
            
            # Calcular nuevo balance
            nuevo_balance = max(0, balance - capital_periodo)
            
            # Fecha del pago (primer día del mes siguiente)
            fecha_pago = fecha_actual.replace(day=1) + timedelta(days=32)
            fecha_pago = fecha_pago.replace(day=1)
            fecha_actual = fecha_pago
            
            tabla.append({
                'numero': numero_cuota,
                'fecha_pago': fecha_pago,
                'fecha_vencimiento': fecha_pago,  # Alias para compatibilidad
                'balance_inicial': round(balance, 2),
                'cuota_programada': round(cuota_mensual, 2),
                'cuota_real': round(cuota_real, 2),
                'cuota': round(cuota_real, 2),  # Alias para compatibilidad
                'capital': round(capital_periodo, 2),
                'interes': round(interes_periodo, 2),
                'balance_final': round(nuevo_balance, 2),
                'saldo': round(nuevo_balance, 2),  # Alias para compatibilidad
            })
            
            balance = nuevo_balance
            
            # Si el balance llega a 0, terminar
            if balance <= 0:
                break
        
        return tabla
    
    class Meta:
        verbose_name_plural = "Préstamos"

class Pago(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('completado', 'Completado'),
        ('vencido', 'Vencido'),
        ('parcial', 'Parcial'),
    ]
    
    prestamo = models.ForeignKey(Prestamo, on_delete=models.CASCADE, related_name='pagos')
    numero_cuota = models.IntegerField()
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_vencimiento = models.DateField()
    fecha_pago = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    mora = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    observaciones = models.TextField(blank=True)
    
    def __str__(self):
        return f"Cuota {self.numero_cuota} - {self.prestamo}"
    
    @property
    def dias_vencido(self):
        if self.estado == 'vencido' and timezone.now().date() > self.fecha_vencimiento:
            return (timezone.now().date() - self.fecha_vencimiento).days
        return 0
    
    class Meta:
        verbose_name_plural = "Pagos"
        ordering = ['numero_cuota']


class RegistroPago(models.Model):
    """Modelo para registrar los pagos realizados por los clientes"""
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('cheque', 'Cheque'),
        ('tarjeta', 'Tarjeta'),
    ]
    
    prestamo = models.ForeignKey(Prestamo, on_delete=models.CASCADE, related_name='registros_pago')
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='pagos_realizados')
    diario = models.ForeignKey('Diario', on_delete=models.CASCADE, related_name='movimientos_pago', null=True, blank=True)
    
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES, default='efectivo')
    fecha_pago = models.DateTimeField(auto_now_add=True)
    
    # Referencia del pago (número de cheque, referencia de transferencia, etc.)
    referencia = models.CharField(max_length=100, blank=True)
    observaciones = models.TextField(blank=True)
    
    # Cuotas que se pagaron con este registro
    cuotas_pagadas = models.ManyToManyField(Pago, through='DetallePagoCuota')
    
    # Usuario que registró el pago
    registrado_por = models.ForeignKey('auth.User', on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"Pago ${self.monto_pagado} - {self.cliente.nombre_completo} - {self.fecha_pago.strftime('%d/%m/%Y')}"
    
    @property
    def total_cuotas_pagadas(self):
        return self.cuotas_pagadas.count()
    
    class Meta:
        verbose_name = "Registro de Pago"
        verbose_name_plural = "Registros de Pagos"
        ordering = ['-fecha_pago']


class DetallePagoCuota(models.Model):
    """Modelo intermedio para rastrear qué cuotas se pagaron con cada registro de pago"""
    registro_pago = models.ForeignKey(RegistroPago, on_delete=models.CASCADE)
    cuota = models.ForeignKey(Pago, on_delete=models.CASCADE)
    monto_aplicado = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_aplicacion = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"${self.monto_aplicado} aplicado a cuota {self.cuota.numero_cuota}"
    
    class Meta:
        verbose_name = "Detalle Pago-Cuota"
        verbose_name_plural = "Detalles Pago-Cuota"
        unique_together = ['registro_pago', 'cuota']

class Reporte(models.Model):
    TIPO_CHOICES = [
        ('diario', 'Diario'),
        ('semanal', 'Semanal'),
        ('mensual', 'Mensual'),
        ('anual', 'Anual'),
    ]
    
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    total_prestamos = models.IntegerField(default=0)
    monto_total = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    pagos_recibidos = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    mora_total = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    fecha_generacion = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.titulo} - {self.fecha_inicio} a {self.fecha_fin}"
    
    class Meta:
        verbose_name_plural = "Reportes"
        ordering = ['-fecha_generacion']

class ClienteAdjunto(models.Model):
    """Modelo para manejar archivos adjuntos de clientes"""
    TIPO_CHOICES = [
        ('cedula', 'Cédula de Identidad'),
        ('comprobante_ingresos', 'Comprobante de Ingresos'),
        ('referencias_comerciales', 'Referencias Comerciales'),
        ('referencias_personales', 'Referencias Personales'),
        ('contrato', 'Contrato'),
        ('garantia', 'Garantía'),
        ('otros', 'Otros Documentos'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='adjuntos')
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, default='otros')
    archivo = models.FileField(upload_to='clientes/adjuntos/%Y/%m/%d/')
    descripcion = models.TextField(blank=True)
    fecha_subida = models.DateTimeField(default=timezone.now)
    subido_por = models.ForeignKey(User, on_delete=models.CASCADE)
    es_confidencial = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.cliente.nombre_completo} - {self.titulo}"
    
    @property
    def nombre_archivo(self):
        return os.path.basename(self.archivo.name)
    
    @property
    def tamaño_archivo(self):
        if self.archivo:
            try:
                return self.archivo.size
            except:
                return 0
        return 0
    
    @property
    def tamaño_legible(self):
        size = self.tamaño_archivo
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    
    class Meta:
        verbose_name_plural = "Adjuntos de Clientes"
        ordering = ['-fecha_subida']

class ClienteMensajeInterno(models.Model):
    """Modelo para mensajes internos sobre clientes"""
    TIPO_CHOICES = [
        ('nota', 'Nota General'),
        ('seguimiento', 'Seguimiento'),
        ('incidencia', 'Incidencia'),
        ('recordatorio', 'Recordatorio'),
        ('evaluacion', 'Evaluación Crediticia'),
        ('contacto', 'Contacto Cliente'),
    ]
    
    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='mensajes_internos')
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='nota')
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    mensaje = models.TextField()
    fecha_creacion = models.DateTimeField(default=timezone.now)
    creado_por = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mensajes_creados')
    es_privado = models.BooleanField(default=False)
    fecha_seguimiento = models.DateTimeField(null=True, blank=True)
    completado = models.BooleanField(default=False)
    fecha_completado = models.DateTimeField(null=True, blank=True)
    completado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='mensajes_completados')
    
    def __str__(self):
        return f"{self.cliente.nombre_completo} - {self.titulo}"
    
    def marcar_completado(self, usuario):
        """Marca el mensaje como completado"""
        self.completado = True
        self.fecha_completado = timezone.now()
        self.completado_por = usuario
        self.save()
    
    @property
    def dias_desde_creacion(self):
        return (timezone.now() - self.fecha_creacion).days
    
    @property
    def necesita_seguimiento(self):
        if self.fecha_seguimiento and not self.completado:
            return timezone.now() >= self.fecha_seguimiento
        return False
    
    class Meta:
        verbose_name_plural = "Mensajes Internos de Clientes"
        ordering = ['-fecha_creacion']

class ConfiguracionCredito(models.Model):
    """Modelo para la configuración de créditos del sistema"""
    TIPO_CALCULO_CHOICES = [
        ('estandar', 'Estándar'),
        ('frances', 'Francés'),
        ('aleman', 'Alemán'),
        ('americano', 'Americano'),
    ]
    
    # Información básica
    nombre = models.CharField(max_length=200, default="Configuración Principal")
    descripcion = models.TextField(blank=True, help_text="Descripción de esta configuración de crédito")
    
    # Configuración de interés
    interes_anual = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('15.00'),
        help_text="Tasa de interés anual en porcentaje (ej: 15.00 para 15%)"
    )
    
    # Configuración de períodos
    numero_periodos_defecto = models.IntegerField(
        default=12,
        help_text="Número de períodos (cuotas) por defecto para nuevos préstamos"
    )
    
    # Pagos extra permitidos
    pagos_extra_permitidos = models.BooleanField(
        default=True,
        help_text="Permitir pagos adicionales al monto de la cuota"
    )
    
    # Tipo de cálculo
    tipo_calculo = models.CharField(
        max_length=20,
        choices=TIPO_CALCULO_CHOICES,
        default='estandar',
        help_text="Método de cálculo de cuotas"
    )
    
    # Configuraciones adicionales
    monto_minimo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('1000.00'),
        help_text="Monto mínimo de préstamo"
    )
    
    monto_maximo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('100000.00'),
        help_text="Monto máximo de préstamo"
    )
    
    periodos_minimos = models.IntegerField(
        default=1,
        help_text="Número mínimo de períodos (cuotas)"
    )
    
    periodos_maximos = models.IntegerField(
        default=60,
        help_text="Número máximo de períodos (cuotas)"
    )
    
    # Comisiones y gastos
    comision_apertura = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Comisión de apertura en porcentaje"
    )
    
    gastos_administrativos = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Gastos administrativos fijos"
    )
    
    # Control de activación
    activa = models.BooleanField(
        default=True,
        help_text="Configuración activa en el sistema"
    )
    
    # Metadatos
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey(User, on_delete=models.CASCADE, related_name='configuraciones_credito')
    
    def __str__(self):
        return f"{self.nombre} - {self.interes_anual}% anual"
    
    @property
    def interes_mensual(self):
        """Calcula el interés mensual basado en el anual"""
        return self.interes_anual / 12
    
    @classmethod
    def get_configuracion_activa(cls):
        """Obtiene la configuración activa principal"""
        return cls.objects.filter(activa=True).first()
    
    def calcular_cuota(self, monto, periodos=None):
        """Calcula la cuota mensual según el tipo de cálculo"""
        if periodos is None:
            periodos = self.numero_periodos_defecto
            
        monto = float(monto)  # Asegurar que sea float para cálculos
        
        if self.tipo_calculo == 'estandar':
            # Cálculo estándar: monto + interés / períodos
            interes_total = monto * (float(self.interes_anual) / 100)
            return (monto + interes_total) / periodos
        elif self.tipo_calculo == 'frances':
            # Sistema francés: cuota fija usando la fórmula correcta
            tasa_mensual = float(self.interes_anual) / 100 / 12
            if tasa_mensual == 0:
                return monto / periodos
            
            # Fórmula francesa: C = P * [i * (1+i)^n] / [(1+i)^n - 1]
            factor_potencia = (1 + tasa_mensual) ** periodos
            factor = (tasa_mensual * factor_potencia) / (factor_potencia - 1)
            cuota = monto * factor
            
            return round(cuota, 2)
        else:
            # Para otros tipos, usar el estándar por ahora
            interes_total = monto * (float(self.interes_anual) / 100)
            return (monto + interes_total) / periodos
    
    def validar_monto(self, monto):
        """Valida si un monto está dentro de los límites"""
        return self.monto_minimo <= monto <= self.monto_maximo
    
    def validar_periodos(self, periodos):
        """Valida si el número de períodos está dentro de los límites"""
        return self.periodos_minimos <= periodos <= self.periodos_maximos
    
    class Meta:
        verbose_name = "Configuración de Crédito"
        verbose_name_plural = "Configuraciones de Crédito"
        ordering = ['-activa', '-fecha_modificacion']


class Diario(models.Model):
    """Modelo para diarios contables/formas de pago"""
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, help_text="Descripción opcional del diario")
    codigo = models.CharField(max_length=20, unique=True, help_text="Código único del diario")
    activo = models.BooleanField(default=True, help_text="Indica si el diario está activo")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    class Meta:
        verbose_name = "Diario"
        verbose_name_plural = "Diarios"
        ordering = ['codigo', 'nombre']
