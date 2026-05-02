"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, clearTokens, isLoggedIn } from "@/lib/auth";
import { api } from "@/lib/api";
import { appUrl } from "@/lib/domains";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    api.getMe(getToken()!).then((u) => {
      if (!u.is_admin) {
        window.location.href = appUrl("/dashboard");
        return;
      }
      setUser(u);
      setChecked(true);
    }).catch(() => {
      clearTokens();
      router.replace("/login");
    });
  }, [router]);

  if (!checked) return <div style={{ padding: "2rem" }}>Loading...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, background: "var(--surface)", padding: "1.5rem 1rem", borderRight: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>Admin Panel</h2>
        {user && <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1.5rem" }}>{user.full_name}</p>}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: 6,
                background: pathname === item.href ? "var(--accent)" : "transparent",
                color: pathname === item.href ? "white" : "var(--fg)",
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <a href={appUrl("/dashboard")} style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem", color: "var(--muted)" }}>Back to Dashboard</a>
          <button onClick={() => { clearTokens(); router.replace("/login"); }} className="btn-outline" style={{ width: "100%" }}>
            Sign Out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
    </div>
  );
}
