from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Count, Q
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta
from django.http import JsonResponse, HttpResponse, Http404
from django.core.paginator import Paginator
from .models import Cliente, Prestamo, Pago, Reporte, ClienteAdjunto, ClienteMensajeInterno, ConfiguracionCredito, Diario, RegistroPago, DetallePagoCuota
from .forms import ClienteForm, PrestamoForm, PagoForm, ClienteAdjuntoForm, ClienteMensajeInternoForm, ClienteMensajeInternoFiltroForm, ConfiguracionCreditoForm, CreditoForm, DiarioForm, RegistroPagoForm, BuscarClienteForm

def home(request):
    """Página de inicio - Landing page"""
    context = {
        'total_clientes': Cliente.objects.count(),
        'total_prestamos': Prestamo.objects.count(),
        'monto_total': Prestamo.objects.filter(estado='activo').aggregate(Sum('monto'))['monto__sum'] or 0,
    }
    return render(request, 'microcreditos/home.html', context)

@login_required
def dashboard(request):
    """Dashboard principal del sistema"""
    print(f"=== DASHBOARD === Usuario autenticado: {request.user.username}")
    
    # Estadísticas generales
    total_clientes = Cliente.objects.count()
    total_prestamos = Prestamo.objects.count()
    
    # Préstamos por estado
    prestamos_pendientes = Prestamo.objects.filter(estado='pendiente').count()
    prestamos_aprobados = Prestamo.objects.filter(estado='aprobado').count()
    prestamos_activos = Prestamo.objects.filter(estado='activo').count()
    prestamos_completados = Prestamo.objects.filter(estado='completado').count()
    prestamos_vencidos = Prestamo.objects.filter(estado='vencido').count()
    
    # Montos totales
    monto_total_activos = Prestamo.objects.filter(estado='activo').aggregate(Sum('monto'))['monto__sum'] or 0
    monto_total_general = Prestamo.objects.exclude(estado='rechazado').aggregate(Sum('monto'))['monto__sum'] or 0
    monto_pendiente = Prestamo.objects.filter(estado='pendiente').aggregate(Sum('monto'))['monto__sum'] or 0
    
    # Pagos
    pagos_vencidos = Pago.objects.filter(
        estado='pendiente',
        fecha_vencimiento__lt=timezone.now().date()
    ).count()
    
    total_pagos_pendientes = Pago.objects.filter(estado='pendiente').count()
    total_pagos_realizados = Pago.objects.filter(estado='pagado').count()
    monto_pagos_realizados = Pago.objects.filter(estado='pagado').aggregate(Sum('monto'))['monto__sum'] or 0
    
    # Clientes
    clientes_con_prestamos = Cliente.objects.filter(prestamos__isnull=False).distinct().count()
    clientes_morosos = Cliente.objects.filter(estado='moroso').count()
    clientes_activos = Cliente.objects.exclude(estado='inactivo').count()
    
    # Préstamos recientes
    prestamos_recientes = Prestamo.objects.order_by('-fecha_solicitud')[:5]
    
    # Estadísticas del mes actual
    from datetime import datetime
    mes_actual = datetime.now().month
    año_actual = datetime.now().year
    
    prestamos_mes = Prestamo.objects.filter(
        fecha_solicitud__month=mes_actual,
        fecha_solicitud__year=año_actual
    ).count()
    
    monto_prestamos_mes = Prestamo.objects.filter(
        fecha_solicitud__month=mes_actual,
        fecha_solicitud__year=año_actual
    ).aggregate(Sum('monto'))['monto__sum'] or 0
    
    clientes_nuevos_mes = Cliente.objects.filter(
        fecha_registro__month=mes_actual,
        fecha_registro__year=año_actual
    ).count()
    
    # Calcular porcentajes para las barras de progreso
    porcentaje_morosos = (clientes_morosos * 100 / total_clientes) if total_clientes > 0 else 0
    porcentaje_activos = (prestamos_activos * 100 / total_prestamos) if total_prestamos > 0 else 0
    porcentaje_completados = (prestamos_completados * 100 / total_prestamos) if total_prestamos > 0 else 0
    porcentaje_vencidos = (prestamos_vencidos * 100 / total_prestamos) if total_prestamos > 0 else 0
    
    # Tasa de cobro
    tasa_cobro = (total_pagos_realizados * 100 / (total_pagos_realizados + total_pagos_pendientes)) if (total_pagos_realizados + total_pagos_pendientes) > 0 else 0
    
    context = {
        # Totales generales
        'total_clientes': total_clientes,
        'total_prestamos': total_prestamos,
        
        # Préstamos por estado
        'prestamos_pendientes': prestamos_pendientes,
        'prestamos_aprobados': prestamos_aprobados,
        'prestamos_activos': prestamos_activos,
        'prestamos_completados': prestamos_completados,
        'prestamos_vencidos': prestamos_vencidos,
        
        # Montos
        'monto_total_activos': monto_total_activos,
        'monto_total_general': monto_total_general,
        'monto_pendiente': monto_pendiente,
        'monto_pagos_realizados': monto_pagos_realizados,
        
        # Pagos
        'pagos_vencidos': pagos_vencidos,
        'total_pagos_pendientes': total_pagos_pendientes,
        'total_pagos_realizados': total_pagos_realizados,
        
        # Clientes
        'clientes_con_prestamos': clientes_con_prestamos,
        'clientes_morosos': clientes_morosos,
        'clientes_activos': clientes_activos,
        
        # Estadísticas del mes
        'prestamos_mes': prestamos_mes,
        'monto_prestamos_mes': monto_prestamos_mes,
        'clientes_nuevos_mes': clientes_nuevos_mes,
        
        # Porcentajes
        'porcentaje_morosos': round(porcentaje_morosos, 1),
        'porcentaje_activos': round(porcentaje_activos, 1),
        'porcentaje_completados': round(porcentaje_completados, 1),
        'porcentaje_vencidos': round(porcentaje_vencidos, 1),
        'tasa_cobro': round(tasa_cobro, 1),
        
        # Datos adicionales
        'prestamos_recientes': prestamos_recientes,
        
        # Para compatibilidad con la plantilla actual
        'monto_total': monto_total_activos,  # Mantener nombre original
    }
    return render(request, 'microcreditos/dashboard.html', context)

@login_required
def lista_clientes(request):
    """Lista de todos los clientes"""
    clientes = Cliente.objects.all().order_by('-fecha_registro')
    
    # Filtros
    search = request.GET.get('search')
    if search:
        clientes = clientes.filter(
            Q(nombre__icontains=search) |
            Q(apellido__icontains=search) |
            Q(cedula__icontains=search) |
            Q(email__icontains=search)
        )
    
    return render(request, 'microcreditos/lista_clientes.html', {'clientes': clientes})

