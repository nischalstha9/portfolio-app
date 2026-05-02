"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import MarkdownRenderer from "./MarkdownRenderer";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  sectionId?: string;
  token?: string;
}

function insertAtCursor(textarea: HTMLTextAreaElement, before: string, after: string = "") {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const replacement = before + (selected || "text") + after;
  const newValue = value.slice(0, selectionStart) + replacement + value.slice(selectionEnd);
  return { newValue, cursorPos: selectionStart + before.length + (selected || "text").length };
}

function insertText(textarea: HTMLTextAreaElement, text: string) {
  const { selectionStart, value } = textarea;
  return value.slice(0, selectionStart) + text + value.slice(selectionStart);
}

const btnStyle: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: "0.8rem",
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: 4,
  cursor: "pointer",
  color: "var(--fg)",
  lineHeight: 1,
  fontFamily: "monospace",
};

export default function MarkdownEditor({ value, onChange, sectionId, token }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleToolbar(action: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    let result: { newValue: string; cursorPos: number };
    switch (action) {
      case "bold":
        result = insertAtCursor(ta, "**", "**");
        break;
      case "italic":
        result = insertAtCursor(ta, "*", "*");
        break;
      case "heading":
        result = { newValue: insertText(ta, "## "), cursorPos: ta.selectionStart + 3 };
        break;
      case "link":
        result = insertAtCursor(ta, "[", "](url)");
        break;
      case "list":
        result = { newValue: insertText(ta, "- "), cursorPos: ta.selectionStart + 2 };
        break;
      default:
        return;
    }
    onChange(result.newValue);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(result.cursorPos, result.cursorPos);
    }, 0);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !sectionId || !token) return;
    e.target.value = "";

    setUploading(true);
    try {
      const { upload_url, object_key } = await api.requestMediaUpload(token, sectionId, file.name, file.type);
      await api.uploadToPresignedUrl(upload_url, file);
      const mdLink = file.type.startsWith("video/")
        ? `![${file.name}](/api/cdn/${object_key})`
        : `![${file.name}](/api/cdn/${object_key})`;
      const ta = textareaRef.current;
      if (ta) {
        const newValue = insertText(ta, "\n" + mdLink + "\n");
        onChange(newValue);
      } else {
        onChange(value + "\n" + mdLink + "\n");
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  const canUpload = !!sectionId && !!token;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderBottom: "1px solid var(--border)", background: "var(--bg)", flexWrap: "wrap", gap: 4 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button type="button" style={btnStyle} onClick={() => handleToolbar("bold")} title="Bold"><b>B</b></button>
          <button type="button" style={btnStyle} onClick={() => handleToolbar("italic")} title="Italic"><i>I</i></button>
          <button type="button" style={btnStyle} onClick={() => handleToolbar("heading")} title="Heading">H</button>
          <button type="button" style={btnStyle} onClick={() => handleToolbar("link")} title="Link">&#128279;</button>
          <button type="button" style={btnStyle} onClick={() => handleToolbar("list")} title="List">&#8226;</button>
          <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
          <button
            type="button"
            style={{ ...btnStyle, opacity: canUpload ? 1 : 0.4 }}
            onClick={() => canUpload && fileInputRef.current?.click()}
            disabled={!canUpload || uploading}
            title={canUpload ? "Upload image or video" : "Save section first to upload media"}
          >
            {uploading ? "Uploading..." : "Upload Media"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <button
            type="button"
            onClick={() => setMode("write")}
            style={{ ...btnStyle, background: mode === "write" ? "var(--surface)" : "none", fontFamily: "inherit" }}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            style={{ ...btnStyle, background: mode === "preview" ? "var(--surface)" : "none", fontFamily: "inherit" }}
          >
            Preview
          </button>
        </div>
      </div>

      {mode === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          style={{ width: "100%", border: "none", padding: "0.75rem", resize: "vertical", fontFamily: "monospace", fontSize: "0.9rem", background: "var(--surface)", color: "var(--fg)", outline: "none" }}
          placeholder="Write markdown here... Use toolbar to format or upload media."
        />
      ) : (
        <div style={{ padding: "0.75rem", minHeight: 120, background: "var(--surface)", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--fg)" }}>
          {value ? <MarkdownRenderer content={value} /> : <span style={{ color: "var(--muted)" }}>Nothing to preview</span>}
        </div>
      )}

      {!canUpload && (
        <p style={{ padding: "4px 8px", fontSize: "0.75rem", color: "var(--muted)", borderTop: "1px solid var(--border)", margin: 0 }}>
          Save the section first to enable image/video uploads.
        </p>
      )}
    </div>
  );
}
