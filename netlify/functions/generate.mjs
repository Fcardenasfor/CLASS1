import { json, suno } from "./_suno.mjs";

const MODELS = ["V6", "V6_MINI", "V6_WILD", "V5", "V4_5PLUS", "V4_5ALL", "V4_5"];
const clip = (s, n) => (typeof s === "string" ? s.trim().slice(0, n) : "");

export default async (req) => {
  if (req.method !== "POST") return json({ code: 405, msg: "Method not allowed" }, 405);

  let input;
  try { input = await req.json(); } catch { return json({ code: 400, msg: "Invalid JSON" }, 400); }

  const customMode = !!input.customMode;
  const instrumental = !!input.instrumental;
  const model = MODELS.includes(input.model) ? input.model : "V6";
  const origin = process.env.URL || new URL(req.url).origin;

  const body = {
    customMode,
    instrumental,
    model,
    callBackUrl: `${origin}/api/callback`,
  };

  if (customMode) {
    const style = clip(input.style, 1000);
    const lyrics = instrumental ? "" : clip(input.lyrics, 5000);
    const negativeTags = clip(input.negativeTags, 1000);
    if (!style && !lyrics && !negativeTags) {
      return json({ code: 400, msg: "Custom mode needs a style, lyrics, or negative tags." }, 400);
    }
    if (style) body.style = style;
    if (lyrics) body.lyrics = lyrics;
    if (negativeTags) body.negativeTags = negativeTags;
    const title = clip(input.title, 80);
    if (title) body.title = title;
    if (!instrumental && (input.vocalGender === "m" || input.vocalGender === "f")) {
      body.vocalGender = input.vocalGender;
    }
    for (const k of ["styleWeight", "weirdnessConstraint"]) {
      const v = Number(input[k]);
      if (input[k] !== undefined && input[k] !== "" && v >= 0 && v <= 1) body[k] = Math.round(v * 100) / 100;
    }
  } else {
    const prompt = clip(input.prompt, 3000);
    const style = clip(input.style, 1000);
    if (!prompt && !style) {
      return json({ code: 400, msg: "Describe the song you want." }, 400);
    }
    if (prompt) body.prompt = prompt;
    if (style) body.style = style;
  }

  return suno("/api/v1/generate", { method: "POST", body: JSON.stringify(body) });
};

export const config = { path: "/api/generate" };