@login_required
def crear_cliente(request):
    """Crear nuevo cliente"""
    if request.method == 'POST':
        form = ClienteForm(request.POST, request.FILES)
        if form.is_valid():
            cliente = form.save()
            messages.success(request, f'Cliente {cliente.nombre_completo} creado exitosamente.')
            return redirect('microcreditos:detalle_cliente', pk=cliente.pk)
    else:
        form = ClienteForm()
    
    return render(request, 'microcreditos/formulario_cliente.html', {'form': form, 'titulo': 'Nuevo Cliente'})

@login_required
def detalle_cliente(request, pk):
    """Detalle de un cliente específico"""
    cliente = get_object_or_404(Cliente, pk=pk)
    prestamos = cliente.prestamos.all().order_by('-fecha_solicitud')
    
    # Calcular estadísticas del cliente
    estadisticas = {
        'total_prestamos': prestamos.count(),
        'prestamos_activos': prestamos.filter(estado='activo').count(),
        'total_prestado': prestamos.aggregate(Sum('monto'))['monto__sum'] or 0,
        'total_pagado': Pago.objects.filter(
            prestamo__cliente=cliente, 
            estado='pagado'
        ).aggregate(Sum('monto'))['monto__sum'] or 0
    }
    
    # Adjuntos y mensajes internos recientes
    adjuntos_recientes = ClienteAdjunto.objects.filter(cliente=cliente).order_by('-fecha_subida')[:5]
    mensajes_recientes = ClienteMensajeInterno.objects.filter(cliente=cliente).order_by('-fecha_creacion')[:5]
    mensajes_pendientes = ClienteMensajeInterno.objects.filter(
        cliente=cliente, 
        completado=False
    ).count()
    mensajes_seguimiento = ClienteMensajeInterno.objects.filter(
        cliente=cliente,
        fecha_seguimiento__isnull=False,
        fecha_seguimiento__lte=timezone.now(),
        completado=False
    ).count()
    
    return render(request, 'microcreditos/detalle_cliente.html', {
        'cliente': cliente,
        'prestamos': prestamos,
        'estadisticas': estadisticas,
        'adjuntos_recientes': adjuntos_recientes,
        'mensajes_recientes': mensajes_recientes,
        'mensajes_pendientes': mensajes_pendientes,
        'mensajes_seguimiento': mensajes_seguimiento,
    })

@login_required
def editar_cliente(request, pk):
    """Editar cliente existente"""
    cliente = get_object_or_404(Cliente, pk=pk)
    
    if request.method == 'POST':
        form = ClienteForm(request.POST, request.FILES, instance=cliente)
        if form.is_valid():
            form.save()
            messages.success(request, f'Cliente {cliente.nombre_completo} actualizado exitosamente.')
            return redirect('microcreditos:detalle_cliente', pk=cliente.pk)
    else:
        form = ClienteForm(instance=cliente)
    
    return render(request, 'microcreditos/formulario_cliente.html', {
        'form': form, 
        'titulo': f'Editar Cliente: {cliente.nombre_completo}',
        'cliente': cliente
    })

@login_required
def eliminar_cliente(request, pk):
    """Eliminar cliente existente"""
    cliente = get_object_or_404(Cliente, pk=pk)
    
    if request.method == 'POST':
        nombre_cliente = cliente.nombre_completo
        cliente.delete()
        messages.success(request, f'Cliente {nombre_cliente} eliminado exitosamente.')
        return redirect('microcreditos:lista_clientes')
    
    # Si no es POST, redirigir al detalle (no debería llegar aquí)
    return redirect('microcreditos:detalle_cliente', pk=pk)

@login_required
def lista_prestamos(request):
    """Lista de todos los préstamos"""
    prestamos = Prestamo.objects.all().order_by('-fecha_solicitud')
    
    # Filtros
    estado = request.GET.get('estado')
    if estado:
        prestamos = prestamos.filter(estado=estado)
    
    return render(request, 'microcreditos/lista_prestamos.html', {'prestamos': prestamos})

@login_required
def crear_prestamo(request):
    """Crear nuevo préstamo"""
    if request.method == 'POST':
        form = PrestamoForm(request.POST)
        if form.is_valid():
            prestamo = form.save()
            messages.success(request, f'Préstamo para {prestamo.cliente.nombre_completo} creado exitosamente.')
            return redirect('microcreditos:detalle_prestamo', pk=prestamo.pk)
    else:
        form = PrestamoForm()
    
    return render(request, 'microcreditos/formulario_prestamo.html', {'form': form, 'titulo': 'Nuevo Préstamo'})

@login_required
def detalle_prestamo(request, pk):
    """Detalle de un préstamo específico"""
    prestamo = get_object_or_404(Prestamo, pk=pk)
    pagos = prestamo.pagos.all().order_by('numero_cuota')
    
    # Generar tabla de amortización
    tabla_amortizacion = prestamo.generar_tabla_amortizacion()
    
    # Calcular resumen financiero
    total_pagado = pagos.filter(estado='pagado').aggregate(Sum('monto'))['monto__sum'] or 0
    monto_total = prestamo.monto
    saldo_pendiente = monto_total - total_pagado
    porcentaje_pagado = (total_pagado * 100 / monto_total) if monto_total > 0 else 0
    
    # Calcular totales de la tabla de amortización
    total_intereses = sum(cuota['interes'] for cuota in tabla_amortizacion)
    total_capital = sum(cuota['capital'] for cuota in tabla_amortizacion)
    total_cuotas = sum(cuota['cuota_real'] for cuota in tabla_amortizacion)
    
    resumen = {
        'monto_total': monto_total,
        'total_pagado': total_pagado,
        'saldo_pendiente': saldo_pendiente,
        'porcentaje_pagado': porcentaje_pagado,
        'total_intereses': total_intereses,
        'total_capital': total_capital,
        'total_cuotas': total_cuotas,
    }
    
    return render(request, 'microcreditos/detalle_prestamo.html', {
        'prestamo': prestamo,
        'pagos': pagos,
        'tabla_amortizacion': tabla_amortizacion,
        'resumen': resumen
    })

@login_required
def aprobar_prestamo(request, pk):
    """Aprobar un préstamo pendiente"""
    prestamo = get_object_or_404(Prestamo, pk=pk)
    
    if prestamo.estado == 'pendiente':
        prestamo.estado = 'aprobado'
        prestamo.fecha_aprobacion = timezone.now()
        prestamo.save()
        
        # Generar cuotas de pago
        for i in range(1, prestamo.plazo_meses + 1):
            fecha_vencimiento = prestamo.fecha_aprobacion.date() + timedelta(days=30 * i)
            Pago.objects.create(
                prestamo=prestamo,
                numero_cuota=i,
                monto=prestamo.cuota_mensual,
                fecha_vencimiento=fecha_vencimiento
            )
        
        messages.success(request, f'Préstamo aprobado y cuotas generadas exitosamente.')
    else:
        messages.error(request, 'Solo se pueden aprobar préstamos pendientes.')
    
    return redirect('microcreditos:detalle_prestamo', pk=prestamo.pk)

