import { verifyToken } from "@/lib/auth";

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const token = req.headers.token as string;
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const { question, chat_history = [] } = req.body;

    const systemPrompt = `You are Krishna from the Bhagavad Gita, a wise and compassionate spiritual guide. 
You speak with warmth, wisdom, and clarity. Keep responses concise but meaningful.
Answer questions about life, dharma, karma, and spiritual growth based on the teachings of the Gita.
Respond in the same language the user speaks to you.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chat_history.flatMap((item: string) => {
        const parts = item.split("\n").filter(Boolean);
        return parts.map((part: string) => {
          if (part.startsWith("Human:")) {
            return { role: "user", content: part.replace("Human:", "").trim() };
          } else if (part.startsWith("AI:")) {
            return { role: "assistant", content: part.replace("AI:", "").trim() };
          }
          return null;
        }).filter(Boolean);
      }),
      { role: "user", content: question },
    ];

    try {
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-oss-120b",
          messages,
          max_tokens: 10024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({ error });
      }

      const data = await response.json();
      const reply = data.choices[0].message.content;

      // Format response to match expected structure
      const newHistory = [...chat_history, `Human: ${question}\nAI: ${reply}`];
      return res.json({ answer: reply, chat_history: newHistory });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(200).json({ message: "Radhey Radhey Dear Devotee" });
  }
}
