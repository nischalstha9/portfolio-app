"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, clearTokens, isLoggedIn } from "@/lib/auth";
import { api } from "@/lib/api";
import { adminUrl, portfolioUrl } from "@/lib/domains";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Profile" },
  { href: "/dashboard/sections", label: "Sections" },
  { href: "/dashboard/api-keys", label: "API Keys" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    api.getMe(getToken()!).then(setUser).catch(() => {
      clearTokens();
      router.replace("/login");
    });
  }, [router]);

  function logout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, background: "var(--surface)", padding: "1.5rem 1rem", borderRight: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>Portfolio</h2>
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
        {user && user.slug && (
          <a href={portfolioUrl(user.slug)} target="_blank" style={{ display: "block", marginTop: "1.5rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", color: "var(--muted)", textAlign: "center" }}>
            View Public Portfolio
          </a>
        )}
        {user && user.is_admin && (
          <a href={adminUrl()} style={{ display: "block", marginTop: "0.5rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", color: "#a855f7", textAlign: "center" }}>
            Admin Panel
          </a>
        )}
        <button onClick={logout} className="btn-outline" style={{ marginTop: "1rem", width: "100%" }}>
          Sign Out
        </button>
      </aside>
      <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
    </div>
  );
}
