const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const GROQ_API = "https://api.groq.com/openai/v1/responses";

async function telegram(method, body) {
  const response = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function askGroq(message) {
  const response = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      input: [
        {
          role: "system",
          content:
            "Eres JaviGPT Personal, el asistente privado de Javi. " +
            "Responde siempre en español, de forma clara, útil y directa. " +
            "No inventes información."
        },
        {
          role: "user",
          content: message
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();

  const answer =
  data.output?.flatMap(item => item.content || [])
    .find(part => part.type === "output_text")?.text;

return answer || "No he podido generar una respuesta.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      service: "JaviGPT Telegram"
    });
  }

  try {
    const update = req.body;
    const message = update?.message;

    if (!message?.chat?.id) {
      return res.status(200).json({ ok: true });
    }

    const text = message.text?.trim();

    if (!text) {
      await telegram("sendMessage", {
        chat_id: message.chat.id,
        text:
          "De momento puedo trabajar con mensajes de texto. " +
          "Próximamente añadiremos voz e imágenes."
      });

      return res.status(200).json({ ok: true });
    }

    if (text === "/start") {
      await telegram("sendMessage", {
        chat_id: message.chat.id,
        text:
          "👋 Hola Javi.\n\n" +
          "Soy JaviGPT Personal.\n" +
          "Ya estoy conectado.\n\n" +
          "Escríbeme cualquier cosa y te responderé con IA."
      });

      return res.status(200).json({ ok: true });
    }

    if (text === "/help") {
      await telegram("sendMessage", {
        chat_id: message.chat.id,
        text:
          "🤖 JaviGPT Personal\n\n" +
          "Escríbeme normalmente y te responderé con IA.\n\n" +
          "/start — iniciar\n" +
          "/help — ayuda\n" +
          "/nuevochat — nueva conversación\n" +
          "/memoria — memoria"
      });

      return res.status(200).json({ ok: true });
    }

    if (text === "/nuevochat") {
      await telegram("sendMessage", {
        chat_id: message.chat.id,
        text:
          "🆕 Conversación nueva.\n\n" +
          "La memoria persistente la añadiremos en la siguiente versión."
      });

      return res.status(200).json({ ok: true });
    }

    if (text === "/memoria") {
      await telegram("sendMessage", {
        chat_id: message.chat.id,
        text:
          "🧠 La memoria personal todavía no está activada.\n\n" +
          "La añadiremos después de comprobar que el bot básico funciona."
      });

      return res.status(200).json({ ok: true });
    }

    await telegram("sendChatAction", {
      chat_id: message.chat.id,
      action: "typing"
    });

    const answer = await askGroq(text);

    for (let i = 0; i < answer.length; i += 3900) {
      await telegram("sendMessage", {
        chat_id: message.chat.id,
        text: answer.slice(i, i + 3900)
      });
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error(error);

    return res.status(200).json({
      ok: false
    });
  }
}