@login_required
def editar_prestamo(request, pk):
    """Editar un préstamo existente"""
    prestamo = get_object_or_404(Prestamo, pk=pk)
    
    # Solo permitir editar si el préstamo está pendiente
    if prestamo.estado not in ['pendiente']:
        messages.error(request, 'Solo se pueden editar préstamos en estado pendiente.')
        return redirect('microcreditos:detalle_prestamo', pk=prestamo.pk)
    
    if request.method == 'POST':
        if prestamo.configuracion_credito:
            # Usar el formulario mejorado si tiene configuración
            form = CreditoForm(request.POST, instance=prestamo)
        else:
            # Usar el formulario tradicional
            form = PrestamoForm(request.POST, instance=prestamo)
            
        if form.is_valid():
            prestamo = form.save()
            messages.success(request, f'Préstamo actualizado exitosamente.')
            return redirect('microcreditos:detalle_prestamo', pk=prestamo.pk)
    else:
        if prestamo.configuracion_credito:
            form = CreditoForm(instance=prestamo)
        else:
            form = PrestamoForm(instance=prestamo)
    
    context = {
        'form': form,
        'prestamo': prestamo,
        'titulo': f'Editar Crédito #{prestamo.pk}',
        'es_edicion': True
    }
    
    template = 'microcreditos/formulario_credito.html' if prestamo.configuracion_credito else 'microcreditos/formulario_prestamo.html'
    return render(request, template, context)

@login_required
def eliminar_prestamo(request, pk):
    """Eliminar un préstamo"""
    prestamo = get_object_or_404(Prestamo, pk=pk)
    
    # Solo permitir eliminar si el préstamo está pendiente
    if prestamo.estado not in ['pendiente']:
        messages.error(request, 'Solo se pueden eliminar préstamos en estado pendiente.')
        return redirect('microcreditos:detalle_prestamo', pk=prestamo.pk)
    
    if request.method == 'POST':
        cliente_nombre = prestamo.cliente.nombre_completo
        prestamo.delete()
        messages.success(request, f'Préstamo de {cliente_nombre} eliminado exitosamente.')
        return redirect('microcreditos:lista_prestamos')
    
    context = {
        'prestamo': prestamo,
        'titulo': f'Eliminar Crédito #{prestamo.pk}'
    }
    return render(request, 'microcreditos/confirmar_eliminar_prestamo.html', context)

@login_required
def lista_pagos(request):
    """Lista de todos los pagos"""
    pagos = Pago.objects.all().order_by('-fecha_vencimiento')
    
    # Filtros
    estado = request.GET.get('estado')
    if estado:
        pagos = pagos.filter(estado=estado)
    
    return render(request, 'microcreditos/lista_pagos.html', {'pagos': pagos})

@login_required
def registrar_pago(request, pk):
    """Registrar un pago"""
    pago = get_object_or_404(Pago, pk=pk)
    
    if request.method == 'POST':
        form = PagoForm(request.POST, instance=pago)
        if form.is_valid():
            pago = form.save()
            pago.fecha_pago = timezone.now()
            pago.estado = 'completado'
            pago.save()
            messages.success(request, 'Pago registrado exitosamente.')
            return redirect('microcreditos:detalle_prestamo', pk=pago.prestamo.pk)
    else:
        form = PagoForm(instance=pago)
    
    return render(request, 'microcreditos/formulario_pago.html', {'form': form, 'pago': pago})

@login_required
def reportes(request):
    """Página de reportes"""
    reportes = Reporte.objects.all().order_by('-fecha_generacion')[:10]
    
    return render(request, 'microcreditos/reportes.html', {'reportes': reportes})

@login_required
def generar_reporte(request):
    """Generar nuevo reporte"""
    if request.method == 'POST':
        tipo = request.POST.get('tipo')
        fecha_inicio = datetime.strptime(request.POST.get('fecha_inicio'), '%Y-%m-%d').date()
        fecha_fin = datetime.strptime(request.POST.get('fecha_fin'), '%Y-%m-%d').date()
        
        # Calcular estadísticas
        prestamos_periodo = Prestamo.objects.filter(
            fecha_solicitud__date__range=[fecha_inicio, fecha_fin]
        )
        
        total_prestamos = prestamos_periodo.count()
        monto_total = prestamos_periodo.aggregate(Sum('monto'))['monto__sum'] or 0
        
        pagos_periodo = Pago.objects.filter(
            fecha_pago__date__range=[fecha_inicio, fecha_fin],
            estado='completado'
        )
        pagos_recibidos = pagos_periodo.aggregate(Sum('monto'))['monto__sum'] or 0
        
        # Crear reporte
        reporte = Reporte.objects.create(
            titulo=f'Reporte {tipo.title()} - {fecha_inicio} a {fecha_fin}',
            tipo=tipo,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            total_prestamos=total_prestamos,
            monto_total=monto_total,
            pagos_recibidos=pagos_recibidos
        )
        
        messages.success(request, 'Reporte generado exitosamente.')
        return redirect('microcreditos:reportes')
    
    return render(request, 'microcreditos/generar_reporte.html')

# ===== VISTAS DE CONFIGURACIÓN =====

@login_required
def configuracion_general(request):
    """Configuración general del sistema"""
    # Obtener configuración de crédito activa
    configuracion_activa = ConfiguracionCredito.get_configuracion_activa()
    total_configuraciones = ConfiguracionCredito.objects.count()
    
    context = {
        'titulo': 'Configuración General',
        'descripcion': 'Ajustes generales del sistema YaPresto',
        'configuracion_activa': configuracion_activa,
        'total_configuraciones': total_configuraciones,
    }
    return render(request, 'microcreditos/configuracion/general.html', context)

@login_required
def configuracion_usuarios(request):
    """Configuración de usuarios del sistema"""
    # Verificar que el usuario sea administrador
    if not hasattr(request.user, 'perfil') or not request.user.perfil.es_administrador():
        messages.error(request, 'No tienes permisos para acceder a esta sección.')
        return redirect('microcreditos:dashboard')
    
    from django.contrib.auth.models import User
    usuarios = User.objects.select_related('perfil').all().order_by('username')
    
    # Filtros
    rol_filtro = request.GET.get('rol')
    estado_filtro = request.GET.get('estado')
    busqueda = request.GET.get('q')
    
    if rol_filtro:
        usuarios = usuarios.filter(perfil__rol=rol_filtro)
    
    if estado_filtro == 'active':
        usuarios = usuarios.filter(is_active=True)
    elif estado_filtro == 'inactive':
        usuarios = usuarios.filter(is_active=False)
    
    if busqueda:
        usuarios = usuarios.filter(
            Q(username__icontains=busqueda) |
            Q(first_name__icontains=busqueda) |
            Q(last_name__icontains=busqueda) |
            Q(email__icontains=busqueda)
        )
    
    context = {
        'titulo': 'Gestión de Usuarios',
        'descripcion': 'Administración de usuarios del sistema',
        'usuarios': usuarios,
        'rol_filtro': rol_filtro,
        'estado_filtro': estado_filtro,
        'busqueda': busqueda,
    }
    return render(request, 'microcreditos/configuracion/usuarios.html', context)

