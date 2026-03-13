import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = (await request.json()) as {
      token: string;
      newPassword: string;
    };

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Token and new password (min 6 characters) required" }, { status: 400 });
    }

    const record = await prisma.captainResetToken.findUnique({ where: { token } });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }
    if (new Date() > record.expiresAt) {
      await prisma.captainResetToken.delete({ where: { token } });
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.captain.update({
      where: { id: record.captainId },
      data: { passwordHash },
    });
    await prisma.captainResetToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
