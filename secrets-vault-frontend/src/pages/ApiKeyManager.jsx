import React, { useState, useEffect } from "react";

export default function ApiKeyManager({
  apiBase = "http://127.0.0.1:5000/api/keys"
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const [revealedId, setRevealedId] = useState(null);
  const [revealedSecret, setRevealedSecret] = useState("");
  const [countdown, setCountdown] = useState(0);


  const token = sessionStorage.getItem("token");
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-700">
        Session expired. Please log in again.
      </div>
    );
  }
  

  // -----------------------------
  // Load existing keys
  // -----------------------------
  useEffect(() => {
    async function loadKeys() {
      setLoading(true);
      try {
        const res = await fetch(apiBase, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch keys");
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadKeys();
  }, [apiBase, token]);

  // -----------------------------
  // Reveal secret
  // -----------------------------
  async function handleReveal(id) {
    if (!window.confirm("Reveal this secret?")) return;
  
    try {
      const res = await fetch(`${apiBase}/${id}?reveal=true`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (!res.ok) throw new Error("Not authorized");
  
      const data = await res.json();
  
      setRevealedId(id);
      setRevealedSecret(data.secret);
      setCountdown(5);
  
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setRevealedId(null);
            setRevealedSecret('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
  
    } catch (err) {
      setError(err.message);
    }
  }
  

  // -----------------------------
  // Delete key
  // -----------------------------
  async function handleDelete(id) {
    if (!window.confirm("Delete this key?")) return;
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Delete failed");
      setEntries(prev => prev.filter(k => k.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-stone-800">
            Secrets Vault
          </h2>
          <p className="text-stone-600 mt-1">
            Securely stored and encrypted API keys
          </p>
        </div>

        {/* STATUS */}
        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-4 rounded-2xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-100 text-green-700 p-4 rounded-2xl">
            {success}
          </div>
        )}

        {/* LIST */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6">
          <h3 className="text-xl font-semibold text-stone-800 mb-4">
            Stored API Keys
          </h3>

          {loading && <div className="text-stone-600">Loading…</div>}
          {!loading && entries.length === 0 && (
            <div className="text-stone-500">No API keys found.</div>
          )}

          <ul className="space-y-4">
            {entries.map(k => (
              <li
                key={k.id}
                className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50
                border border-orange-100 rounded-2xl p-5
                flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="text-lg font-semibold text-stone-800">
                    {k.name}
                  </div>
                  <div className="text-sm text-orange-700">
                    {k.service} • {k.environment}
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                    <button
                      onClick={() => handleReveal(k.id)}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm shadow hover:brightness-110 transition"
                    >
                      Reveal
                    </button>

                    <button
                      onClick={() => handleDelete(k.id)}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm shadow hover:brightness-110 transition"
                    >
                      Delete
                    </button>
                  </div>

              </li>
            ))}
          </ul>

          {/* ✅ REVEALED SECRET (NOW CORRECTLY PLACED) */}
          {revealedId && (
            <div className="mt-6 p-4 rounded-2xl bg-orange-100 border border-orange-300">
              <div className="text-sm text-orange-800 font-semibold mb-1">
                 Revealed Secret (auto hides in {countdown}s)
              </div>

              <div className="font-mono break-all text-red-700">
                {revealedSecret}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
