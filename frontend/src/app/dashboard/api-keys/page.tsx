"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState("");

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    const token = getToken();
    if (token) {
      const data = await api.listApiKeys(token);
      setKeys(data);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken()!;
    const key = await api.createApiKey(token, name);
    setNewKey(key.key);
    setName("");
    await loadKeys();
  }

  async function handleRevoke(id: string) {
    const token = getToken()!;
    await api.revokeApiKey(token, id);
    await loadKeys();
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ marginBottom: "1.5rem" }}>API Keys</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Generate read-only API keys to use your resume data in custom frontends. Pass the key as a Bearer token.
      </p>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input placeholder="Key name (e.g. My Website)" value={name} onChange={(e) => setName(e.target.value)} required />
        <button type="submit">Generate</button>
      </form>

      {newKey && (
        <div style={{ padding: "1rem", background: "#1a2e1a", border: "1px solid #2d5a2d", borderRadius: 8, marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.85rem", marginBottom: 8 }}>Copy this key now — it won&apos;t be shown again:</p>
          <code style={{ wordBreak: "break-all", fontSize: "0.85rem" }}>{newKey}</code>
        </div>
      )}

      {keys.length === 0 && <p style={{ color: "var(--muted)" }}>No API keys yet.</p>}

      {keys.map((k) => (
        <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", marginBottom: "0.5rem", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <div>
            <strong>{k.name}</strong>
            <span style={{ marginLeft: 12, fontSize: "0.8rem", color: k.is_active ? "lightgreen" : "var(--danger)" }}>
              {k.is_active ? "Active" : "Revoked"}
            </span>
            <span style={{ marginLeft: 12, fontSize: "0.75rem", color: "var(--muted)" }}>
              {k.key.slice(0, 12)}...
            </span>
          </div>
          {k.is_active && (
            <button className="btn-danger" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleRevoke(k.id)}>
              Revoke
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
