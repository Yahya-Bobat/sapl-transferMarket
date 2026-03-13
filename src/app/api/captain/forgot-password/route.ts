import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email: string };
    const emailTrim = email?.trim().toLowerCase();
    if (!emailTrim) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const captain = await prisma.captain.findUnique({ where: { email: emailTrim } });

    // Only allow approved captains
    if (!captain || captain.approvalStatus !== "approved") {
      return NextResponse.json({ ok: true });
    }

    // Generate a secure token valid for 1 hour
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.captainResetToken.upsert({
      where: { captainId: captain.id },
      create: { captainId: captain.id, token, expiresAt },
      update: { token, expiresAt },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sapl-transfer-market.vercel.app"}/captain/reset-password?token=${token}`;

    await sendEmail({
      to: emailTrim,
      subject: "Reset your SAPL Transfer Market password",
      html: `
        <p>Hi ${captain.teamName || "Captain"},</p>
        <p>You requested a password reset for your SAPL Transfer Market account.</p>
        <p><a href="${resetUrl}" style="background:#6366f1;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;">Reset password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        <p style="color:#888;font-size:12px;">Or copy this link: ${resetUrl}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
