import os
import json
from pydantic_settings import BaseSettings
from typing import List, Optional
from pydantic import field_validator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "VoiceBridge Backend"

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "https://your-frontend-domain.com",
    ]

    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            try:
                # Try to parse as JSON first
                return json.loads(v)
            except json.JSONDecodeError:
                # If not JSON, split by commas (for environment variables)
                return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    # Whisper STT Configuration
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")

    # ElevenLabs TTS Configuration
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    ELEVENLABS_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID", "default")

    # HuggingFace Configuration
    HUGGINGFACE_TOKEN: str = os.getenv("HUGGINGFACE_TOKEN", "")
    HUGGINGFACE_MODEL_REPO: str = os.getenv("HUGGINGFACE_MODEL_REPO", "cdl-inclusion/nairobo_innovation_sprint")

    # File Storage Configuration
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "data/voice_samples")
    MODEL_DIR: str = os.getenv("MODEL_DIR", "data/trained_models")
    AUDIO_DIR: str = os.getenv("AUDIO_DIR", "data/generated_audio")

    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./voicebridge.db")

    # Audio Processing Configuration
    MAX_AUDIO_SIZE_MB: int = int(os.getenv("MAX_AUDIO_SIZE_MB", "50"))
    ALLOWED_AUDIO_FORMATS: List[str] = ["wav", "mp3", "m4a", "flac"]

    # Application Settings
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Instantiate settings
settings = Settings()

# Create required directories on startup
def create_directories():
    """Create necessary directories if they don't exist"""
    directories = [settings.UPLOAD_DIR, settings.MODEL_DIR, settings.AUDIO_DIR]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

# Create directories when module is imported
create_directories()