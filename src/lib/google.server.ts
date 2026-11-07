const GW = "https://connector-gateway.lovable.dev";
export const ADMIN_EMAIL = "tanishshekhawat001@gmail.com";

function headers(keyName: "GOOGLE_MAIL_API_KEY" | "GOOGLE_DRIVE_API_KEY", extra: Record<string, string> = {}) {
  const lov = process.env["LOVABLE_API_KEY"];
  const key = process.env[keyName];
  if (!lov || !key) throw new Error(`Missing ${!lov ? "LOVABLE_API_KEY" : keyName}`);
  return { Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": key, ...extra };
}

async function check(res: Response) {
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google request failed [${res.status}]: ${body}`);
    throw new Error(`Google request failed [${res.status}]: ${body}`);
  }
  return res;
}

const b64 = (s: string) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const hdr = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

export async function sendAdminEmail(subject: string, body: string) {
  const raw = b64([`To: ${ADMIN_EMAIL}`, `Subject: ${hdr(subject)}`, "MIME-Version: 1.0", 'Content-Type: text/plain; charset="UTF-8"', "", body].join("\r\n"))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await check(await fetch(`${GW}/google_mail/gmail/v1/users/me/messages/send`, {
    method: "POST",
    headers: headers("GOOGLE_MAIL_API_KEY", { "Content-Type": "application/json" }),
    body: JSON.stringify({ raw }),
  }));
}

const FOLDER = "TradeQuest Backups";

async function folderId(): Promise<string> {
  const q = encodeURIComponent(`name='${FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const r = await check(await fetch(`${GW}/google_drive/drive/v3/files?q=${q}&fields=files(id)`, { headers: headers("GOOGLE_DRIVE_API_KEY") }));
  const j = (await r.json()) as { files: { id: string }[] };
  if (j.files[0]) return j.files[0].id;
  const c = await check(await fetch(`${GW}/google_drive/drive/v3/files?fields=id`, {
    method: "POST",
    headers: headers("GOOGLE_DRIVE_API_KEY", { "Content-Type": "application/json" }),
    body: JSON.stringify({ name: FOLDER, mimeType: "application/vnd.google-apps.folder" }),
  }));
  return ((await c.json()) as { id: string }).id;
}

export async function uploadCsv(name: string, csv: string, parent?: string) {
  const p = parent ?? (await folderId());
  const boundary = "tqbackup" + Math.random().toString(36).slice(2);
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [p], mimeType: "text/csv" })}\r\n--${boundary}\r\nContent-Type: text/csv; charset=UTF-8\r\n\r\n${csv}\r\n--${boundary}--`;
  await check(await fetch(`${GW}/google_drive/upload/drive/v3/files?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: headers("GOOGLE_DRIVE_API_KEY", { "Content-Type": `multipart/related; boundary=${boundary}` }),
    body,
  }));
}

export async function backupFolder() {
  return folderId();
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
