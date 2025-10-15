from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Cliente, Prestamo, Pago, ClienteAdjunto, ClienteMensajeInterno, ConfiguracionCredito, Diario, RegistroPago

class ClienteForm(forms.ModelForm):
    class Meta:
        model = Cliente
        fields = ['nombre', 'apellido', 'cedula', 'telefono', 'email', 'direccion', 
                 'fecha_nacimiento', 'estado', 'score_crediticio', 'avatar']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control'}),
            'apellido': forms.TextInput(attrs={'class': 'form-control'}),
            'cedula': forms.TextInput(attrs={'class': 'form-control'}),
            'telefono': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'direccion': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'fecha_nacimiento': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'estado': forms.Select(attrs={'class': 'form-control'}),
            'score_crediticio': forms.NumberInput(attrs={'class': 'form-control', 'min': 300, 'max': 850}),
            'avatar': forms.FileInput(attrs={'class': 'form-control'}),
        }

class PrestamoForm(forms.ModelForm):
    class Meta:
        model = Prestamo
        fields = ['cliente', 'monto', 'tasa_interes', 'plazo_meses', 'cuota_mensual', 
                 'tipo', 'garantia', 'observaciones']
        widgets = {
            'cliente': forms.Select(attrs={'class': 'form-control'}),
            'monto': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'tasa_interes': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'plazo_meses': forms.NumberInput(attrs={'class': 'form-control', 'min': 1, 'max': 60}),
            'cuota_mensual': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'tipo': forms.Select(attrs={'class': 'form-control'}),
            'garantia': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'observaciones': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cliente'].queryset = Cliente.objects.filter(estado='activo')

class PagoForm(forms.ModelForm):
    class Meta:
        model = Pago
        fields = ['monto', 'observaciones']
        widgets = {
            'monto': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'observaciones': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

class CreditoForm(forms.ModelForm):
    """Formulario mejorado para créditos que usa configuraciones predefinidas"""
    
    # Campos adicionales para cálculo
    configuracion = forms.ModelChoiceField(
        queryset=ConfiguracionCredito.objects.filter(activa=True),
        empty_label="Seleccione una configuración",
        widget=forms.Select(attrs={'class': 'form-control', 'id': 'id_configuracion'}),
        help_text="Configuración de crédito que define tasas, períodos y límites"
    )
    
    class Meta:
        model = Prestamo
        fields = ['cliente', 'configuracion', 'monto', 'plazo_meses', 'tipo', 'garantia', 'observaciones']
        widgets = {
            'cliente': forms.Select(attrs={'class': 'form-control'}),
            'monto': forms.NumberInput(attrs={
                'class': 'form-control', 
                'step': '0.01',
                'id': 'id_monto',
                'min': '0'
            }),
            'plazo_meses': forms.NumberInput(attrs={
                'class': 'form-control', 
                'min': 1, 
                'max': 60,
                'id': 'id_plazo_meses'
            }),
            'tipo': forms.Select(attrs={'class': 'form-control'}),
            'garantia': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'observaciones': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cliente'].queryset = Cliente.objects.filter(estado='activo')
        
        # Hacer que algunos campos sean de solo lectura
        self.fields['tasa_interes'] = forms.DecimalField(
            widget=forms.NumberInput(attrs={
                'class': 'form-control', 
                'readonly': True,
                'id': 'id_tasa_interes'
            }),
            required=False,
            help_text="Se calcula automáticamente según la configuración"
        )
        
        self.fields['cuota_mensual'] = forms.DecimalField(
            widget=forms.NumberInput(attrs={
                'class': 'form-control', 
                'readonly': True,
                'id': 'id_cuota_mensual'
            }),
            required=False,
            help_text="Se calcula automáticamente según monto y plazo"
        )

    def clean(self):
        cleaned_data = super().clean()
        configuracion = cleaned_data.get('configuracion')
        monto = cleaned_data.get('monto')
        plazo_meses = cleaned_data.get('plazo_meses')

        if configuracion and monto and plazo_meses:
            # Validar monto dentro de los límites
            if not configuracion.validar_monto(monto):
                self.add_error('monto', f'El monto debe estar entre ${configuracion.monto_minimo} y ${configuracion.monto_maximo}')
            
            # Validar períodos dentro de los límites
            if not configuracion.validar_periodos(plazo_meses):
                self.add_error('plazo_meses', f'El plazo debe estar entre {configuracion.periodos_minimos} y {configuracion.periodos_maximos} meses')
            
            # Calcular automáticamente tasa de interés y cuota mensual
            if 'tasa_interes' not in self.errors and 'monto' not in self.errors and 'plazo_meses' not in self.errors:
                cleaned_data['tasa_interes'] = configuracion.interes_anual
                cleaned_data['cuota_mensual'] = configuracion.calcular_cuota(monto, plazo_meses)
                cleaned_data['configuracion_credito'] = configuracion

        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Asignar la configuración de crédito al préstamo
        if hasattr(self, 'cleaned_data') and 'configuracion' in self.cleaned_data:
            instance.configuracion_credito = self.cleaned_data['configuracion']
            instance.tasa_interes = self.cleaned_data.get('tasa_interes', instance.tasa_interes)
            instance.cuota_mensual = self.cleaned_data.get('cuota_mensual', instance.cuota_mensual)
        
        if commit:
            instance.save()
        return instance

class ClienteAdjuntoForm(forms.ModelForm):
    """Formulario para subir adjuntos de clientes"""
    class Meta:
        model = ClienteAdjunto
        fields = ['titulo', 'tipo', 'archivo', 'descripcion', 'es_confidencial']
        widgets = {
            'titulo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Cédula del cliente, Comprobante de ingresos...'
            }),
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'archivo': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Descripción adicional del documento (opcional)'
            }),
            'es_confidencial': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
        labels = {
            'titulo': 'Título del Documento',
            'tipo': 'Tipo de Documento',
            'archivo': 'Archivo',
            'descripcion': 'Descripción',
            'es_confidencial': 'Documento Confidencial',
        }

