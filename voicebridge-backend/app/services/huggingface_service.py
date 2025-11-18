import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from typing import Dict, Any, Union
import tempfile
import os
from app.core.config import settings


class HuggingFaceService:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        self.model = None
        self.processor = None
        self.pipeline = None
        self.load_model()

    def load_model(self):
        """Load the fine-tuned non-standard speech model"""
        try:
            model_id = settings.HUGGINGFACE_MODEL_REPO

            # Load model and processor
            self.model = AutoModelForSpeechSeq2Seq.from_pretrained(
                model_id,
                torch_dtype=self.torch_dtype,
                low_cpu_mem_usage=True,
                use_safetensors=True
            ).to(self.device)

            self.processor = AutoProcessor.from_pretrained(model_id)

            # Create pipeline
            self.pipeline = pipeline(
                "automatic-speech-recognition",
                model=self.model,
                tokenizer=self.processor.tokenizer,
                feature_extractor=self.processor.feature_extractor,
                torch_dtype=self.torch_dtype,
                device=0 if self.device == "cuda" else -1,  # 0 for GPU, -1 for CPU
            )

            print(f"✅ Loaded non-standard speech model from {model_id}")

        except Exception as e:
            print(f"❌ Error loading Hugging Face model: {e}")
            self.pipeline = None

    def transcribe_non_standard_speech(
        self, audio_input: Union[str, bytes], language: str = "en"
    ) -> Dict[str, Any]:
        """Transcribe non-standard speech from file path or bytes"""
        try:
            if self.pipeline is None:
                raise Exception("Non-standard speech model not available")

            # Handle audio bytes
            if isinstance(audio_input, bytes):
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                    temp_file.write(audio_input)
                    temp_file.flush()
                    audio_path = temp_file.name
            else:
                audio_path = audio_input  # Already a path

            # Run transcription
            result = self.pipeline(
                audio_path,
                generate_kwargs={"language": language},
                return_timestamps=True
            )

            # Clean up temporary file if created
            if isinstance(audio_input, bytes):
                os.unlink(audio_path)

            return {
                "text": result.get("text", "").strip(),
                "language": language,
                "confidence": 0.95,  # Placeholder (HF pipeline doesn't return logprobs)
                "chunks": result.get("chunks", []),
                "model_type": "non_standard_speech",
            }

        except Exception as e:
            print(f"⚠️ Non-standard speech transcription error: {e}")
            # Fallback to Whisper if HF model fails
            from app.services.whisper_service import whisper_service
            return whisper_service.transcribe_audio_bytes(audio_input, language)


# Global instance
huggingface_service = HuggingFaceService()
