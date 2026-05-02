"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { portfolioUrl } from "@/lib/domains";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    setUsers(await res.json());
  }

  async function toggleActive(id: string, name: string, isActive: boolean) {
    const action = isActive ? "disable" : "enable";
    if (!confirm(`${isActive ? "Disable" : "Enable"} user "${name}"? ${isActive ? "They will not be able to log in or access their portfolio." : "They will regain access to their account."}`)) return;
    const token = getToken()!;
    await fetch(`${API_BASE}/admin/users/${id}/toggle-active`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    await loadUsers();
  }

  async function toggleAdmin(id: string) {
    const token = getToken()!;
    await fetch(`${API_BASE}/admin/users/${id}/toggle-admin`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    await loadUsers();
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This will permanently remove all their data and cannot be undone.`)) return;
    const token = getToken()!;
    await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await loadUsers();
  }

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>Manage Users</h1>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "0.75rem" }}>Name</th>
              <th style={{ padding: "0.75rem" }}>Email</th>
              <th style={{ padding: "0.75rem" }}>Slug</th>
              <th style={{ padding: "0.75rem" }}>Status</th>
              <th style={{ padding: "0.75rem" }}>Role</th>
              <th style={{ padding: "0.75rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)", opacity: u.is_active ? 1 : 0.6 }}>
                <td style={{ padding: "0.75rem" }}>{u.full_name}</td>
                <td style={{ padding: "0.75rem", color: "var(--muted)" }}>{u.email}</td>
                <td style={{ padding: "0.75rem" }}>
                  <a href={portfolioUrl(u.slug)} target="_blank">{u.slug}</a>
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <span style={{
                    fontSize: "0.8rem",
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: u.is_active ? "#1a2e1a" : "#2e1a1a",
                    color: u.is_active ? "#22c55e" : "#ef4444",
                    fontWeight: 600,
                  }}>
                    {u.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <span style={{ fontSize: "0.8rem", padding: "2px 8px", borderRadius: 4, background: u.is_admin ? "#1a1a2e" : "var(--surface)", color: u.is_admin ? "#a855f7" : "var(--muted)" }}>
                    {u.is_admin ? "Admin" : "User"}
                  </span>
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.75rem",
                        border: "1px solid",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: u.is_active ? "#2e1a1a" : "#1a2e1a",
                        borderColor: u.is_active ? "#ef4444" : "#22c55e",
                        color: u.is_active ? "#ef4444" : "#22c55e",
                      }}
                      onClick={() => toggleActive(u.id, u.full_name, u.is_active)}
                    >
                      {u.is_active ? "Disable" : "Enable"}
                    </button>
                    <button className="btn-outline" style={{ padding: "3px 8px", fontSize: "0.75rem" }} onClick={() => toggleAdmin(u.id)}>
                      {u.is_admin ? "Remove Admin" : "Make Admin"}
                    </button>
                    <button className="btn-danger" style={{ padding: "3px 8px", fontSize: "0.75rem" }} onClick={() => deleteUser(u.id, u.full_name)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