@login_required
def configuracion_backup(request):
    """Configuración de respaldos"""
    context = {
        'titulo': 'Respaldo de Datos',
        'descripcion': 'Gestión de respaldos y restauración de datos'
    }
    return render(request, 'microcreditos/configuracion/backup.html', context)

@login_required
def configuracion_sistema(request):
    """Información del sistema"""
    import django
    import sys
    from django.conf import settings
    
    context = {
        'titulo': 'Información del Sistema',
        'descripcion': 'Información técnica y estado del sistema',
        'django_version': django.get_version(),
        'python_version': sys.version,
        'debug_mode': settings.DEBUG,
        'database_engine': settings.DATABASES['default']['ENGINE'],
    }
    return render(request, 'microcreditos/configuracion/sistema.html', context)

# ============================================
# GESTIÓN DE USUARIOS
# ============================================

@login_required
def crear_usuario(request):
    """Crear un nuevo usuario"""
    # Verificar que el usuario sea administrador
    if not hasattr(request.user, 'perfil') or not request.user.perfil.es_administrador():
        messages.error(request, 'No tienes permisos para acceder a esta sección.')
        return redirect('microcreditos:dashboard')
    
    from accounts.forms import RegistroUsuarioForm, PerfilUsuarioForm
    
    if request.method == 'POST':
        user_form = RegistroUsuarioForm(request.POST)
        perfil_form = PerfilUsuarioForm(request.POST)
        
        if user_form.is_valid() and perfil_form.is_valid():
            try:
                with transaction.atomic():
                    # Crear el usuario
                    user = user_form.save()
                    
                    # Obtener o crear el perfil (el signal debería haberlo creado)
                    from accounts.models import PerfilUsuario
                    perfil, created = PerfilUsuario.objects.get_or_create(
                        user=user,
                        defaults=perfil_form.cleaned_data
                    )
                    
                    # Si ya existe, actualizar con los datos del formulario
                    if not created:
                        perfil_data = perfil_form.cleaned_data
                        for field, value in perfil_data.items():
                            setattr(perfil, field, value)
                        perfil.save()
                    
                    messages.success(request, f'Usuario {user.username} creado exitosamente.')
                    return redirect('microcreditos:configuracion_usuarios')
            except Exception as e:
                messages.error(request, f'Error al crear el usuario: {str(e)}')
        else:
            messages.error(request, 'Por favor corrige los errores en el formulario.')
    else:
        user_form = RegistroUsuarioForm()
        perfil_form = PerfilUsuarioForm()
    
    context = {
        'titulo': 'Crear Usuario',
        'user_form': user_form,
        'perfil_form': perfil_form,
    }
    return render(request, 'microcreditos/configuracion/crear_usuario.html', context)

@login_required
def editar_usuario(request, pk):
    """Editar un usuario existente"""
    # Verificar que el usuario sea administrador
    if not hasattr(request.user, 'perfil') or not request.user.perfil.es_administrador():
        messages.error(request, 'No tienes permisos para acceder a esta sección.')
        return redirect('microcreditos:dashboard')
    
    from django.contrib.auth.models import User
    from accounts.forms import EditarUsuarioForm, PerfilUsuarioForm
    
    usuario = get_object_or_404(User, pk=pk)
    
    if request.method == 'POST':
        user_form = EditarUsuarioForm(request.POST, instance=usuario)
        perfil_form = PerfilUsuarioForm(request.POST, instance=usuario.perfil)
        
        if user_form.is_valid() and perfil_form.is_valid():
            user_form.save()
            perfil_form.save()
            
            messages.success(request, f'Usuario {usuario.username} actualizado exitosamente.')
            return redirect('microcreditos:configuracion_usuarios')
    else:
        user_form = EditarUsuarioForm(instance=usuario)
        perfil_form = PerfilUsuarioForm(instance=usuario.perfil)
    
    context = {
        'titulo': f'Editar Usuario: {usuario.username}',
        'usuario': usuario,
        'user_form': user_form,
        'perfil_form': perfil_form,
    }
    return render(request, 'microcreditos/configuracion/editar_usuario.html', context)

@login_required
def toggle_usuario(request, pk):
    """Activar/Desactivar un usuario"""
    # Verificar que el usuario sea administrador
    if not hasattr(request.user, 'perfil') or not request.user.perfil.es_administrador():
        messages.error(request, 'No tienes permisos para realizar esta acción.')
        return redirect('microcreditos:dashboard')
    
    from django.contrib.auth.models import User
    usuario = get_object_or_404(User, pk=pk)
    
    # No permitir desactivar al propio usuario
    if usuario == request.user:
        messages.error(request, 'No puedes desactivar tu propio usuario.')
        return redirect('microcreditos:configuracion_usuarios')
    
    usuario.is_active = not usuario.is_active
    usuario.save()
    
    estado = 'activado' if usuario.is_active else 'desactivado'
    messages.success(request, f'Usuario {usuario.username} {estado} exitosamente.')
    
    return redirect('microcreditos:configuracion_usuarios')

# ================================
# VISTAS PARA ADJUNTOS DE CLIENTES
# ================================

@login_required
def cliente_adjuntos(request, cliente_id):
    """Ver adjuntos de un cliente específico"""
    cliente = get_object_or_404(Cliente, pk=cliente_id)
    adjuntos = ClienteAdjunto.objects.filter(cliente=cliente).order_by('-fecha_subida')
    
    context = {
        'cliente': cliente,
        'adjuntos': adjuntos,
        'titulo': f'Adjuntos de {cliente.nombre_completo}',
    }
    return render(request, 'microcreditos/cliente_adjuntos.html', context)

@login_required 
def subir_adjunto_cliente(request, cliente_id):
    """Subir un nuevo adjunto para un cliente"""
    cliente = get_object_or_404(Cliente, pk=cliente_id)
    
    if request.method == 'POST':
        form = ClienteAdjuntoForm(request.POST, request.FILES)
        if form.is_valid():
            adjunto = form.save(commit=False)
            adjunto.cliente = cliente
            adjunto.subido_por = request.user
            adjunto.save()
            
            messages.success(request, f'Adjunto "{adjunto.titulo}" subido exitosamente.')
            return redirect('microcreditos:cliente_adjuntos', cliente_id=cliente.id)
    else:
        form = ClienteAdjuntoForm()
    
    context = {
        'form': form,
        'cliente': cliente,
        'titulo': f'Subir Adjunto - {cliente.nombre_completo}',
    }
    return render(request, 'microcreditos/subir_adjunto_cliente.html', context)

