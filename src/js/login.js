document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const terms = document.getElementById('termsCheck').checked;

  // Validación básica
  if (!terms) {
    alert('Debes aceptar los términos y condiciones');
    return;
  }

  if ((email === 'admin@pizzaplanet.com' && password === '1234') ||
      (email === 'empleado@pizzaplanet.com' && password === 'pizza')) {
        sessionStorage.setItem('logueado', 'true');
        window.location.href = "index.html";
        
  } else {
    document.getElementById('loginError').classList.remove('d-none');
  }
});


