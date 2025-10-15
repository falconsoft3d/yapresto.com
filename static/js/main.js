// Main JavaScript for YaPresto Application

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });

    // Search functionality
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                e.target.form.submit();
            }
        });
    }

    // Confirm delete actions
    const deleteButtons = document.querySelectorAll('[data-confirm-delete]');
    deleteButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const message = button.getAttribute('data-confirm-delete') || '¿Estás seguro de que quieres eliminar este elemento?';
            if (confirm(message)) {
                window.location.href = button.href;
            }
        });
    });

    // Loading states for forms
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(function(button) {
        const form = button.closest('form');
        if (form) {
            form.addEventListener('submit', function(e) {
                // Solo aplicar loading state si el formulario es válido
                if (form.checkValidity() && !form.classList.contains('login-form')) {
                    button.disabled = true;
                    const originalText = button.innerHTML;
                    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
                    
                    // Restaurar después de 3 segundos como fallback
                    setTimeout(function() {
                        button.disabled = false;
                        button.innerHTML = originalText;
                    }, 3000);
                }
            });
        }
    });

    // Real-time clock in navbar
    function updateClock() {
        const now = new Date();
        const clockElement = document.querySelector('.navbar-clock');
        if (clockElement) {
            const options = { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit'
            };
            clockElement.textContent = now.toLocaleDateString('es-ES', options);
        }
    }

    // Update clock every minute
    updateClock();
    setInterval(updateClock, 60000);

    // Stats counter animation
    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const increment = target / 100;
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 20);
        });
    }

    // Trigger counter animation when stats cards are visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    });

    const statsSection = document.querySelector('.stats-cards');
    if (statsSection) {
        observer.observe(statsSection);
    }

    // Table row hover effects
    const tableRows = document.querySelectorAll('.table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(13, 110, 253, 0.05)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });

    // Dynamic form calculations (for loan calculator)
    const loanForm = document.querySelector('#loanCalculator');
    if (loanForm) {
        const monthlyPaymentCalc = () => {
            const amount = parseFloat(document.getElementById('loan_amount').value) || 0;
            const rate = parseFloat(document.getElementById('interest_rate').value) || 0;
            const months = parseInt(document.getElementById('loan_term').value) || 0;
            
            if (amount > 0 && rate > 0 && months > 0) {
                const monthlyRate = rate / 100 / 12;
                const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                               (Math.pow(1 + monthlyRate, months) - 1);
                
                const paymentElement = document.getElementById('monthly_payment');
                if (paymentElement) {
                    paymentElement.textContent = `$${payment.toFixed(2)}`;
                }
            }
        };

        ['loan_amount', 'interest_rate', 'loan_term'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', monthlyPaymentCalc);
            }
        });
    }
});

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date(date));
}

// Export for global use
window.YaPresto = {
    formatCurrency,
    formatDate
};