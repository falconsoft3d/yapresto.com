from django.shortcuts import render, redirect
from django.contrib.auth.views import LoginView
from django.contrib.auth.forms import UserCreationForm, PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.generic import CreateView
from django.urls import reverse_lazy
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, update_session_auth_hash
from .forms import EditarUsuarioForm, PerfilUsuarioForm, EditarPerfilPersonalForm, PerfilPersonalForm, CambiarPasswordForm

class CustomLoginView(LoginView):
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True
    
    def dispatch(self, request, *args, **kwargs):
        print(f"=== LOGIN DISPATCH === Method: {request.method}")
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        print(f"=== LOGIN POST === Username: {request.POST.get('username')}")
        return super().post(request, *args, **kwargs)
    
    def form_valid(self, form):
        print(f"=== LOGIN FORM_VALID === Usuario: {form.get_user().username}")
        messages.success(self.request, f'Bienvenido {form.get_user().username}!')
        response = super().form_valid(form)
        print(f"=== LOGIN REDIRECT === URL: {response.url if hasattr(response, 'url') else 'No URL'}")
        return response
    
    def form_invalid(self, form):
        print(f"=== LOGIN FORM_INVALID === Errores: {form.errors}")
        messages.error(self.request, 'Usuario o contraseña incorrectos.')
        return super().form_invalid(form)

class RegisterView(CreateView):
    form_class = UserCreationForm
    template_name = 'accounts/register.html'
    success_url = reverse_lazy('accounts:login')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Usuario creado exitosamente. Ya puedes iniciar sesión.')
        return response

@login_required
def profile(request):
    """Vista del perfil del usuario"""
    return render(request, 'accounts/profile.html', {'user': request.user})

@login_required
def editar_perfil(request):
    """Editar perfil del usuario"""
    if request.method == 'POST':
        user_form = EditarPerfilPersonalForm(request.POST, instance=request.user)
        
        # Obtener o crear el perfil si no existe
        from .models import PerfilUsuario
        perfil, created = PerfilUsuario.objects.get_or_create(user=request.user)
        perfil_form = PerfilPersonalForm(request.POST, instance=perfil)
        
        if user_form.is_valid() and perfil_form.is_valid():
            user_form.save()
            perfil_form.save()
            messages.success(request, 'Tu perfil ha sido actualizado exitosamente.')
            return redirect('accounts:profile')
        else:
            messages.error(request, 'Por favor corrige los errores en el formulario.')
    else:
        user_form = EditarPerfilPersonalForm(instance=request.user)
        
        # Obtener o crear el perfil si no existe
        from .models import PerfilUsuario
        perfil, created = PerfilUsuario.objects.get_or_create(user=request.user)
        perfil_form = PerfilPersonalForm(instance=perfil)
    
    context = {
        'user_form': user_form,
        'perfil_form': perfil_form,
    }
    return render(request, 'accounts/editar_perfil.html', context)

@login_required
def cambiar_password(request):
    """Cambiar contraseña del usuario"""
    if request.method == 'POST':
        form = CambiarPasswordForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            # Importante: actualizar la sesión para que no se cierre automáticamente
            update_session_auth_hash(request, user)
            messages.success(request, 'Tu contraseña ha sido cambiada exitosamente.')
            return redirect('accounts:profile')
        else:
            messages.error(request, 'Por favor corrige los errores en el formulario.')
    else:
        form = CambiarPasswordForm(request.user)
    
    return render(request, 'accounts/cambiar_password.html', {'form': form})
