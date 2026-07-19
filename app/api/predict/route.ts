import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CLOUD_RUN_URL = "https://plant-disease-classifier-196198026251.us-central1.run.app/predict";

export async function POST(req: NextRequest) {
  const { imageUrl } = await req.json();

  if (!imageUrl) {
    return NextResponse.json({ error: "No imageUrl provided" }, { status: 400 });
  }

  const response = await fetch(CLOUD_RUN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Prediction failed" }, { status: 502 });
  }

  const result = await response.json();

  const saved = await prisma.prediction.create({
    data: {
      imageUrl: imageUrl,
      prediction: result.prediction,
      confidence: result.confidence,
      heatmapUrl: result.heatmap_url,
    },
  });

  return NextResponse.json({ ...result, id: saved.id });
}