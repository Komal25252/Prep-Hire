import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing)
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, provider: "credentials" });

    return NextResponse.json({ message: "Account created successfully." }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
