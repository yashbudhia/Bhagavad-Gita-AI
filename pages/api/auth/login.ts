import type { NextApiRequest, NextApiResponse } from "next";
import { validateUser, generateToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = await validateUser(email, password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user);
  return res.status(200).json({ user, token });
}
