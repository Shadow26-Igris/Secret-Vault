import { useState } from 'react';
import Login from './auth/Login';
import Temp from './pages/temp';

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!sessionStorage.getItem('token')
  );

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return <Temp onLogout={() => {
    sessionStorage.removeItem('token');
    setLoggedIn(false);
  }} />;
}

export default App;
