import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { toFullNumber, normalizedFormsForMatch } from "@/lib/phone";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dialingCode, phoneNumber, code, newPassword } = body as {
      dialingCode: string;
      phoneNumber: string;
      code: string;
      newPassword: string;
    };

    const full = toFullNumber(dialingCode || "", phoneNumber || "");
    if (!full) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }
    if (!code || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "OTP code and new password (min 6 characters) required" }, { status: 400 });
    }

    // Verify OTP
    const otp = await prisma.pendingOtp.findUnique({ where: { phone: full } });
    if (!otp) {
      return NextResponse.json({ error: "No OTP found. Please request a new code." }, { status: 400 });
    }
    if (new Date() > otp.expiresAt) {
      await prisma.pendingOtp.delete({ where: { phone: full } });
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
    }
    if (otp.code !== code.trim()) {
      return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
    }

    // Find player by phone
    const allPlayers = await prisma.player.findMany({
      where: {
        OR: [
          { mobilePhone: { not: null } },
          { workPhone: { not: null } },
          { homePhone: { not: null } },
          { authPhone: { not: null } },
        ],
      },
    });
    const player = allPlayers.find((p) => {
      const phones = [p.authPhone, p.mobilePhone, p.workPhone, p.homePhone].filter(Boolean) as string[];
      for (const ph of phones) {
        const forms = normalizedFormsForMatch(ph);
        if (forms.includes(full)) return true;
      }
      return false;
    });

    if (!player) {
      return NextResponse.json({ error: "No player found with this phone number." }, { status: 404 });
    }

    // Update password and clean up OTP
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.player.update({
      where: { id: player.id },
      data: { passwordHash },
    });
    await prisma.pendingOtp.delete({ where: { phone: full } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
