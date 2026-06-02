import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MarkdownRenderer from "@/components/MarkdownRenderer";

const API_BASE = process.env.API_INTERNAL_URL || "http://backend:8000";

async function getProfile(slug: string) {
  const res = await fetch(`${API_BASE}/api/users/profile/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getSections(slug: string) {
  const res = await fetch(`${API_BASE}/api/users/profile/${slug}/sections`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) return { title: "Not Found" };
  return { title: profile.page_title || `Portfolio | ${profile.full_name}` };
}

export default async function PortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const sections = await getSections(slug);
  const grouped: Record<string, any[]> = {};
  for (const s of sections) {
    if (!grouped[s.type]) grouped[s.type] = [];
    grouped[s.type].push(s);
  }

  const defaultTypeOrder = ["experience", "education", "skills", "projects", "certifications", "custom"];
  let userTypeOrder: string[] = [];
  if (profile.section_type_order) {
    try { userTypeOrder = JSON.parse(profile.section_type_order); } catch {}
  }
  const typeOrder = userTypeOrder.length > 0 ? userTypeOrder : defaultTypeOrder;

  const presentTypes = Object.keys(grouped);
  const ordered = typeOrder.filter((t) => presentTypes.includes(t));
  const remaining = presentTypes.filter((t) => !typeOrder.includes(t));
  const sortedTypes = [...ordered, ...remaining];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <header style={{ marginBottom: "3rem", borderBottom: "1px solid #2a2a2a", paddingBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ededed" }}>
          {profile.full_name}
        </h1>
        {profile.headline && (
          <p style={{ fontSize: "1.2rem", color: "#888", marginBottom: "1rem" }}>{profile.headline}</p>
        )}
        {profile.summary && (
          <div style={{ fontSize: "1rem", lineHeight: 1.7, color: "#bbb", marginBottom: "1rem" }}>
            <MarkdownRenderer content={profile.summary} />
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.9rem" }}>
          {profile.location && <span style={{ color: "#888" }}>{profile.location}</span>}
          {profile.website && <a href={profile.website} target="_blank" style={{ color: "#3b82f6" }}>{profile.website.replace(/^https?:\/\//, "")}</a>}
          {profile.linkedin && <a href={profile.linkedin} target="_blank" style={{ color: "#3b82f6" }}>LinkedIn</a>}
          {profile.github && <a href={profile.github} target="_blank" style={{ color: "#3b82f6" }}>GitHub</a>}
        </div>
      </header>

      {sortedTypes.map((type) => (
        <section key={type} style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 600, color: "#ededed", marginBottom: "1.25rem", textTransform: "capitalize", borderBottom: "1px solid #2a2a2a", paddingBottom: "0.5rem" }}>
            {type}
          </h2>
          {grouped[type].map((item: any) => (
            <div key={item.id} style={{ marginBottom: "1.5rem", paddingLeft: "1rem", borderLeft: "2px solid #3b82f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ededed" }}>
                  {item.url ? <a href={item.url} target="_blank" style={{ color: "#ededed" }}>{item.title}</a> : item.title}
                </h3>
                {(item.start_date || item.end_date) && (
                  <span style={{ fontSize: "0.85rem", color: "#888" }}>
                    {item.start_date}{item.end_date ? ` - ${item.end_date}` : item.is_current ? " - Present" : ""}
                  </span>
                )}
              </div>
              {item.subtitle && <p style={{ fontSize: "0.95rem", color: "#a0a0a0", marginTop: "0.25rem" }}>{item.subtitle}</p>}
              {item.description && (
                <div style={{ fontSize: "0.9rem", color: "#bbb", marginTop: "0.5rem", lineHeight: 1.7 }}>
                  <MarkdownRenderer content={item.description} />
                </div>
              )}
            </div>
          ))}
        </section>
      ))}

      {sortedTypes.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", padding: "3rem 0" }}>This portfolio is being set up.</p>
      )}

    </div>
  );
}