@login_required
def eliminar_adjunto_cliente(request, adjunto_id):
    """Eliminar un adjunto de cliente"""
    adjunto = get_object_or_404(ClienteAdjunto, pk=adjunto_id)
    cliente_id = adjunto.cliente.id
    
    if request.method == 'POST':
        # Eliminar el archivo físico
        if adjunto.archivo:
            try:
                adjunto.archivo.delete()
            except:
                pass
        
        adjunto.delete()
        messages.success(request, 'Adjunto eliminado exitosamente.')
        return redirect('microcreditos:cliente_adjuntos', cliente_id=cliente_id)
    
    context = {
        'adjunto': adjunto,
        'titulo': f'Eliminar Adjunto: {adjunto.titulo}',
    }
    return render(request, 'microcreditos/eliminar_adjunto_cliente.html', context)

@login_required
def descargar_adjunto_cliente(request, adjunto_id):
    """Descargar un adjunto de cliente"""
    adjunto = get_object_or_404(ClienteAdjunto, pk=adjunto_id)
    
    try:
        response = HttpResponse(adjunto.archivo.read(), content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{adjunto.nombre_archivo}"'
        return response
    except:
        raise Http404("Archivo no encontrado")

# ==========================================
# VISTAS PARA MENSAJES INTERNOS DE CLIENTES
# ==========================================

@login_required
def cliente_mensajes_internos(request, cliente_id):
    """Ver mensajes internos de un cliente específico"""
    cliente = get_object_or_404(Cliente, pk=cliente_id)
    
    # Filtros
    filtro_form = ClienteMensajeInternoFiltroForm(request.GET)
    mensajes = ClienteMensajeInterno.objects.filter(cliente=cliente)
    
    if filtro_form.is_valid():
        if filtro_form.cleaned_data['tipo']:
            mensajes = mensajes.filter(tipo=filtro_form.cleaned_data['tipo'])
        if filtro_form.cleaned_data['prioridad']:
            mensajes = mensajes.filter(prioridad=filtro_form.cleaned_data['prioridad'])
        if filtro_form.cleaned_data['estado']:
            estado = filtro_form.cleaned_data['estado']
            if estado == 'pendiente':
                mensajes = mensajes.filter(completado=False)
            elif estado == 'completado':
                mensajes = mensajes.filter(completado=True)
            elif estado == 'seguimiento':
                mensajes = mensajes.filter(
                    fecha_seguimiento__isnull=False,
                    fecha_seguimiento__lte=timezone.now(),
                    completado=False
                )
        if filtro_form.cleaned_data['fecha_desde']:
            mensajes = mensajes.filter(fecha_creacion__date__gte=filtro_form.cleaned_data['fecha_desde'])
        if filtro_form.cleaned_data['fecha_hasta']:
            mensajes = mensajes.filter(fecha_creacion__date__lte=filtro_form.cleaned_data['fecha_hasta'])
    
    # Paginación
    paginator = Paginator(mensajes.order_by('-fecha_creacion'), 10)
    page = request.GET.get('page')
    mensajes_page = paginator.get_page(page)
    
    # Estadísticas
    stats = {
        'total': mensajes.count(),
        'pendientes': mensajes.filter(completado=False).count(),
        'completados': mensajes.filter(completado=True).count(),
        'alta_prioridad': mensajes.filter(prioridad__in=['alta', 'urgente']).count(),
        'necesitan_seguimiento': mensajes.filter(
            fecha_seguimiento__isnull=False,
            fecha_seguimiento__lte=timezone.now(),
            completado=False
        ).count(),
    }
    
    context = {
        'cliente': cliente,
        'mensajes': mensajes_page,
        'filtro_form': filtro_form,
        'stats': stats,
        'titulo': f'Mensajes Internos - {cliente.nombre_completo}',
    }
    return render(request, 'microcreditos/cliente_mensajes_internos.html', context)

@login_required
def crear_mensaje_interno_cliente(request, cliente_id):
    """Crear un nuevo mensaje interno para un cliente"""
    cliente = get_object_or_404(Cliente, pk=cliente_id)
    
    if request.method == 'POST':
        form = ClienteMensajeInternoForm(request.POST)
        if form.is_valid():
            mensaje = form.save(commit=False)
            mensaje.cliente = cliente
            mensaje.creado_por = request.user
            mensaje.save()
            
            messages.success(request, f'Mensaje interno "{mensaje.titulo}" creado exitosamente.')
            return redirect('microcreditos:cliente_mensajes_internos', cliente_id=cliente.id)
    else:
        form = ClienteMensajeInternoForm()
    
    context = {
        'form': form,
        'cliente': cliente,
        'titulo': f'Nuevo Mensaje Interno - {cliente.nombre_completo}',
    }
    return render(request, 'microcreditos/crear_mensaje_interno_cliente.html', context)

@login_required
def marcar_completado_mensaje(request, mensaje_id):
    """Marcar un mensaje interno como completado"""
    mensaje = get_object_or_404(ClienteMensajeInterno, pk=mensaje_id)
    
    if request.method == 'POST':
        mensaje.marcar_completado(request.user)
        messages.success(request, f'Mensaje "{mensaje.titulo}" marcado como completado.')
        return redirect('microcreditos:cliente_mensajes_internos', cliente_id=mensaje.cliente.id)
    
    context = {
        'mensaje': mensaje,
        'titulo': f'Completar Mensaje: {mensaje.titulo}',
    }
    return render(request, 'microcreditos/completar_mensaje_interno.html', context)

@login_required
def eliminar_mensaje_interno(request, mensaje_id):
    """Eliminar un mensaje interno"""
    mensaje = get_object_or_404(ClienteMensajeInterno, pk=mensaje_id)
    cliente_id = mensaje.cliente.id
    
    if request.method == 'POST':
        mensaje.delete()
        messages.success(request, 'Mensaje interno eliminado exitosamente.')
        return redirect('microcreditos:cliente_mensajes_internos', cliente_id=cliente_id)
    
    context = {
        'mensaje': mensaje,
        'titulo': f'Eliminar Mensaje: {mensaje.titulo}',
    }
    return render(request, 'microcreditos/eliminar_mensaje_interno.html', context)

@login_required
def estadisticas_mensajes_cliente(request, cliente_id):
    """API endpoint para estadísticas de mensajes de un cliente"""
    cliente = get_object_or_404(Cliente, pk=cliente_id)
    mensajes = ClienteMensajeInterno.objects.filter(cliente=cliente)
    
    stats = {
        'total': mensajes.count(),
        'por_tipo': dict(mensajes.values('tipo').annotate(count=Count('tipo')).values_list('tipo', 'count')),
        'por_prioridad': dict(mensajes.values('prioridad').annotate(count=Count('prioridad')).values_list('prioridad', 'count')),
        'completados': mensajes.filter(completado=True).count(),
        'pendientes': mensajes.filter(completado=False).count(),
    }
    
    return JsonResponse(stats)

# === VISTAS DE CONFIGURACIÓN DE CRÉDITO ===

@login_required
def configuracion_credito(request):
    """Vista principal para la configuración de créditos"""
    configuraciones = ConfiguracionCredito.objects.all().order_by('-activa', '-fecha_modificacion')
    configuracion_activa = ConfiguracionCredito.get_configuracion_activa()
    
    context = {
        'configuraciones': configuraciones,
        'configuracion_activa': configuracion_activa,
        'total_configuraciones': configuraciones.count(),
        'titulo': 'Configuración de Créditos',
    }
    return render(request, 'microcreditos/configuracion_credito.html', context)

@login_required
def crear_configuracion_credito(request):
    """Crear nueva configuración de crédito"""
    if request.method == 'POST':
        form = ConfiguracionCreditoForm(request.POST)
        if form.is_valid():
            configuracion = form.save(commit=False)
            configuracion.creado_por = request.user
            configuracion.save()
            messages.success(request, 'Configuración de crédito creada exitosamente.')
            return redirect('microcreditos:configuracion_credito')
    else:
        form = ConfiguracionCreditoForm()
    
    context = {
        'form': form,
        'titulo': 'Nueva Configuración de Crédito',
        'boton_texto': 'Crear Configuración',
    }
    return render(request, 'microcreditos/crear_configuracion_credito.html', context)

@login_required
def editar_configuracion_credito(request, config_id):
    """Editar configuración de crédito existente"""
    configuracion = get_object_or_404(ConfiguracionCredito, pk=config_id)
    
    if request.method == 'POST':
        form = ConfiguracionCreditoForm(request.POST, instance=configuracion)
        if form.is_valid():
            form.save()
            messages.success(request, 'Configuración de crédito actualizada exitosamente.')
            return redirect('microcreditos:configuracion_credito')
    else:
        form = ConfiguracionCreditoForm(instance=configuracion)
    
    context = {
        'form': form,
        'configuracion': configuracion,
        'titulo': f'Editar: {configuracion.nombre}',
        'boton_texto': 'Actualizar Configuración',
    }
    return render(request, 'microcreditos/editar_configuracion_credito.html', context)

@login_required
def detalle_configuracion_credito(request, config_id):
    """Vista detallada de una configuración de crédito"""
    configuracion = get_object_or_404(ConfiguracionCredito, pk=config_id)
    
    # Calcular algunas estadísticas de ejemplo
    ejemplos_cuotas = []
    montos_ejemplo = [10000, 25000, 50000, 100000]
    
    for monto in montos_ejemplo:
        if configuracion.validar_monto(monto):
            cuota_12 = configuracion.calcular_cuota(monto, 12)
            cuota_24 = configuracion.calcular_cuota(monto, 24)
            cuota_36 = configuracion.calcular_cuota(monto, 36)
            
            ejemplos_cuotas.append({
                'monto': monto,
                'cuota_12': round(cuota_12, 2),
                'cuota_24': round(cuota_24, 2),
                'cuota_36': round(cuota_36, 2),
            })
    
    context = {
        'configuracion': configuracion,
        'ejemplos_cuotas': ejemplos_cuotas,
        'titulo': f'Configuración: {configuracion.nombre}',
    }
    return render(request, 'microcreditos/detalle_configuracion_credito.html', context)

@login_required
def eliminar_configuracion_credito(request, config_id):
    """Eliminar configuración de crédito"""
    configuracion = get_object_or_404(ConfiguracionCredito, pk=config_id)
    
    # No permitir eliminar si es la única configuración activa
    if configuracion.activa and ConfiguracionCredito.objects.filter(activa=True).count() == 1:
        messages.error(request, 'No se puede eliminar la única configuración activa del sistema.')
        return redirect('microcreditos:configuracion_credito')
    
    if request.method == 'POST':
        nombre = configuracion.nombre
        configuracion.delete()
        messages.success(request, f'Configuración "{nombre}" eliminada exitosamente.')
        return redirect('microcreditos:configuracion_credito')
    
    context = {
        'configuracion': configuracion,
        'titulo': f'Eliminar: {configuracion.nombre}',
    }
    return render(request, 'microcreditos/eliminar_configuracion_credito.html', context)

@login_required
def activar_configuracion_credito(request, config_id):
    """Activar/desactivar configuración de crédito"""
    configuracion = get_object_or_404(ConfiguracionCredito, pk=config_id)
    
    if request.method == 'POST':
        nueva_activa = request.POST.get('activa') == 'true'
        
        # Si se está activando, desactivar las demás (solo una puede estar activa)
        if nueva_activa:
            ConfiguracionCredito.objects.exclude(pk=config_id).update(activa=False)
        
        configuracion.activa = nueva_activa
        configuracion.save()
        
        estado = 'activada' if nueva_activa else 'desactivada'
        messages.success(request, f'Configuración "{configuracion.nombre}" {estado} exitosamente.')
        
        return JsonResponse({'success': True, 'activa': nueva_activa})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

@login_required
def calcular_cuota_ajax(request):
    """API endpoint para calcular cuotas en tiempo real"""
    if request.method == 'GET':
        try:
            monto = float(request.GET.get('monto', 0))
            periodos = int(request.GET.get('periodos', 12))
            config_id = request.GET.get('config_id')
            
            if config_id:
                configuracion = get_object_or_404(ConfiguracionCredito, pk=config_id)
            else:
                configuracion = ConfiguracionCredito.get_configuracion_activa()
                if not configuracion:
                    return JsonResponse({'error': 'No hay configuración activa'}, status=400)
            
            # Validar monto y períodos
            if not configuracion.validar_monto(monto):
                return JsonResponse({
                    'error': f'El monto debe estar entre {configuracion.monto_minimo} y {configuracion.monto_maximo}'
                }, status=400)
            
            if not configuracion.validar_periodos(periodos):
                return JsonResponse({
                    'error': f'Los períodos deben estar entre {configuracion.periodos_minimos} y {configuracion.periodos_maximos}'
                }, status=400)
            
            # Calcular cuota
            cuota = configuracion.calcular_cuota(monto, periodos)
            interes_total = (cuota * periodos) - monto
            
            return JsonResponse({
                'cuota': round(cuota, 2),
                'interes_total': round(interes_total, 2),
                'total_pagar': round(cuota * periodos, 2),
                'interes_mensual': round(configuracion.interes_mensual, 2),
                'tipo_calculo': configuracion.get_tipo_calculo_display(),
            })
            
        except (ValueError, TypeError) as e:
            return JsonResponse({'error': 'Parámetros inválidos'}, status=400)
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@login_required
def crear_credito(request):
    """Crear nuevo crédito usando configuración predefinida"""
    if request.method == 'POST':
        form = CreditoForm(request.POST)
        if form.is_valid():
            credito = form.save()
            messages.success(request, f'Crédito para {credito.cliente.nombre_completo} creado exitosamente.')
            return redirect('microcreditos:detalle_prestamo', pk=credito.pk)
    else:
        form = CreditoForm()
    
    # Obtener configuraciones activas para el formulario
    configuraciones = ConfiguracionCredito.objects.filter(activa=True)
    
    context = {
        'form': form,
        'configuraciones': configuraciones,
        'titulo': 'Nuevo Crédito',
    }
    return render(request, 'microcreditos/crear_credito.html', context)

@login_required 
def obtener_configuracion_ajax(request):
    """Vista AJAX para obtener datos de configuración de crédito"""
    if request.method == 'GET':
        config_id = request.GET.get('config_id')
        
        try:
            configuracion = ConfiguracionCredito.objects.get(pk=config_id, activa=True)
            return JsonResponse({
                'success': True,
                'data': {
                    'interes_anual': float(configuracion.interes_anual),
                    'interes_mensual': float(configuracion.interes_mensual),
                    'monto_minimo': float(configuracion.monto_minimo),
                    'monto_maximo': float(configuracion.monto_maximo),
                    'periodos_minimos': configuracion.periodos_minimos,
                    'periodos_maximos': configuracion.periodos_maximos,
                    'tipo_calculo': configuracion.tipo_calculo,
                    'comision_apertura': float(configuracion.comision_apertura),
                    'gastos_administrativos': float(configuracion.gastos_administrativos),
                    'numero_periodos_defecto': configuracion.numero_periodos_defecto,
                }
            })
        except ConfiguracionCredito.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Configuración no encontrada'})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})


# =====================================================
# VISTAS DE CONTABILIDAD - DIARIOS
# =====================================================

@login_required
def lista_diarios(request):
    """Lista todos los diarios contables"""
    diarios = Diario.objects.all().order_by('-activo', 'nombre')
    
    # Aplicar filtros si existen
    buscar = request.GET.get('buscar', '')
    estado = request.GET.get('estado', '')
    
    if buscar:
        diarios = diarios.filter(
            Q(nombre__icontains=buscar) |
            Q(codigo__icontains=buscar) |
            Q(descripcion__icontains=buscar)
        )
    
    if estado == 'activo':
        diarios = diarios.filter(activo=True)
    elif estado == 'inactivo':
        diarios = diarios.filter(activo=False)
    
    # Paginación
    paginator = Paginator(diarios, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'buscar': buscar,
        'estado': estado,
        'total_diarios': diarios.count(),
        'diarios_activos': Diario.objects.filter(activo=True).count(),
        'diarios_inactivos': Diario.objects.filter(activo=False).count(),
    }
    return render(request, 'microcreditos/contabilidad/lista_diarios.html', context)


@login_required
def crear_diario(request):
    """Crear un nuevo diario contable"""
    if request.method == 'POST':
        form = DiarioForm(request.POST)
        if form.is_valid():
            diario = form.save()
            messages.success(request, f'Diario "{diario.nombre}" creado exitosamente.')
            return redirect('microcreditos:lista_diarios')
    else:
        form = DiarioForm()
    
    context = {
        'form': form,
        'titulo': 'Crear Nuevo Diario',
        'accion': 'Crear'
    }
    return render(request, 'microcreditos/contabilidad/form_diario.html', context)


@login_required
def detalle_diario(request, pk):
    """Ver detalles de un diario específico"""
    diario = get_object_or_404(Diario, pk=pk)
    
    # Aquí se podrían agregar estadísticas relacionadas con el diario
    # Por ejemplo: total de movimientos, últimos asientos, etc.
    
    context = {
        'diario': diario,
    }
    return render(request, 'microcreditos/contabilidad/detalle_diario.html', context)


@login_required
def editar_diario(request, pk):
    """Editar un diario existente"""
    diario = get_object_or_404(Diario, pk=pk)
    
    if request.method == 'POST':
        form = DiarioForm(request.POST, instance=diario)
        if form.is_valid():
            diario = form.save()
            messages.success(request, f'Diario "{diario.nombre}" actualizado exitosamente.')
            return redirect('microcreditos:detalle_diario', pk=diario.pk)
    else:
        form = DiarioForm(instance=diario)
    
    context = {
        'form': form,
        'diario': diario,
        'titulo': f'Editar Diario: {diario.nombre}',
        'accion': 'Actualizar'
    }
    return render(request, 'microcreditos/contabilidad/form_diario.html', context)


@login_required
def eliminar_diario(request, pk):
    """Eliminar un diario (solo si no tiene movimientos asociados)"""
    diario = get_object_or_404(Diario, pk=pk)
    
    if request.method == 'POST':
        # Aquí se debería verificar si el diario tiene movimientos asociados
        # Por ahora permitimos la eliminación directa
        nombre_diario = diario.nombre
        diario.delete()
        messages.success(request, f'Diario "{nombre_diario}" eliminado exitosamente.')
        return redirect('microcreditos:lista_diarios')
    
    context = {
        'diario': diario,
    }
    return render(request, 'microcreditos/contabilidad/confirmar_eliminar_diario.html', context)


@login_required
def toggle_diario(request, pk):
    """Activar/desactivar un diario vía AJAX"""
    if request.method == 'POST':
        diario = get_object_or_404(Diario, pk=pk)
        diario.activo = not diario.activo
        diario.save()
        
        estado_texto = 'activado' if diario.activo else 'desactivado'
        messages.success(request, f'Diario "{diario.nombre}" {estado_texto} exitosamente.')
        
        return JsonResponse({
            'success': True,
            'activo': diario.activo,
            'estado_texto': estado_texto
        })
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})


