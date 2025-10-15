# YaPresto.com - Sistema de Gestión de Microcréditos

Una aplicación web completa desarrollada en Django para la gestión de microcréditos, inspirada en el diseño de PocketBase.

## 🚀 Características

- **Landing Page Atractiva**: Página de inicio profesional para atraer clientes
- **Sistema de Autenticación**: Login/logout seguro con gestión de usuarios
- **Dashboard Administrativo**: Panel de control inspirado en PocketBase
- **Gestión de Clientes**: CRUD completo para administrar clientes
- **Gestión de Préstamos**: Control total de préstamos y solicitudes
- **Sistema de Pagos**: Seguimiento de cuotas y pagos
- **Reportes**: Generación de reportes detallados
- **Diseño Responsivo**: Compatible con dispositivos móviles

## 🛠️ Tecnologías Utilizadas

- **Backend**: Django 4.2
- **Frontend**: Bootstrap 5, HTML5, CSS3, JavaScript
- **Base de Datos**: SQLite (desarrollo)
- **Iconos**: Bootstrap Icons
- **Estilos**: CSS personalizado inspirado en PocketBase

## 📋 Requisitos Previos

- Python 3.9+
- pip (gestor de paquetes de Python)

## 🔧 Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/falconsoft3d/yapresto.com.git
   cd yapresto.com
   ```

2. **Crear entorno virtual**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # En macOS/Linux
   # o
   venv\Scripts\activate     # En Windows
   ```

3. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Ejecutar migraciones**:
   ```bash
   python manage.py migrate
   ```

5. **Crear superusuario**:
   ```bash
   python manage.py createsuperuser
   ```

6. **Ejecutar servidor de desarrollo**:
   ```bash
   python manage.py runserver
   ```

7. **Acceder a la aplicación**:
   - Landing Page: http://127.0.0.1:8000/
   - Dashboard: http://127.0.0.1:8000/dashboard/
   - Admin: http://127.0.0.1:8000/admin/

## 👤 Credenciales de Demo

Para probar la aplicación, puedes usar estas credenciales:

- **Usuario**: admin
- **Contraseña**: admin123

## 📱 Funcionalidades Principales

### 🏠 Landing Page
- Página de inicio atractiva con información de la empresa
- Estadísticas en tiempo real
- Secciones de servicios y características
- Call-to-action para registro

### 🔐 Sistema de Autenticación
- Login seguro con validación
- Registro de nuevos usuarios
- Gestión de sesiones
- Redirección automática

### 📊 Dashboard
- Panel de control principal
- Estadísticas clave del negocio
- Accesos rápidos a funcionalidades
- Navegación lateral estilo PocketBase

### 👥 Gestión de Clientes
- Lista completa de clientes
- Búsqueda y filtros
- Perfiles detallados con avatar
- Score crediticio
- Estados de cliente (Activo, Inactivo, Moroso)

### 💰 Gestión de Préstamos
- Solicitudes de préstamos
- Aprobación/rechazo
- Diferentes tipos (Personal, Comercial, Emergencia)
- Cálculo automático de cuotas
- Estados de préstamo

### 💳 Sistema de Pagos
- Registro de pagos
- Control de cuotas vencidas
- Cálculo de mora
- Historial de pagos

### 📈 Reportes
- Reportes diarios, semanales, mensuales
- Estadísticas financieras
- Exportación de datos

## 🎨 Diseño

El diseño está inspirado en PocketBase con:
- Sidebar de navegación oscuro
- Cards con sombras suaves
- Iconos de Bootstrap
- Colores corporativos
- Animaciones sutiles
- Diseño responsive

## 📁 Estructura del Proyecto

```
yapresto.com/
├── yapresto/                 # Configuración principal del proyecto
├── microcreditos/           # App principal de microcréditos
│   ├── models.py           # Modelos de datos
│   ├── views.py            # Vistas/controladores
│   ├── forms.py            # Formularios
│   ├── urls.py             # URLs de la app
│   └── admin.py            # Configuración del admin
├── accounts/                # App de autenticación
├── templates/               # Templates HTML
│   ├── base.html           # Template base
│   ├── microcreditos/      # Templates de microcréditos
│   └── accounts/           # Templates de autenticación
├── static/                  # Archivos estáticos
│   ├── css/                # Estilos CSS
│   └── js/                 # JavaScript
├── media/                   # Archivos subidos
└── requirements.txt         # Dependencias
```

## 🔐 Modelos de Datos

### Cliente
- Información personal completa
- Score crediticio
- Estado del cliente
- Avatar/foto de perfil

### Préstamo
- Vinculación con cliente
- Monto, tasa de interés, plazo
- Tipo de préstamo
- Estados de aprobación

### Pago
- Cuotas individuales
- Fechas de vencimiento
- Estados de pago
- Cálculo de mora

### Reporte
- Reportes personalizables
- Estadísticas financieras
- Rangos de fechas

## 🚀 Despliegue

Para producción:

1. Configurar base de datos PostgreSQL
2. Configurar servidor web (Nginx + Gunicorn)
3. Configurar variables de entorno
4. Configurar archivos estáticos
5. Configurar HTTPS

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

- **Desarrollador**: Tu Nombre
- **Email**: contacto@yapresto.com
- **Proyecto**: [https://github.com/falconsoft3d/yapresto.com](https://github.com/falconsoft3d/yapresto.com)

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!
