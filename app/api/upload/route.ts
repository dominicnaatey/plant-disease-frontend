import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

const storage = new Storage({
  projectId: "computer-vision-project-502523",
  // If running locally, you'll need a service account key file:
  // keyFilename: "path/to/service-account-key.json"
});

const bucketName = "plant-disease-uploads"; // new bucket for user uploads, see below

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `uploads/${randomUUID()}-${file.name}`;

  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(filename);

  await blob.save(buffer, { contentType: file.type });

  const imageUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

  return NextResponse.json({ imageUrl });
}