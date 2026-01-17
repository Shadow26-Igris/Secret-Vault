import { useState } from 'react';
import ApiKeyManager from './ApiKeyManager';
import CreateKey from './CreateKey';
import Audit from './Audit';

export default function Temp({ onLogout }) {
  const [view, setView] = useState('list');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">

      {/* TOP BAR */}
      <header className="bg-white/80 backdrop-blur shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-stone-800">
          Secrets Vault
        </h1>
        <button
          onClick={onLogout}
          className="text-red-600 font-medium hover:underline"
        >
          Logout
        </button>
      </header>

      {/* NAVIGATION */}
      <nav className="bg-white/70 backdrop-blur px-6 py-3 flex gap-6 border-b border-orange-100">
        <button
          className={`${
            view === 'list' ? 'font-semibold text-orange-700' : 'text-stone-600'
          }`}
          onClick={() => setView('list')}
        >
          View API Keys
        </button>

        <button
          className={`${
            view === 'create' ? 'font-semibold text-orange-700' : 'text-stone-600'
          }`}
          onClick={() => setView('create')}
        >
          Add New API Key
        </button>

        <button
          className={`${
            view === 'audit' ? 'font-semibold text-orange-700' : 'text-stone-600'
          }`}
          onClick={() => setView('audit')}
        >
          Audit Logs
        </button>
      </nav>

      {/* CONTENT */}
      <main className="p-6">
        {view === 'list' && <ApiKeyManager />}
        {view === 'create' && <CreateKey onCreated={() => setView('list')} />}
        {view === 'audit' && <Audit />}
      </main>

    </div>
  );
}
