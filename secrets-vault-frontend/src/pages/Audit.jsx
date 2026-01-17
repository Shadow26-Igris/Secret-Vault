import { useEffect, useState } from 'react';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/audit', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setLogs)
      .catch(console.error);
  }, []);

  return (
    <div className="p-6 bg-orange-50 rounded-3xl">
      <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th>Action</th>
            <th>User</th>
            <th>Key</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l, i) => (
            <tr key={i} className="border-b">
              <td>{l.action}</td>
              <td>{l.actor_id}</td>
              <td className="font-mono">
                {l.key_name || l.key_id}
              </td>
              <td>{new Date(l.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
