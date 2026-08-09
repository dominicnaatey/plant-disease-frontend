# Plant Disease Classifier — Frontend

A Next.js web application for uploading plant leaf images and getting real-time disease predictions with Grad-CAM explainability, backed by a fine-tuned ResNet-50 model.

**Live demo:** [demo](https://plant-disease-umber-one.vercel.app/)
**Model training & inference API repo:** [api repo](https://github.com/dominicnaatey/plant-disease-app)

> Note: the inference backend runs on a serverless container (Google Cloud Run) that scales to zero when idle. The first prediction after a period of inactivity may take up to 30 seconds due to cold-start latency (loading PyTorch and the model into memory). Subsequent predictions are fast.

## What it does

1. User drags and drops (or selects) a leaf image
2. The image is uploaded to Google Cloud Storage
3. The image URL is sent to a deployed ResNet-50 inference service
4. The predicted class, confidence score, and a Grad-CAM heatmap are displayed side by side with the original image
5. The user can rate the prediction (thumbs up/down), which is logged alongside the prediction in a Postgres database
6. Every prediction and its feedback is persisted for later analysis

## Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **File storage:** Google Cloud Storage
- **Database:** Neon (serverless Postgres)
- **ORM:** Prisma
- **Deployment:** Vercel

## Architecture

```
User → Next.js frontend (Vercel)
         ├─ /api/upload  → Google Cloud Storage (user uploads)
         └─ /api/predict → Cloud Run inference API → Google Cloud Storage (heatmaps)
                          → Neon Postgres (prediction + feedback log)
```

See the [inference API repo](https://github.com/dominicnaatey/plant-disease-app) for the model training pipeline, ResNet-50 fine-tuning details, and Grad-CAM implementation.

## Getting started

### Prerequisites

- Node.js 18+
- A Google Cloud project with a Cloud Storage bucket and a service account key (JSON) with `Storage Object Admin` on that bucket
- A Neon Postgres database
- A deployed instance of the [inference API](https://plant-disease-classifier-196198026251.us-central1.run.app/) (or point `CLOUD_RUN_URL` at your own)

### Install

```bash
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```
DATABASE_URL="your-neon-connection-string"
GOOGLE_CREDENTIALS_JSON={"type":"service_account", ...}
```

`GOOGLE_CREDENTIALS_JSON` is the full contents of your GCP service account key JSON, pasted as a single value (not a file path — this is deliberate, since serverless platforms like Vercel don't provide a persistent filesystem to point a `keyFilename` at).

**Never commit `.env.local` or any service account key file.** Both are gitignored by default in this repo; double check before pushing if you've modified `.gitignore`.

### Set up the database

```bash
npx prisma migrate dev
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  page.tsx                 # main UI: upload, results, feedback
  api/
    upload/route.ts        # accepts a file, writes it to Cloud Storage
    predict/route.ts       # calls the inference API, logs result to Postgres
    feedback/route.ts      # records thumbs up/down against a prediction
lib/
  prisma.ts                # Prisma client instance
prisma/
  schema.prisma            # Prediction model definition
```

## Database schema

```prisma
model Prediction {
  id             String   @id @default(cuid())
  imageUrl       String
  predictedClass String
  confidence     Float
  heatmapUrl     String
  feedback       Int?     // 1 = thumbs up, -1 = thumbs down, null = no feedback
  createdAt      DateTime @default(now())
}
```

## Deployment

Deployed on Vercel. Environment variables (`DATABASE_URL`, `GOOGLE_CREDENTIALS_JSON`) must be set in the Vercel project dashboard under Settings → Environment Variables, applied to Production, Preview, and Development.

## Known limitations

- Feedback is a single binary signal (up/down) applied to a combined species + condition label, so it can't distinguish "wrong species, right condition" from other error types. See the accompanying paper for discussion.
- No authentication; the app is open to anyone with the URL.
- No rate limiting on uploads.

## Related

This frontend is one half of a larger project that includes training a ResNet-50 classifier on the PlantVillage dataset, evaluating its behavior under domain shift (an unseen crop species), and analyzing real user feedback collected through this application.
