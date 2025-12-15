import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getDb } from "./mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface User {
  _id?: string;
  email: string;
  password?: string;
  createdAt: Date;
}

export async function createUser(email: string, password: string): Promise<User> {
  const db = await getDb();
  const existingUser = await db.collection("users").findOne({ email });
  
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    email,
    password: hashedPassword,
    createdAt: new Date(),
  };

  await db.collection("users").insertOne(user);
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  const db = await getDb();
  const user = await db.collection("users").findOne({ email });

  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  const { password: _, ...userWithoutPassword } = user;
  return {
    _id: userWithoutPassword._id?.toString(),
    email: userWithoutPassword.email,
    createdAt: userWithoutPassword.createdAt,
  } as User;
}

export function generateToken(user: User): string {
  return jwt.sign({ email: user.email, id: user._id }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { email: string; id: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { email: string; id: string };
  } catch {
    return null;
  }
}
