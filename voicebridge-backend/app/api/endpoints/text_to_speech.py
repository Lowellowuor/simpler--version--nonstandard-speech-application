# app/api/endpoints/text_to_speech.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from app.services.elevenlabs_service import elevenlabs_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    voice_id: str = None  # This will use the service's default if not provided
    stability: float = 0.5
    similarity: float = 0.75
    style: float = 0.0
    speaker_boost: bool = True

@router.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    try:
        # Validate input
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required and cannot be empty")
        
        logger.info(f"🔄 TTS request for text: '{request.text[:100]}...'")
        logger.info(f"🎯 Using voice ID: {request.voice_id or 'default (will be replaced)'}")
        
        # Process TTS - service will handle voice_id replacement
        audio_data = elevenlabs_service.text_to_speech(
            text=request.text,
            voice_id=request.voice_id,  # Can be None, service will use default
            stability=request.stability,
            similarity_boost=request.similarity,
            style=request.style,
            use_speaker_boost=request.speaker_boost
        )
        
        logger.info(f"✅ TTS successful, returning {len(audio_data)} bytes")
        
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
        
    except ValueError as e:
        # Client errors (400)
        logger.warning(f"❌ TTS client error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Server errors (500)
        logger.error(f"❌ TTS server error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

@router.get("/voices")
async def get_voices():
    """Get available voices from ElevenLabs"""
    try:
        voices = elevenlabs_service.get_voices()
        default_voice = elevenlabs_service.get_default_voice_id()
        
        return {
            "success": True,
            "default_voice_id": default_voice,
            "voices": voices,
            "count": len(voices)
        }
    except Exception as e:
        logger.error(f"Failed to get voices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get voices: {str(e)}")

@router.get("/tts-status")
async def tts_status():
    """Check TTS service status"""
    try:
        # Test with a simple request
        test_audio = elevenlabs_service.text_to_speech("Test")
        return {
            "status": "healthy",
            "service": "elevenlabs",
            "default_voice": elevenlabs_service.get_default_voice_id(),
            "message": "TTS service is working"
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "service": "elevenlabs",
            "error": str(e),
            "message": "TTS service is not available"
        }