const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export default async function handler(req, res) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return res.status(500).json({
      ok: false,
      error: "TELEGRAM_BOT_TOKEN no está configurado."
    });
  }

  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host;

  const proto =
    req.headers["x-forwarded-proto"] ||
    "https";

  const webhookUrl =
    `${proto}://${host}/api/telegram`;

  const response = await fetch(
    `${TELEGRAM_API}/setWebhook`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"]
      })
    }
  );

  const data = await response.json();

  return res.status(
    response.ok && data.ok ? 200 : 500
  ).json({
    ok: response.ok && data.ok,
    telegram: data,
    webhook: webhookUrl
  });
}
