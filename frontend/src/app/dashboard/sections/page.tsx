"use client";

import { useEffect, useState, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MarkdownEditor from "@/components/MarkdownEditor";

const SECTION_TYPES = ["experience", "education", "skills", "projects", "certifications", "custom"];

function SortableCard({ section, onEdit, onDelete, onToggleVisibility, isEditing }: {
  section: any;
  onEdit: (s: any) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, current: boolean) => void;
  isEditing?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : section.is_visible ? 1 : 0.45,
    padding: "1rem",
    marginBottom: "0.5rem",
    background: isEditing ? "var(--accent)" : "var(--surface)",
    borderRadius: 8,
    border: `2px solid ${isEditing ? "var(--accent)" : isDragging ? "var(--accent)" : "var(--border)"}`,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ display: "flex", alignItems: "start", gap: "0.75rem", flex: 1 }}>
          <button
            {...attributes}
            {...listeners}
            style={{ cursor: "grab", background: "none", border: "none", padding: "2px 4px", color: "var(--muted)", fontSize: "1.1rem", lineHeight: 1, touchAction: "none" }}
            title="Drag to reorder"
          >
            &#x2630;
          </button>
          <div style={{ flex: 1 }}>
            <span style={{ textDecoration: section.is_visible ? "none" : "line-through" }}>
              <strong>{section.title}</strong>
            </span>
            {section.subtitle && <span style={{ color: "var(--muted)", marginLeft: 8 }}>{section.subtitle}</span>}
            {!section.is_visible && <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#ef4444" }}>hidden</span>}
            {section.description && (
              <p style={{ marginTop: 6, fontSize: "0.85rem", color: "var(--muted)", whiteSpace: "pre-line", maxHeight: 60, overflow: "hidden" }}>
                {section.description}
              </p>
            )}
            {(section.start_date || section.end_date) && (
              <p style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--muted)" }}>
                {section.start_date} {section.end_date ? `- ${section.end_date}` : section.is_current ? "- Present" : ""}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          <button
            onClick={() => onToggleVisibility(section.id, section.is_visible)}
            style={{
              padding: "4px 8px", fontSize: "1rem", background: "none", border: "1px solid var(--border)",
              borderRadius: 6, cursor: "pointer", color: section.is_visible ? "var(--fg)" : "var(--muted)",
              lineHeight: 1,
            }}
            title={section.is_visible ? "Hide from public portfolio" : "Show on public portfolio"}
          >
            {section.is_visible ? "\u{1F441}" : "\u{1F441}\u{200D}\u{1F5E8}"}
          </button>
          <button className="btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => onEdit(section)}>Edit</button>
          <button className="btn-danger" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => onDelete(section.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function SortableTypeGroup({ type, count, collapsed, onToggle, children }: { type: string; count: number; collapsed: boolean; onToggle: () => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: type });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    marginBottom: "1.25rem",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <h2
        onClick={onToggle}
        style={{ fontSize: "1.1rem", textTransform: "capitalize" as const, marginBottom: collapsed ? 0 : "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}
      >
        <span
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: "grab", color: "var(--muted)", fontSize: "0.9rem", touchAction: "none", userSelect: "none" }}
          title="Drag to reorder section group"
        >
          &#x2195;
        </span>
        <span style={{ fontSize: "0.85rem", color: "var(--muted)", transition: "transform 0.2s", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", display: "inline-block" }}>&#x25BC;</span>
        {type}
        <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 400 }}>({count})</span>
      </h2>
      {!collapsed && children}
    </div>
  );
}

export default function SectionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [typeOrder, setTypeOrder] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "experience", title: "", subtitle: "", description: "", start_date: "", end_date: "", is_current: false, url: "" });
  const [message, setMessage] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    loadSections();
    loadTypeOrder();
  }, []);

  async function loadSections() {
    const token = getToken();
    if (token) {
      const data = await api.listSections(token);
      setSections(data);
    }
  }

  async function loadTypeOrder() {
    const token = getToken();
    if (token) {
      const user = await api.getMe(token);
      if (user.section_type_order) {
        try {
          setTypeOrder(JSON.parse(user.section_type_order));
        } catch {
          setTypeOrder([]);
        }
      }
    }
  }

  function resetForm() {
    setForm({ type: "experience", title: "", subtitle: "", description: "", start_date: "", end_date: "", is_current: false, url: "" });
    setShowForm(false);
    setEditing(null);
  }

  function startEdit(s: any) {
    setForm({ type: s.type, title: s.title, subtitle: s.subtitle || "", description: s.description || "", start_date: s.start_date || "", end_date: s.end_date || "", is_current: s.is_current, url: s.url || "" });
    setEditing(s.id);
    setShowForm(true);
    // Auto-expand the group when editing
    setCollapsedGroups((prev) => ({ ...prev, [s.type]: false }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const token = getToken()!;
    try {
      if (editing) {
        await api.updateSection(token, editing, form);
      } else {
        const typeSections = sections.filter((s) => s.type === form.type);
        await api.createSection(token, { ...form, sort_order: typeSections.length });
      }
      await loadSections();
      resetForm();
      setMessage("Section saved.");
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id: string) {
    const token = getToken()!;
    await api.deleteSection(token, id);
    await loadSections();
  }

  async function handleToggleVisibility(id: string, currentlyVisible: boolean) {
    const token = getToken()!;
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, is_visible: !currentlyVisible } : s));
    try {
      await api.updateSection(token, id, { is_visible: !currentlyVisible });
    } catch {
      await loadSections();
    }
  }

  const handleItemDragEnd = useCallback(async (event: DragEndEvent, type: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const typeSections = sections.filter((s) => s.type === type);
    const oldIndex = typeSections.findIndex((s) => s.id === active.id);
    const newIndex = typeSections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(typeSections, oldIndex, newIndex);
    const reorderItems = reordered.map((s, i) => ({ id: s.id, sort_order: i }));

    const newSections = sections.map((s) => {
      const item = reorderItems.find((r) => r.id === s.id);
      return item ? { ...s, sort_order: item.sort_order } : s;
    });
    setSections(newSections);

    const token = getToken()!;
    try {
      await api.reorderSections(token, reorderItems);
    } catch {
      await loadSections();
    }
  }, [sections]);

  async function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = allTypes.findIndex((t) => t === active.id);
    const newIndex = allTypes.findIndex((t) => t === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(allTypes, oldIndex, newIndex);
    setTypeOrder(newOrder);

    const token = getToken()!;
    try {
      await api.updateMe(token, { section_type_order: JSON.stringify(newOrder) });
    } catch {
      await loadTypeOrder();
    }
  }

  const grouped: Record<string, any[]> = {};
  for (const s of sections) {
    if (!grouped[s.type]) grouped[s.type] = [];
    grouped[s.type].push(s);
  }
  for (const type in grouped) {
    grouped[type].sort((a: any, b: any) => a.sort_order - b.sort_order);
  }

  const presentTypes = Object.keys(grouped);
  let allTypes: string[];
  if (typeOrder.length > 0) {
    const ordered = typeOrder.filter((t) => presentTypes.includes(t));
    const remaining = presentTypes.filter((t) => !typeOrder.includes(t));
    allTypes = [...ordered, ...remaining];
  } else {
    const defaultOrder = SECTION_TYPES.filter((t) => grouped[t]);
    const extra = presentTypes.filter((t) => !SECTION_TYPES.includes(t));
    allTypes = [...defaultOrder, ...extra];
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>Sections</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}>{showForm ? "Cancel" : "Add Section"}</button>
      </div>

      {message && <p style={{ marginBottom: "1rem", color: "lightgreen" }}>{message}</p>}

      {showForm && !editing && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem", padding: "1rem", background: "var(--surface)", borderRadius: 8 }}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {SECTION_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input placeholder="Subtitle (e.g. company, institution)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Description (Markdown supported)</label>
          <MarkdownEditor
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            sectionId={editing || undefined}
            token={getToken() || undefined}
          />
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input placeholder="Start date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <input placeholder="End date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} disabled={form.is_current} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem" }}>
            <input type="checkbox" checked={form.is_current} onChange={(e) => setForm({ ...form, is_current: e.target.checked })} style={{ width: "auto" }} /> Current
          </label>
          <input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <button type="submit">Create Section</button>
        </form>
      )}

      {allTypes.length === 0 && <p style={{ color: "var(--muted)" }}>No sections yet. Add your first section above.</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
        <SortableContext items={allTypes} strategy={verticalListSortingStrategy}>
          {allTypes.map((type) => (
            <SortableTypeGroup
              key={type}
              type={type}
              count={grouped[type].length}
              collapsed={!!collapsedGroups[type]}
              onToggle={() => setCollapsedGroups((prev) => ({ ...prev, [type]: !prev[type] }))}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleItemDragEnd(e, type)}
              >
                <SortableContext items={grouped[type].map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                  {grouped[type].map((s: any) => (
                    <div key={s.id}>
                      <SortableCard section={s} onEdit={startEdit} onDelete={handleDelete} onToggleVisibility={handleToggleVisibility} isEditing={editing === s.id} />
                      {editing === s.id && (
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem", marginTop: "0.5rem", padding: "1rem", background: "var(--surface)", borderRadius: 8, border: "2px solid var(--accent)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1rem" }}>Edit Section</h3>
                            <button type="button" onClick={resetForm} style={{ padding: "4px 8px", fontSize: "0.8rem" }}>Cancel</button>
                          </div>
                          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            {SECTION_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                          </select>
                          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                          <input placeholder="Subtitle (e.g. company, institution)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
                          <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Description (Markdown supported)</label>
                          <MarkdownEditor
                            value={form.description}
                            onChange={(v) => setForm({ ...form, description: v })}
                            sectionId={editing || undefined}
                            token={getToken() || undefined}
                          />
                          <div style={{ display: "flex", gap: "0.75rem" }}>
                            <input placeholder="Start date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                            <input placeholder="End date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} disabled={form.is_current} />
                          </div>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem" }}>
                            <input type="checkbox" checked={form.is_current} onChange={(e) => setForm({ ...form, is_current: e.target.checked })} style={{ width: "auto" }} /> Current
                          </label>
                          <input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                          <button type="submit">Update Section</button>
                        </form>
                      )}
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            </SortableTypeGroup>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
