export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      {/* Navbar */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">YaPresto</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/login"
                className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Iniciar Sesión
              </a>
              <a
                href="/register"
                className="bg-white text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium"
              >
                Registrarse
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Gestiona tus créditos
            <br />
            <span className="text-blue-200">de forma inteligente</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Plataforma profesional para administrar clientes, créditos y pagos.
            Simplifica tu gestión financiera con YaPresto.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/register"
              className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-3 rounded-lg text-lg font-semibold shadow-lg transition"
            >
              Comenzar Gratis
            </a>
            <a
              href="/login"
              className="bg-blue-700 text-white hover:bg-blue-600 px-8 py-3 rounded-lg text-lg font-semibold shadow-lg transition"
            >
              Acceder
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">Gestión de Clientes</h3>
            <p className="text-blue-100">
              Administra toda la información de tus clientes de forma segura y organizada.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">Control de Créditos</h3>
            <p className="text-blue-100">
              Crea y gestiona créditos con cálculos automáticos de intereses y cuotas.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Reportes en Tiempo Real</h3>
            <p className="text-blue-100">
              Visualiza el estado de tus operaciones y toma decisiones informadas.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-md border-t border-white/20 py-8 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-blue-100">
          <p>&copy; 2025 YaPresto. Sistema de gestión de créditos.</p>
        </div>
      </footer>
    </div>
  );
}
