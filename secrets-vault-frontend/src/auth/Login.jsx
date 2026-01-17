import { useState } from 'react';
import bgImage from '../assets/orion.jpg';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) throw new Error('Invalid credentials');

      const data = await res.json();
      sessionStorage.setItem('token', data.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-orange-100 to-amber-100">
      <div className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-white/80 backdrop-blur-md">

        {/* LEFT IMAGE PANEL */}
        <div
          className="hidden md:block bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="h-full w-full bg-gradient-to-br from-black/40 via-black/60 to-black/80 flex items-end p-10">
            <div>
              <h2 className="text-white text-4xl font-bold tracking-wide">
                Secrets Vault
              </h2>
              <p className="text-orange-200 mt-3 text-sm max-w-sm">
                A secure platform to store, manage, and audit sensitive API keys
                with encryption and role-based access.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN FORM */}
        <div className="p-10 md:p-14 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-stone-800 mb-1">
            Sign in
          </h2>
          <p className="text-stone-600 mb-8">
            Access your secure secrets vault
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-stone-700">Email</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>

            <div>
              <label className="text-sm text-stone-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full mt-1 p-3 pr-12 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-4 text-sm text-stone-600 hover:text-stone-800"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-700 text-sm bg-red-100 p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-red-500 via-orange-500 to-amber-500
              hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>

          <p className="text-xs text-stone-600 mt-10 text-center">
            Restricted access • Secrets Vault © 2025
          </p>
        </div>
      </div>
    </div>
  );
}