# =====================================================
# VISTAS DE PAGOS
# =====================================================

@login_required
def registrar_pago(request):
    """Vista principal para registrar pagos de créditos"""
    if request.method == 'POST':
        form = RegistroPagoForm(request.POST)
        if form.is_valid():
            # Crear el registro de pago
            registro_pago = form.save(commit=False)
            registro_pago.registrado_por = request.user
            registro_pago.save()
            
            # Procesar la distribución del pago en las cuotas
            procesar_distribucion_pago(registro_pago, request.POST)
            
            messages.success(request, f'Pago de ${registro_pago.monto_pagado} registrado exitosamente.')
            return redirect('microcreditos:detalle_registro_pago', pk=registro_pago.pk)
    else:
        form = RegistroPagoForm()
    
    context = {
        'form': form,
        'buscar_form': BuscarClienteForm(),
        'clientes': Cliente.objects.filter(estado='activo').order_by('nombre', 'apellido')[:10],
    }
    return render(request, 'microcreditos/pagos/registrar_pago.html', context)


@login_required
def obtener_creditos_cliente(request, cliente_id):
    """Vista AJAX para obtener los créditos activos de un cliente"""
    try:
        cliente = Cliente.objects.get(id=cliente_id)
        creditos = Prestamo.objects.filter(
            cliente=cliente,
            estado='activo'
        ).order_by('-fecha_solicitud')
        
        creditos_data = []
        for credito in creditos:
            creditos_data.append({
                'id': credito.id,
                'monto': float(credito.monto),
                'plazo': credito.plazo_meses,
                'cuota': float(credito.cuota_mensual),
                'fecha_solicitud': credito.fecha_solicitud.strftime('%d/%m/%Y'),
                'saldo_pendiente': float(credito.saldo_pendiente) if hasattr(credito, 'saldo_pendiente') else 0,
                'texto': f'Crédito #{credito.id} - ${credito.monto:,.0f} ({credito.plazo_meses} meses)'
            })
        
        return JsonResponse({
            'success': True,
            'creditos': creditos_data
        })
    except Cliente.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Cliente no encontrado'
        })


