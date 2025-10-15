from django.urls import path
from . import views

app_name = 'microcreditos'

urlpatterns = [
    # Página de inicio
    path('', views.home, name='home'),
    
    # Dashboard
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # Clientes
    path('clientes/', views.lista_clientes, name='lista_clientes'),
    path('clientes/nuevo/', views.crear_cliente, name='crear_cliente'),
    path('clientes/<int:pk>/', views.detalle_cliente, name='detalle_cliente'),
    path('clientes/<int:pk>/editar/', views.editar_cliente, name='editar_cliente'),
    path('clientes/<int:pk>/eliminar/', views.eliminar_cliente, name='eliminar_cliente'),
    
    # Préstamos
    path('prestamos/', views.lista_prestamos, name='lista_prestamos'),
    path('prestamos/nuevo/', views.crear_prestamo, name='crear_prestamo'),
    path('prestamos/<int:pk>/', views.detalle_prestamo, name='detalle_prestamo'),
    path('prestamos/<int:pk>/editar/', views.editar_prestamo, name='editar_prestamo'),
    path('prestamos/<int:pk>/eliminar/', views.eliminar_prestamo, name='eliminar_prestamo'),
    path('prestamos/<int:pk>/aprobar/', views.aprobar_prestamo, name='aprobar_prestamo'),
    
    # Pagos
    path('pagos/', views.lista_pagos, name='lista_pagos'),
    path('pagos/<int:pk>/registrar/', views.registrar_pago, name='registrar_pago'),
    
    # Reportes
    path('reportes/', views.reportes, name='reportes'),
    path('reportes/generar/', views.generar_reporte, name='generar_reporte'),
    
    # Configuración
    path('configuracion/general/', views.configuracion_general, name='configuracion_general'),
    path('configuracion/usuarios/', views.configuracion_usuarios, name='configuracion_usuarios'),
    path('configuracion/usuarios/crear/', views.crear_usuario, name='crear_usuario'),
    path('configuracion/usuarios/<int:pk>/editar/', views.editar_usuario, name='editar_usuario'),
    path('configuracion/usuarios/<int:pk>/toggle/', views.toggle_usuario, name='toggle_usuario'),
    path('configuracion/backup/', views.configuracion_backup, name='configuracion_backup'),
    path('configuracion/sistema/', views.configuracion_sistema, name='configuracion_sistema'),
    
    # Adjuntos de clientes
    path('clientes/<int:cliente_id>/adjuntos/', views.cliente_adjuntos, name='cliente_adjuntos'),
    path('clientes/<int:cliente_id>/adjuntos/subir/', views.subir_adjunto_cliente, name='subir_adjunto_cliente'),
    path('adjuntos/<int:adjunto_id>/eliminar/', views.eliminar_adjunto_cliente, name='eliminar_adjunto_cliente'),
    path('adjuntos/<int:adjunto_id>/descargar/', views.descargar_adjunto_cliente, name='descargar_adjunto_cliente'),
    
    # Mensajes internos de clientes
    path('clientes/<int:cliente_id>/mensajes/', views.cliente_mensajes_internos, name='cliente_mensajes_internos'),
    path('clientes/<int:cliente_id>/mensajes/nuevo/', views.crear_mensaje_interno_cliente, name='crear_mensaje_interno_cliente'),
    path('mensajes/<int:mensaje_id>/completar/', views.marcar_completado_mensaje, name='marcar_completado_mensaje'),
    path('mensajes/<int:mensaje_id>/eliminar/', views.eliminar_mensaje_interno, name='eliminar_mensaje_interno'),
    path('clientes/<int:cliente_id>/mensajes/stats/', views.estadisticas_mensajes_cliente, name='estadisticas_mensajes_cliente'),
    
    # Configuración de créditos
    path('configuracion/creditos/', views.configuracion_credito, name='configuracion_credito'),
    path('configuracion/creditos/nuevo/', views.crear_configuracion_credito, name='crear_configuracion_credito'),
    path('configuracion/creditos/<int:config_id>/', views.detalle_configuracion_credito, name='detalle_configuracion_credito'),
    path('configuracion/creditos/<int:config_id>/editar/', views.editar_configuracion_credito, name='editar_configuracion_credito'),
    path('configuracion/creditos/<int:config_id>/eliminar/', views.eliminar_configuracion_credito, name='eliminar_configuracion_credito'),
    path('configuracion/creditos/<int:config_id>/activar/', views.activar_configuracion_credito, name='activar_configuracion_credito'),
    path('api/calcular-cuota/', views.calcular_cuota_ajax, name='calcular_cuota_ajax'),
    
    # Nuevas URLs para créditos mejorados
    path('creditos/nuevo/', views.crear_credito, name='crear_credito'),
    path('api/obtener-configuracion/', views.obtener_configuracion_ajax, name='obtener_configuracion_ajax'),
    
    # Contabilidad - Diarios
    path('contabilidad/diarios/', views.lista_diarios, name='lista_diarios'),
    path('contabilidad/diarios/nuevo/', views.crear_diario, name='crear_diario'),
    path('contabilidad/diarios/<int:pk>/', views.detalle_diario, name='detalle_diario'),
    path('contabilidad/diarios/<int:pk>/editar/', views.editar_diario, name='editar_diario'),
    path('contabilidad/diarios/<int:pk>/eliminar/', views.eliminar_diario, name='eliminar_diario'),
    path('contabilidad/diarios/<int:pk>/toggle/', views.toggle_diario, name='toggle_diario'),
    
    # Pagos
    path('pagos/registrar/', views.registrar_pago, name='registrar_pago'),
    path('pagos/lista/', views.lista_pagos_realizados, name='lista_pagos_realizados'),
    path('pagos/<int:pk>/', views.detalle_registro_pago, name='detalle_registro_pago'),
    path('api/clientes/<int:cliente_id>/creditos/', views.obtener_creditos_cliente, name='obtener_creditos_cliente'),
    path('api/prestamos/<int:prestamo_id>/tabla-pagos/', views.obtener_tabla_pagos, name='obtener_tabla_pagos'),
    path('api/buscar-clientes/', views.buscar_clientes_ajax, name='buscar_clientes_ajax'),
]