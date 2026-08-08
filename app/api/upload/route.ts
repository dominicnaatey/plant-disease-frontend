import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON!);

const storage = new Storage({
  projectId: credentials.project_id,
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
});

const bucketName = "plant-disease-uploads";

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