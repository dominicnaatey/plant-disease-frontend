-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "prediction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "heatmapUrl" TEXT NOT NULL,
    "feedback" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);
