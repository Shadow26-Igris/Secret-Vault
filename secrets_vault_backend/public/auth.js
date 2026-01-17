async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  
    const data = await res.json();
  
    if (!res.ok) {
      document.getElementById('error').innerText = data.error;
      return;
    }
  
    localStorage.setItem('token', data.token);
    window.location.href = '/dashboard.html';
  }
  