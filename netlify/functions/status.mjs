import { json, suno } from "./_suno.mjs";

export default async (req) => {
  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!taskId || !/^[\w-]{4,128}$/.test(taskId)) return json({ code: 400, msg: "Missing or invalid taskId" }, 400);
  return suno(`/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`);
};

export const config = { path: "/api/status" };
