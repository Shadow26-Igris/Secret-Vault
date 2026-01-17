export function isLoggedIn() {
    return !!sessionStorage.getItem('token');
  }
  
  export function logout() {
    sessionStorage.removeItem('token');
    window.location.href = '/';
  }
  