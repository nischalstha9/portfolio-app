"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <p>Loading...</p>;

  const cards = [
    { label: "Total Users", value: stats.total_users, color: "#3b82f6" },
    { label: "Active Users", value: stats.active_users, color: "#22c55e" },
    { label: "Total Sections", value: stats.total_sections, color: "#a855f7" },
    { label: "Active API Keys", value: stats.active_api_keys, color: "#f59e0b" },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>Admin Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {cards.map((c) => (
          <div key={c.label} style={{ padding: "1.5rem", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)", borderTop: `3px solid ${c.color}` }}>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>{c.label}</p>
            <p style={{ fontSize: "2rem", fontWeight: 700 }}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
