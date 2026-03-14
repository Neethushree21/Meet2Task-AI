import axios from "axios";

export async function transcribeAudio(audioBlob: Buffer, fileName: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBlob)], { type: "audio/wav" });
  formData.append("file", blob, fileName);
  formData.append("language_code", "en-IN");
  formData.append("model", "saarika:v1");

  try {
    const response = await axios.post(
      "https://api.sarvam.ai/speech-to-text",
      formData,
      {
        headers: {
          "API-Subscription-Key": process.env.SARVAM_API_KEY || "",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.transcript || "";
  } catch (error) {
    console.error("Sarvam AI transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}
