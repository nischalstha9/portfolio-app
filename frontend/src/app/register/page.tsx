"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setTokens } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", slug: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.register(form);
      setTokens(res.access_token, res.refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Register</h1>
      {error && <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input placeholder="Full Name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        <input placeholder="Slug (e.g. john-doe)" value={form.slug} onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Creating account..." : "Register"}</button>
      </form>
      <p style={{ marginTop: "1rem", color: "var(--muted)" }}>
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </main>
  );
}
