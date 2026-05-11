import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

type FileEntry = { key: string; size: number; uploaded: string };

async function listFiles(): Promise<FileEntry[]> {
  const response = await fetch("/api/files");
  if (!response.ok) return [];
  const { objects } = (await response.json()) as { objects: FileEntry[] };
  return objects;
}

export const Route = createFileRoute("/")({
  loader: () => listFiles(),
  component: Home,
});

function Home() {
  const initialFiles = Route.useLoaderData();
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setFiles(await listFiles());
  }

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await fetch(`/api/files/${encodeURIComponent(file.name)}`, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      await refresh();
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function onDelete(key: string) {
    await fetch(`/api/files/${encodeURIComponent(key)}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "4rem 1.5rem",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "2.5rem" }}>TanStack Start + R2</h1>
      <p style={{ marginTop: "1rem", lineHeight: 1.6 }}>
        Upload a file. It gets stored in the R2 bucket bound to this Worker and
        served back through <code>/api/files/$key</code>.
      </p>

      <label
        style={{
          display: "inline-block",
          marginTop: "1.5rem",
          padding: "0.75rem 1rem",
          background: "#0f172a",
          color: "#fff",
          borderRadius: 8,
          cursor: uploading ? "not-allowed" : "pointer",
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? "Uploading..." : "Upload a file"}
        <input
          type="file"
          onChange={onUpload}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>

      <ul
        style={{
          marginTop: "2rem",
          padding: 0,
          listStyle: "none",
          display: "grid",
          gap: "0.5rem",
        }}
      >
        {files.length === 0 && (
          <li style={{ color: "#64748b" }}>No files yet.</li>
        )}
        {files.map((file) => (
          <li
            key={file.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              padding: "0.75rem 1rem",
              background: "#e2e8f0",
              borderRadius: 8,
            }}
          >
            <a
              href={`/api/files/${encodeURIComponent(file.key)}`}
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              {file.key}
            </a>
            <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
              {file.size} B
            </span>
            <button
              type="button"
              onClick={() => onDelete(file.key)}
              style={{
                padding: "0.25rem 0.75rem",
                border: "none",
                borderRadius: 6,
                background: "#dc2626",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
