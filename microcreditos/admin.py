from django.contrib import admin
from .models import Cliente, Prestamo, Pago, ClienteAdjunto, ClienteMensajeInterno, ConfiguracionCredito

# Configuración del Cliente
@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'apellido', 'cedula', 'telefono', 'email', 'estado', 'fecha_registro')
    list_filter = ('estado', 'fecha_registro', 'fecha_nacimiento')
    search_fields = ('nombre', 'apellido', 'cedula', 'telefono', 'email')
    ordering = ('-fecha_registro',)
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('nombre', 'apellido', 'cedula', 'telefono', 'email', 'fecha_nacimiento')
        }),
        ('Información de Contacto', {
            'fields': ('direccion',)
        }),
        ('Estado y Configuración', {
            'fields': ('estado', 'usuario'),
            'classes': ('collapse',),
        }),
    )

# Configuración del Préstamo
@admin.register(Prestamo)
class PrestamoAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'monto', 'cuota_mensual', 'fecha_solicitud', 'fecha_aprobacion', 'estado')
    list_filter = ('estado', 'fecha_solicitud', 'fecha_aprobacion', 'tipo')
    search_fields = ('cliente__nombre', 'cliente__apellido', 'cliente__cedula')
    ordering = ('-fecha_solicitud',)
    
    fieldsets = (
        ('Información del Cliente', {
            'fields': ('cliente',)
        }),
        ('Detalles del Préstamo', {
            'fields': ('monto', 'cuota_mensual', 'plazo_meses', 'tasa_interes', 'tipo')
        }),
        ('Fechas', {
            'fields': ('fecha_solicitud', 'fecha_aprobacion', 'fecha_vencimiento')
        }),
        ('Estado y Observaciones', {
            'fields': ('estado', 'garantia', 'observaciones')
        }),
    )

# Configuración de Pagos
@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ('prestamo', 'numero_cuota', 'monto', 'fecha_vencimiento', 'fecha_pago', 'estado')
    list_filter = ('estado', 'fecha_vencimiento', 'fecha_pago')
    search_fields = ('prestamo__cliente__nombre', 'prestamo__cliente__apellido')
    ordering = ('-fecha_vencimiento',)

# Configuración de Adjuntos de Cliente
@admin.register(ClienteAdjunto)
class ClienteAdjuntoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'cliente', 'tipo', 'nombre_archivo', 'tamaño_legible', 'subido_por', 'fecha_subida', 'es_confidencial']
    list_filter = ['tipo', 'fecha_subida', 'es_confidencial', 'subido_por']
    search_fields = ['titulo', 'cliente__nombre', 'cliente__apellido', 'cliente__cedula', 'descripcion']
    readonly_fields = ['fecha_subida', 'nombre_archivo', 'tamaño_archivo', 'tamaño_legible']
    list_editable = ['es_confidencial']
    ordering = ('-fecha_subida',)
    
    def nombre_archivo(self, obj):
        return obj.nombre_archivo
    nombre_archivo.short_description = 'Archivo'

# Configuración de Mensajes Internos de Cliente
@admin.register(ClienteMensajeInterno)
class ClienteMensajeInternoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'cliente', 'tipo', 'prioridad', 'creado_por', 'fecha_creacion', 'completado', 'es_privado']
    list_filter = ['tipo', 'prioridad', 'completado', 'es_privado', 'fecha_creacion', 'creado_por']
    search_fields = ['titulo', 'mensaje', 'cliente__nombre', 'cliente__apellido', 'cliente__cedula']
    readonly_fields = ['fecha_creacion', 'fecha_completado', 'dias_desde_creacion', 'necesita_seguimiento']
    list_editable = ['completado', 'es_privado']
    date_hierarchy = 'fecha_creacion'
    ordering = ('-fecha_creacion',)
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('cliente', 'titulo', 'tipo', 'prioridad', 'mensaje')
        }),
        ('Configuración', {
            'fields': ('es_privado', 'fecha_seguimiento')
        }),
        ('Estado', {
            'fields': ('completado', 'completado_por', 'fecha_completado')
        }),
        ('Metadatos', {
            'fields': ('creado_por', 'fecha_creacion', 'dias_desde_creacion', 'necesita_seguimiento'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo objeto
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)

# Configuración de Configuración de Crédito
@admin.register(ConfiguracionCredito)
class ConfiguracionCreditoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'interes_anual', 'numero_periodos_defecto', 'tipo_calculo', 'activa', 'fecha_modificacion')
    list_filter = ('activa', 'tipo_calculo', 'fecha_creacion', 'fecha_modificacion')
    search_fields = ('nombre', 'descripcion')
    ordering = ('-activa', '-fecha_modificacion')
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'interes_mensual')
    
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'descripcion', 'activa')
        }),
        ('Configuración de Interés', {
            'fields': ('interes_anual', 'tipo_calculo'),
            'description': 'Configuración de tasas de interés y método de cálculo'
        }),
        ('Límites de Monto', {
            'fields': ('monto_minimo', 'monto_maximo'),
            'classes': ('collapse',),
        }),
        ('Límites de Períodos', {
            'fields': ('numero_periodos_defecto', 'periodos_minimos', 'periodos_maximos'),
            'classes': ('collapse',),
        }),
        ('Configuración de Pagos', {
            'fields': ('pagos_extra_permitidos',),
            'classes': ('collapse',),
        }),
        ('Comisiones y Gastos', {
            'fields': ('comision_apertura', 'gastos_administrativos'),
            'classes': ('collapse',),
        }),
        ('Metadatos', {
            'fields': ('creado_por', 'fecha_creacion', 'fecha_modificacion', 'interes_mensual'),
            'classes': ('collapse',),
        }),
    )
    
    def interes_mensual(self, obj):
        """Muestra el interés mensual calculado"""
        return f"{obj.interes_mensual:.2f}%"
    interes_mensual.short_description = "Interés Mensual"
    
    def save_model(self, request, obj, form, change):
        """Asigna automáticamente el usuario que crea la configuración"""
        if not change:  # Si es un objeto nuevo
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)
