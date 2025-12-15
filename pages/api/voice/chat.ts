import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.headers.token as string;
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Not authorized" });
  }

  try {
    const { message, chatHistory = [], language = "hi-IN" } = req.body;

    const langName =
      language === "hi-IN"
        ? "Hindi"
        : language === "kn-IN"
        ? "Kannada"
        : "English";

    const systemPrompt = `You are Krishna from the Bhagavad Gita, a wise and compassionate spiritual guide. 
You speak with warmth, wisdom, and clarity. Keep responses concise but meaningful.
Answer questions about life, dharma, karma, and spiritual growth based on the teachings of the Gita.
IMPORTANT: Always respond in ${langName} language only.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((msg: any) => ({
        role: msg.sent ? "user" : "assistant",
        content: msg.message,
      })),
      { role: "user", content: message },
    ];

    const response = await fetch(
      "https://api.cerebras.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-oss-120b",
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return res.status(200).json({ reply });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
