export const SUNO_BASE = "https://api.sunoapi.org";

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function suno(path, init = {}) {
  const key = process.env.SUNO_API_KEY;
  if (!key) {
    return json({ code: 500, msg: "SUNO_API_KEY is not set in Netlify environment variables." }, 500);
  }
  const res = await fetch(SUNO_BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { code: res.status, msg: text || res.statusText }; }
  return json(data, res.ok ? 200 : res.status);
}
