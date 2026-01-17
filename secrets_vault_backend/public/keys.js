async function loadKeys() {
    const res = await apiFetch('/api/keys/mine');
    const keys = await res.json();
  
    const ul = document.getElementById('keys');
    ul.innerHTML = '';
  
    keys.forEach(k => {
      const li = document.createElement('li');
      li.innerText = `${k.name} (${k.service})`;
      ul.appendChild(li);
    });
  }
  
  loadKeys();
  