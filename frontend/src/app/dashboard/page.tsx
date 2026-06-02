"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";
import MarkdownEditor from "@/components/MarkdownEditor";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getToken();
    if (token) api.getMe(token).then(setUser);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const token = getToken()!;
      const { full_name, slug, headline, summary, location, phone, website, linkedin, github, custom_domain, page_title } = user;
      const updated = await api.updateMe(token, { full_name, slug, headline, summary, location, phone, website, linkedin, github, custom_domain: custom_domain || null, page_title: page_title || null });
      setUser(updated);
      setMessage("Profile saved.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <p>Loading...</p>;

  const fields = [
    { key: "full_name", label: "Full Name", type: "text" },
    { key: "slug", label: "Slug", type: "text" },
    { key: "headline", label: "Headline", type: "text" },
    { key: "location", label: "Location", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "website", label: "Website", type: "url" },
    { key: "linkedin", label: "LinkedIn", type: "url" },
    { key: "github", label: "GitHub", type: "url" },
  ];

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Profile</h1>
      {message && <p style={{ marginBottom: "1rem", color: message.includes("saved") ? "lightgreen" : "var(--danger)" }}>{message}</p>}
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {fields.map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 4, display: "block" }}>{f.label}</label>
            <input
              type={f.type}
              value={user[f.key] || ""}
              onChange={(e) => setUser({ ...user, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <div>
          <label style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 4, display: "block" }}>Summary (Markdown supported)</label>
          <MarkdownEditor
            value={user.summary || ""}
            onChange={(v) => setUser({ ...user, summary: v })}
          />
        </div>
        <div style={{ borderTop: "1px solid #333", paddingTop: "1rem", marginTop: "0.5rem" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 4, display: "block" }}>Page Title</label>
          <input
            type="text"
            placeholder={`Portfolio | ${user.full_name || "Your Name"}`}
            value={user.page_title || ""}
            onChange={(e) => setUser({ ...user, page_title: e.target.value })}
          />
          <p style={{ fontSize: "0.75rem", color: "#666", marginTop: 4 }}>
            Browser tab title for your public portfolio. Defaults to &quot;Portfolio | {user.full_name}&quot;
          </p>
        </div>
        <div>
          <label style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 4, display: "block" }}>Custom Domain</label>
          <input
            type="text"
            placeholder="me.example.com"
            value={user.custom_domain || ""}
            onChange={(e) => setUser({ ...user, custom_domain: e.target.value })}
          />
          <p style={{ fontSize: "0.75rem", color: "#666", marginTop: 4 }}>
            Point a CNAME record for your domain to <code style={{ color: "#888" }}>{user.slug}.public-resume.app.{process.env.NEXT_PUBLIC_MAIN_DOMAIN || "portfolio.local"}</code>
          </p>
        </div>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</button>
      </form>
    </div>
  );
}