@login_required
def obtener_tabla_pagos(request, prestamo_id):
    """Vista AJAX para obtener la tabla de amortización de un préstamo"""
    try:
        prestamo = Prestamo.objects.get(id=prestamo_id)
        tabla_amortizacion = prestamo.generar_tabla_amortizacion()
        
        # Obtener pagos ya realizados
        pagos_realizados = Pago.objects.filter(prestamo=prestamo).order_by('numero_cuota')
        
        tabla_data = []
        for i, fila in enumerate(tabla_amortizacion, 1):
            # Buscar si esta cuota ya fue pagada
            pago_cuota = pagos_realizados.filter(numero_cuota=i).first()
            
            estado = 'pendiente'
            fecha_pago = None
            if pago_cuota:
                estado = pago_cuota.estado
                fecha_pago = pago_cuota.fecha_pago.strftime('%d/%m/%Y') if pago_cuota.fecha_pago else None
            
            tabla_data.append({
                'numero_cuota': i,
                'fecha_vencimiento': fila['fecha_vencimiento'].strftime('%d/%m/%Y'),
                'cuota': float(fila['cuota']),
                'capital': float(fila['capital']),
                'interes': float(fila['interes']),
                'saldo': float(fila['saldo']),
                'estado': estado,
                'fecha_pago': fecha_pago,
                'seleccionada': False
            })
        
        # Calcular saldo pendiente
        total_pagado = sum(float(pago.monto) for pago in pagos_realizados.filter(estado='completado'))
        saldo_pendiente = float(prestamo.monto_total) - total_pagado
        
        return JsonResponse({
            'success': True,
            'tabla_pagos': tabla_data,
            'info_credito': {
                'id': prestamo.id,
                'monto': float(prestamo.monto),
                'tasa_interes': float(prestamo.tasa_interes),
                'plazo_meses': prestamo.plazo_meses,
                'cuota_mensual': float(prestamo.cuota_mensual),
                'monto_total': float(prestamo.monto_total),
                'saldo_pendiente': saldo_pendiente,
                'fecha_inicio': prestamo.fecha_aprobacion.strftime('%d/%m/%Y') if prestamo.fecha_aprobacion else prestamo.fecha_solicitud.strftime('%d/%m/%Y'),
                'estado': prestamo.estado
            },
            'resumen': {
                'total_cuotas': len(tabla_data),
                'cuotas_pagadas': pagos_realizados.filter(estado='completado').count(),
                'cuotas_pendientes': pagos_realizados.filter(estado='pendiente').count(),
                'monto_total': float(prestamo.monto),
                'cuota_mensual': float(prestamo.cuota_mensual)
            }
        })
    except Prestamo.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Préstamo no encontrado'
        })


