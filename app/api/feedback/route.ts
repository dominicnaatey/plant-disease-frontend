import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { id, feedback } = await req.json();

  await prisma.prediction.update({
    where: { id },
    data: { feedback },
  });

  return NextResponse.json({ success: true });
}