class ClienteMensajeInternoForm(forms.ModelForm):
    """Formulario para crear mensajes internos de clientes"""
    class Meta:
        model = ClienteMensajeInterno
        fields = ['titulo', 'tipo', 'prioridad', 'mensaje', 'es_privado', 'fecha_seguimiento']
        widgets = {
            'titulo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Seguimiento de pago, Cambio de contacto...'
            }),
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'prioridad': forms.Select(attrs={'class': 'form-select'}),
            'mensaje': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Escriba aquí el mensaje o nota interna...'
            }),
            'es_privado': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'fecha_seguimiento': forms.DateTimeInput(attrs={
                'class': 'form-control',
                'type': 'datetime-local'
            }),
        }
        labels = {
            'titulo': 'Título del Mensaje',
            'tipo': 'Tipo de Mensaje',
            'prioridad': 'Prioridad',
            'mensaje': 'Mensaje',
            'es_privado': 'Mensaje Privado',
            'fecha_seguimiento': 'Fecha de Seguimiento (opcional)',
        }

class ClienteMensajeInternoFiltroForm(forms.Form):
    """Formulario para filtrar mensajes internos"""
    TIPO_FILTRO_CHOICES = [
        ('', 'Todos los tipos'),
        ('nota', 'Nota General'),
        ('seguimiento', 'Seguimiento'),
        ('incidencia', 'Incidencia'),
        ('recordatorio', 'Recordatorio'),
        ('evaluacion', 'Evaluación Crediticia'),
        ('contacto', 'Contacto Cliente'),
    ]
    
    PRIORIDAD_FILTRO_CHOICES = [
        ('', 'Todas las prioridades'),
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    ESTADO_FILTRO_CHOICES = [
        ('', 'Todos'),
        ('pendiente', 'Pendientes'),
        ('completado', 'Completados'),
        ('seguimiento', 'Necesitan Seguimiento'),
    ]
    
    tipo = forms.ChoiceField(
        choices=TIPO_FILTRO_CHOICES,
        required=False,
        widget=forms.Select(attrs={'class': 'form-select form-select-sm'})
    )
    prioridad = forms.ChoiceField(
        choices=PRIORIDAD_FILTRO_CHOICES,
        required=False,
        widget=forms.Select(attrs={'class': 'form-select form-select-sm'})
    )
    estado = forms.ChoiceField(
        choices=ESTADO_FILTRO_CHOICES,
        required=False,
        widget=forms.Select(attrs={'class': 'form-select form-select-sm'})
    )
    fecha_desde = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'class': 'form-control form-control-sm', 'type': 'date'})
    )
    fecha_hasta = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'class': 'form-control form-control-sm', 'type': 'date'})
    )

