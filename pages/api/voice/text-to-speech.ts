import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.headers.token as string;
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Not authorized" });
  }

  try {
    const { text, language = "hi-IN" } = req.body;

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": process.env.SARVAM_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: language,
        speaker: "anushka",
        model: "bulbul:v2",
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        enable_preprocessing: true,
      }),
    });

    const responseText = await response.text();
    console.log("Sarvam TTS response:", response.status, responseText);

    if (!response.ok) {
      return res.status(response.status).json({ error: responseText });
    }

    const data = JSON.parse(responseText);
    
    if (!data.audios || !data.audios[0]) {
      return res.status(500).json({ error: "No audio generated" });
    }

    return res.status(200).json({ audio: data.audios[0] });
  } catch (error: any) {
    console.error("TTS error:", error);
    return res.status(500).json({ error: error.message });
  }
}
