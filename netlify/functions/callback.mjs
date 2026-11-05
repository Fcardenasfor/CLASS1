// Suno requires a callBackUrl. The app polls /api/status for results,
// so this endpoint simply acknowledges the notification.
export default async () => new Response(JSON.stringify({ code: 200, msg: "ok" }), {
  headers: { "content-type": "application/json" },
});

export const config = { path: "/api/callback" };
