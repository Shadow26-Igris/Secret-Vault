import { useState } from 'react';

export default function CreateKey({ onCreated }) {
  const [form, setForm] = useState({
    name: '',
    service: '',
    environment: 'production',
    secret: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Failed to save API key');
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 p-8">
      <div className="max-w-xl mx-auto bg-white/90 backdrop-blur p-8 rounded-3xl shadow-xl">

        <h2 className="text-2xl font-bold text-stone-800 mb-2">
          Add New API Key
        </h2>
        <p className="text-stone-600 mb-6">
          Secrets are encrypted before storage
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Key Name"
            className="w-full p-3 rounded-xl border border-stone-300"
            onChange={e => update('name', e.target.value)}
            required
          />

          <input
            placeholder="Service (GitHub, OpenAI)"
            className="w-full p-3 rounded-xl border border-stone-300"
            onChange={e => update('service', e.target.value)}
            required
          />

          <select
            className="w-full p-3 rounded-xl border border-stone-300"
            onChange={e => update('environment', e.target.value)}
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>

          <input
            placeholder="Secret API Key"
            type="password"
            className="w-full p-3 rounded-xl border border-stone-300"
            onChange={e => update('secret', e.target.value)}
            required
          />

          {error && (
            <div className="text-red-700 bg-red-100 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white
            bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500
            hover:brightness-110 transition"
          >
            {loading ? 'Saving…' : 'Save API Key'}
          </button>
        </form>
      </div>
    </div>
  );
}
