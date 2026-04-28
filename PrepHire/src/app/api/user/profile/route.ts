import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return profile data
    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      location: user.location || "",
      jobTitle: user.jobTitle || "",
      targetRole: user.targetRole || "",
      bio: user.bio || "",
      skills: user.skills || [],
      preferences: user.preferences || {
        emailNotifications: true,
        weeklyReport: true,
        resourceSharing: true,
      },
      image: user.image,
    });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await connectDB();

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name: data.name,
          phone: data.phone,
          location: data.location,
          jobTitle: data.jobTitle,
          targetRole: data.targetRole,
          bio: data.bio,
          skills: data.skills,
          preferences: data.preferences,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
