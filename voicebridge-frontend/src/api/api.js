// src/api.js
import axios from "axios";

export const BASE_URL = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

// Interceptor example: attach auth token if you use one
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default {
  // Speech-to-text (file upload). backend expects file key "file", Form fields "language" and "use_non_standard_model"
  async transcribe(fileBlob, language = "en", useNonStandard = false) {
    const fd = new FormData();
    fd.append("file", fileBlob, "recording.wav");
    fd.append("language", language);
    fd.append("use_non_standard_model", useNonStandard ? "true" : "false");
    const res = await api.post("/api/speech-to-text", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Alternative endpoint that accepts bytes and uses whisper_service: POST /api/voice/transcribe (file key "file")
  async transcribeVoice(fileBlob, language = "en") {
    const fd = new FormData();
    fd.append("file", fileBlob, "recording.wav");
    fd.append("language", language);
    const res = await api.post("/api/voice/transcribe", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Get available models
  async getSpeechModels() {
    const res = await api.get("/api/speech-models");
    return res.data;
  },

  // Upload voice sample -> /api/voice/upload-sample
  // fields: audio (file), phrase, category, speech_characteristics (stringified json), profile_id (optional)
  async uploadSample({ fileBlob, phrase, category = "general", speechCharacteristics = {}, profileId = null }) {
    const fd = new FormData();
    fd.append("audio", fileBlob, "sample.webm");
    fd.append("phrase", phrase);
    fd.append("category", category);
    fd.append("speech_characteristics", JSON.stringify(speechCharacteristics));
    if (profileId) fd.append("profile_id", profileId);
    const res = await api.post("/api/voice/upload-sample", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Test upload
  async testUpload({ fileBlob, phrase, category = "general", speechCharacteristics = {} }) {
    const fd = new FormData();
    fd.append("audio", fileBlob, "sample.webm");
    fd.append("phrase", phrase);
    fd.append("category", category);
    fd.append("speech_characteristics", JSON.stringify(speechCharacteristics));
    const res = await api.post("/api/voice/test-upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // TTS - POST /api/text-to-speech (JSON body)
  async textToSpeech({ text, voice_id = null, stability = 0.5, similarity = 0.75, style = 0.0, speaker_boost = true }) {
    const res = await api.post("/api/text-to-speech", {
      text, voice_id, stability, similarity, style, speaker_boost
    }, { responseType: "arraybuffer" }); // expect audio bytes
    return res;
  },

  async getVoices() {
    const res = await api.get("/api/voices");
    return res.data;
  },

  // Profiles and samples
  async listProfiles() {
    const res = await api.get("/api/voice/profiles");
    return res.data;
  },
  async createProfile(profileData) {
    const res = await api.post("/api/voice/profiles", profileData);
    return res.data;
  },
  async activateProfile(profileId) {
    const res = await api.post(`/api/voice/profiles/${profileId}/activate`);
    return res.data;
  },
  async deleteProfile(profileId) {
    const res = await api.delete(`/api/voice/profiles/${profileId}`);
    return res.data;
  },

  async listSamples() {
    const res = await api.get("/api/voice/samples");
    return res.data;
  },
  async deleteSample(sampleId) {
    const res = await api.delete(`/api/voice/samples/${sampleId}`);
    return res.data;
  },

  // status checks
  async transcriptionStatus() {
    const res = await api.get("/api/transcription-status");
    return res.data;
  },
  async ttsStatus() {
    const res = await api.get("/api/tts-status");
    return res.data;
  },
};
