"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

type PredictionResult = {
  id: string;
  prediction: string;
  confidence: number;
  heatmap_url: string;
};

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFeedback(null);

    try {
      // 1. Upload the file
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { imageUrl: uploadedUrl } = await uploadRes.json();
      setImageUrl(uploadedUrl);

      // 2. Run prediction
      const predictRes = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadedUrl }),
      });
      if (!predictRes.ok) throw new Error("Prediction failed");
      const data = await predictRes.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const submitFeedback = async (value: "up" | "down") => {
    if (!result) return;
    setFeedback(value);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: result.id, feedback: value === "up" ? 1 : -1 }),
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Plant Disease Classifier
      </h1>

      {/* Drag and drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`w-full max-w-xl border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragOver ? "border-green-500 bg-green-50" : "border-gray-300 bg-white"
        }`}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileSelect}
        />
        <p className="text-gray-600">
          Drag and drop a leaf image here, or click to select a file
        </p>
      </div>

      {loading && (
        <p className="mt-6 text-gray-500 animate-pulse">Analyzing image...</p>
      )}

      {error && (
        <p className="mt-6 text-red-600">{error}</p>
      )}

      {/* Results */}
      {result && imageUrl && (
        <div className="mt-10 w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">
                Original Image
              </h2>
              <div className="relative w-full h-64">
                <Image
                  src={imageUrl}
                  alt="Uploaded leaf"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">
                Grad-CAM Heatmap
              </h2>
              <div className="relative w-full h-64">
                <Image
                  src={result.heatmap_url}
                  alt="Grad-CAM heatmap"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800">
              {result.prediction.replace(/___/g, " — ").replace(/_/g, " ")}
            </h2>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Confidence</span>
                <span>{(result.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm text-gray-500">Was this prediction helpful?</span>
              <button
                onClick={() => submitFeedback("up")}
                className={`px-3 py-1 rounded-full border text-lg ${
                  feedback === "up"
                    ? "bg-green-100 border-green-400"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                👍
              </button>
              <button
                onClick={() => submitFeedback("down")}
                className={`px-3 py-1 rounded-full border text-lg ${
                  feedback === "down"
                    ? "bg-red-100 border-red-400"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                👎
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}