@login_required
def buscar_clientes_ajax(request):
    """Vista AJAX para buscar clientes en tiempo real"""
    query = request.GET.get('q', '').strip()
    
    if len(query) < 2:
        return JsonResponse({'clientes': []})
    
    clientes = Cliente.objects.filter(
        Q(nombre__icontains=query) |
        Q(apellido__icontains=query) |
        Q(cedula__icontains=query),
        estado='activo'
    ).order_by('nombre', 'apellido')[:10]
    
    clientes_data = []
    for cliente in clientes:
        # Contar créditos activos
        creditos_activos = Prestamo.objects.filter(
            cliente=cliente,
            estado='activo'
        ).count()
        
        clientes_data.append({
            'id': cliente.id,
            'nombre_completo': cliente.nombre_completo,
            'cedula': cliente.cedula,
            'telefono': cliente.telefono or '',
            'creditos_activos': creditos_activos,
            'avatar_url': cliente.avatar.url if cliente.avatar else None
        })
    
    return JsonResponse({'clientes': clientes_data})


@login_required
def detalle_registro_pago(request, pk):
    """Ver detalles de un registro de pago realizado"""
    registro_pago = get_object_or_404(RegistroPago, pk=pk)
    
    # Obtener detalles de las cuotas pagadas
    detalles_cuotas = DetallePagoCuota.objects.filter(
        registro_pago=registro_pago
    ).order_by('cuota__numero_cuota')
    
    context = {
        'registro_pago': registro_pago,
        'detalles_cuotas': detalles_cuotas,
    }
    return render(request, 'microcreditos/pagos/detalle_registro_pago.html', context)


@login_required
def lista_pagos_realizados(request):
    """Lista de todos los pagos realizados"""
    registros_pago = RegistroPago.objects.all().order_by('-fecha_pago')
    
    # Filtros
    cliente_id = request.GET.get('cliente')
    metodo = request.GET.get('metodo')
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    
    if cliente_id:
        registros_pago = registros_pago.filter(cliente_id=cliente_id)
    
    if metodo:
        registros_pago = registros_pago.filter(metodo_pago=metodo)
    
    if fecha_inicio:
        registros_pago = registros_pago.filter(fecha_pago__date__gte=fecha_inicio)
    
    if fecha_fin:
        registros_pago = registros_pago.filter(fecha_pago__date__lte=fecha_fin)
    
    # Paginación
    paginator = Paginator(registros_pago, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'clientes': Cliente.objects.filter(estado='activo').order_by('nombre', 'apellido'),
        'metodos_pago': RegistroPago.METODO_PAGO_CHOICES,
        'filtros': {
            'cliente_id': cliente_id,
            'metodo': metodo,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
        }
    }
    return render(request, 'microcreditos/pagos/lista_pagos_realizados.html', context)


def procesar_distribucion_pago(registro_pago, post_data):
    """Función auxiliar para procesar la distribución del pago en las cuotas automáticamente"""
    monto_disponible = registro_pago.monto_pagado
    prestamo = registro_pago.prestamo
    
    # Obtener cuotas pendientes ordenadas por vencimiento
    cuotas_pendientes = Pago.objects.filter(
        prestamo=prestamo,
        estado='pendiente'
    ).order_by('numero_cuota')
    
    # Aplicar pago automáticamente a las cuotas en orden
    monto_restante = float(monto_disponible)
    
    for cuota in cuotas_pendientes:
        if monto_restante <= 0:
            break
            
        monto_cuota = float(cuota.monto)
        monto_aplicar = min(monto_restante, monto_cuota)
        
        # Crear detalle del pago
        DetallePagoCuota.objects.create(
            registro_pago=registro_pago,
            cuota=cuota,
            monto_aplicado=monto_aplicar
        )
        
        # Si se paga completamente la cuota, marcarla como completada
        if monto_aplicar >= monto_cuota:
            cuota.estado = 'completado'
            cuota.fecha_pago = timezone.now()
        else:
            cuota.estado = 'parcial'
        
        cuota.save()
        monto_restante -= monto_aplicar

