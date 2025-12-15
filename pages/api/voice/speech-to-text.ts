import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

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
    const { audio, language = "hi-IN" } = req.body;

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, "base64");

    // Create form data for Sarvam API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
    formData.append("file", audioBlob, "audio.webm");
    formData.append("language_code", language);
    formData.append("model", "saarika:v2");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": process.env.SARVAM_API_KEY!,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Sarvam STT error:", error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    return res.status(200).json({ transcript: data.transcript });
  } catch (error: any) {
    console.error("STT error:", error);
    return res.status(500).json({ error: error.message });
  }
}