class ConfiguracionCreditoForm(forms.ModelForm):
    """Formulario para configuración de crédito con Bootstrap styling"""
    
    class Meta:
        model = ConfiguracionCredito
        fields = [
            'nombre', 'descripcion', 'interes_anual', 'numero_periodos_defecto',
            'pagos_extra_permitidos', 'tipo_calculo', 'monto_minimo', 'monto_maximo',
            'periodos_minimos', 'periodos_maximos', 'comision_apertura', 
            'gastos_administrativos', 'activa'
        ]
        
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre de la configuración'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Descripción opcional de esta configuración'
            }),
            'interes_anual': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'min': '0',
                'max': '100',
                'placeholder': '15.00'
            }),
            'numero_periodos_defecto': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '1',
                'max': '120',
                'placeholder': '12'
            }),
            'pagos_extra_permitidos': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'tipo_calculo': forms.Select(attrs={
                'class': 'form-select'
            }),
            'monto_minimo': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'min': '0',
                'placeholder': '1000.00'
            }),
            'monto_maximo': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'min': '0',
                'placeholder': '100000.00'
            }),
            'periodos_minimos': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '1',
                'placeholder': '1'
            }),
            'periodos_maximos': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '1',
                'placeholder': '60'
            }),
            'comision_apertura': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'min': '0',
                'max': '100',
                'placeholder': '0.00'
            }),
            'gastos_administrativos': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'min': '0',
                'placeholder': '0.00'
            }),
            'activa': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
        }
        
        labels = {
            'nombre': 'Nombre de la Configuración',
            'descripcion': 'Descripción',
            'interes_anual': 'Tasa de Interés Anual (%)',
            'numero_periodos_defecto': 'Número de Períodos por Defecto',
            'pagos_extra_permitidos': 'Permitir Pagos Extra',
            'tipo_calculo': 'Tipo de Cálculo',
            'monto_minimo': 'Monto Mínimo',
            'monto_maximo': 'Monto Máximo',
            'periodos_minimos': 'Períodos Mínimos',
            'periodos_maximos': 'Períodos Máximos',
            'comision_apertura': 'Comisión de Apertura (%)',
            'gastos_administrativos': 'Gastos Administrativos',
            'activa': 'Configuración Activa',
        }
        
        help_texts = {
            'interes_anual': 'Ejemplo: 15.00 para 15% anual',
            'numero_periodos_defecto': 'Número de cuotas por defecto para nuevos préstamos',
            'tipo_calculo': 'Método de cálculo de las cuotas',
            'monto_minimo': 'Monto mínimo permitido para préstamos',
            'monto_maximo': 'Monto máximo permitido para préstamos',
            'comision_apertura': 'Porcentaje de comisión sobre el monto del préstamo',
            'gastos_administrativos': 'Monto fijo de gastos administrativos',
        }

    def clean(self):
        """Validaciones adicionales del formulario"""
        cleaned_data = super().clean()
        
        # Validar que el monto mínimo sea menor que el máximo
        monto_minimo = cleaned_data.get('monto_minimo')
        monto_maximo = cleaned_data.get('monto_maximo')
        
        if monto_minimo and monto_maximo:
            if monto_minimo >= monto_maximo:
                raise forms.ValidationError(
                    'El monto mínimo debe ser menor que el monto máximo.'
                )
        
        # Validar que los períodos mínimos sean menores que los máximos
        periodos_minimos = cleaned_data.get('periodos_minimos')
        periodos_maximos = cleaned_data.get('periodos_maximos')
        
        if periodos_minimos and periodos_maximos:
            if periodos_minimos >= periodos_maximos:
                raise forms.ValidationError(
                    'Los períodos mínimos deben ser menores que los períodos máximos.'
                )
        
        # Validar que el número de períodos por defecto esté dentro del rango
        numero_periodos_defecto = cleaned_data.get('numero_periodos_defecto')
        if numero_periodos_defecto and periodos_minimos and periodos_maximos:
            if not (periodos_minimos <= numero_periodos_defecto <= periodos_maximos):
                raise forms.ValidationError(
                    'El número de períodos por defecto debe estar entre los períodos mínimos y máximos.'
                )
        
        return cleaned_data

    def clean_interes_anual(self):
        """Validación específica para la tasa de interés"""
        interes_anual = self.cleaned_data.get('interes_anual')
        
        if interes_anual is not None:
            if interes_anual < 0:
                raise forms.ValidationError('La tasa de interés no puede ser negativa.')
            if interes_anual > 100:
                raise forms.ValidationError('La tasa de interés no puede ser mayor a 100%.')
        
        return interes_anual

    def clean_comision_apertura(self):
        """Validación específica para la comisión de apertura"""
        comision_apertura = self.cleaned_data.get('comision_apertura')
        
        if comision_apertura is not None:
            if comision_apertura < 0:
                raise forms.ValidationError('La comisión de apertura no puede ser negativa.')
            if comision_apertura > 100:
                raise forms.ValidationError('La comisión de apertura no puede ser mayor a 100%.')
        
        return comision_apertura


