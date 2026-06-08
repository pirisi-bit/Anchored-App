const MAX_BYTES = 10 * 1024 * 1024;

function uploadApiOrigin(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) {
    throw new Error("Upload domain is not configured.");
  }

  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    return domain.replace(/\/$/, "");
  }

  const protocol = domain.startsWith("localhost") || domain.startsWith("127.0.0.1")
    ? "http"
    : "https";
  return `${protocol}://${domain}`;
}

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

/**
 * Uploads a captured photo/receipt to the api-server, which stores it in
 * Supabase Storage and returns a public URL. Mirrors the web app's
 * POST /api/receipts/upload contract (multipart field "file").
 */
export async function uploadProofFile(file: PickedFile): Promise<string> {
  if (file.size != null && file.size > MAX_BYTES) {
    throw new Error("File is too large. Max size is 10MB.");
  }

  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const res = await fetch(`${uploadApiOrigin()}/api/receipts/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Upload failed");
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}
