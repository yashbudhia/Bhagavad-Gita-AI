import type { NextApiRequest, NextApiResponse } from "next";
import { createUser, generateToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const user = await createUser(email, password);
    const token = generateToken(user);
    return res.status(201).json({ user, token });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}