class DiarioForm(forms.ModelForm):
    """Formulario para crear y editar diarios"""
    
    class Meta:
        model = Diario
        fields = ['nombre', 'codigo', 'descripcion', 'activo']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del diario (ej: Efectivo, Banco, Tarjeta)'
            }),
            'codigo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Código único (ej: EFE, BCO, TJT)'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Descripción opcional del diario'
            }),
            'activo': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }
        help_texts = {
            'codigo': 'Código único de 2-20 caracteres para identificar el diario',
            'activo': 'Marque si el diario está disponible para usar'
        }
    
    def clean_codigo(self):
        """Validar que el código sea único y en mayúsculas"""
        codigo = self.cleaned_data.get('codigo')
        if codigo:
            codigo = codigo.upper().strip()
            
            # Verificar que no exista otro diario con el mismo código (excepto el actual si estamos editando)
            existing = Diario.objects.filter(codigo=codigo)
            if self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise forms.ValidationError('Ya existe un diario con este código.')
        
        return codigo
    
    def clean_nombre(self):
        """Validar que el nombre sea único"""
        nombre = self.cleaned_data.get('nombre')
        if nombre:
            nombre = nombre.strip()
            
            # Verificar que no exista otro diario con el mismo nombre (excepto el actual si estamos editando)
            existing = Diario.objects.filter(nombre__iexact=nombre)
            if self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise forms.ValidationError('Ya existe un diario con este nombre.')
        
        return nombre


class RegistroPagoForm(forms.ModelForm):
    """Formulario para registrar pagos de créditos"""
    
    cliente = forms.ModelChoiceField(
        queryset=Cliente.objects.filter(estado='activo'),
        empty_label="Seleccione un cliente...",
        widget=forms.Select(attrs={
            'class': 'form-select',
            'onchange': 'cargarCreditosCliente(this.value)'
        })
    )
    
    prestamo = forms.ModelChoiceField(
        queryset=Prestamo.objects.none(),  # Se llena dinámicamente
        empty_label="Primero seleccione un cliente...",
        widget=forms.Select(attrs={
            'class': 'form-select',
            'onchange': 'cargarTablaPagos(this.value)'
        })
    )
    
    class Meta:
        model = RegistroPago
        fields = ['cliente', 'prestamo', 'monto_pagado', 'diario', 'referencia', 'observaciones']
        widgets = {
            'monto_pagado': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01',
                'min': '0.01',
                'onchange': 'calcularDistribucionPago()'
            }),
            'diario': forms.Select(attrs={
                'class': 'form-select'
            }),
            'referencia': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Número de cheque, referencia de transferencia, etc.'
            }),
            'observaciones': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Observaciones adicionales sobre el pago...'
            })
        }
        help_texts = {
            'monto_pagado': 'Monto total que está pagando el cliente',
            'referencia': 'Opcional: número de referencia del pago',
            'diario': 'Seleccione el diario contable donde se registrará el pago'
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Configurar queryset de diarios activos
        self.fields['diario'].queryset = Diario.objects.filter(activo=True)
        self.fields['diario'].empty_label = "Seleccione un diario..."
        
        # Si se pasa un cliente, filtrar los préstamos
        if self.data and 'cliente' in self.data:
            try:
                cliente_id = int(self.data.get('cliente'))
                self.fields['prestamo'].queryset = Prestamo.objects.filter(
                    cliente_id=cliente_id,
                    estado='activo'
                ).order_by('-fecha_solicitud')
                self.fields['prestamo'].empty_label = "Seleccione un crédito..."
            except (ValueError, TypeError):
                pass
    
    def clean_monto_pagado(self):
        monto = self.cleaned_data.get('monto_pagado')
        if monto and monto <= 0:
            raise forms.ValidationError('El monto debe ser mayor a cero.')
        return monto
    
    def clean(self):
        cleaned_data = super().clean()
        cliente = cleaned_data.get('cliente')
        prestamo = cleaned_data.get('prestamo')
        
        # Validar que el préstamo pertenezca al cliente seleccionado
        if cliente and prestamo and prestamo.cliente != cliente:
            raise forms.ValidationError('El crédito seleccionado no pertenece al cliente.')
        
        # Validar que el préstamo esté activo
        if prestamo and prestamo.estado != 'activo':
            raise forms.ValidationError('Solo se pueden registrar pagos para créditos activos.')
        
        return cleaned_data


class BuscarClienteForm(forms.Form):
    """Formulario para buscar clientes rápidamente"""
    buscar = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Buscar por nombre, apellido o cédula...',
            'oninput': 'buscarClientesEnVivo(this.value)',
            'id': 'buscar-cliente',
            'autocomplete': 'off'
        })
    )