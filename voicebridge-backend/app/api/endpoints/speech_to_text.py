from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.whisper_service import whisper_service
from app.services.huggingface_service import huggingface_service
import os
import logging
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...),
    language: str = Form("en"),
    use_non_standard_model: bool = Form(False)
):
    """
    Speech-to-text endpoint with support for both standard and non-standard speech
    """
    file_location = None
    try:
        logger.info(f"🎯 Received STT request")
        logger.info(f"📁 File: {file.filename}")
        logger.info(f"📊 Content type: {file.content_type}")
        logger.info(f"🌐 Language: {language}")
        logger.info(f"🔧 Non-standard model: {use_non_standard_model}")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        logger.info(f"📏 File size: {file_size} bytes")
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        if file_size > 100 * 1024 * 1024:  # 100MB limit
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")
        
        # Check file type
        allowed_content_types = [
            'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 
            'audio/ogg', 'audio/x-wav', 'audio/x-m4a', 'audio/aac'
        ]
        
        if file.content_type and file.content_type not in allowed_content_types:
            logger.warning(f"⚠️ Unsupported content type: {file.content_type}")
            # Don't reject immediately, let the audio loader handle it
        
        # Create temp directory if it doesn't exist
        temp_dir = "data/temp"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save uploaded file with unique name to avoid conflicts
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        file_extension = os.path.splitext(file.filename)[1] or '.wav'
        file_location = os.path.join(temp_dir, f"audio_{unique_id}{file_extension}")
        
        logger.info(f"💾 Saving file to: {file_location}")
        
        with open(file_location, "wb") as f:
            content = await file.read()
            f.write(content)
            logger.info(f"✅ File saved successfully, size: {len(content)} bytes")
        
        # Choose transcription service based on use_non_standard_model
        if use_non_standard_model:
            logger.info("🎯 Using HuggingFace non-standard speech model")
            logger.info("💡 This model is optimized for: non-standard speech, accents, dysarthria, regional variants")
            
            # Check if HuggingFace service is available
            if not hasattr(huggingface_service, 'transcribe_non_standard_speech'):
                raise HTTPException(
                    status_code=501, 
                    detail="Non-standard speech model is not available"
                )
            
            result = huggingface_service.transcribe_non_standard_speech(file_location, language)
        else:
            logger.info("🎯 Using standard Whisper model")
            logger.info("💡 This model works best for: clear, standard speech patterns")
            
            # Check if Whisper service is loaded
            status = whisper_service.get_service_status()
            if not status.get("model_loaded", False):
                raise HTTPException(
                    status_code=503,
                    detail="Whisper model is not loaded. Please check the service status."
                )
            
            result = whisper_service.transcribe_audio(file_location, language)
        
        # Validate transcription result
        if not result or "text" not in result:
            raise HTTPException(status_code=500, detail="Transcription service returned invalid result")
        
        transcription_text = result.get("text", "").strip()
        confidence = result.get("confidence", 0.0)
        
        logger.info(f"✅ Transcription successful: '{transcription_text[:100]}...'")
        logger.info(f"📊 Confidence score: {confidence:.2f}")
        
        return {
            "success": True,
            "text": transcription_text,
            "language": result.get("language", language),
            "confidence": confidence,
            "full_transcription": result.get("full_transcription", transcription_text),
            "segments": result.get("segments", []),
            "model_used": "non-standard" if use_non_standard_model else "standard",
            "audio_duration": result.get("duration", 0)
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        # Handle validation errors
        logger.error(f"❌ STT validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        logger.error(f"❌ STT file error: {str(e)}")
        raise HTTPException(status_code=400, detail="Audio file not found or inaccessible")
    except Exception as e:
        logger.error(f"❌ STT endpoint error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Transcription failed: {str(e)}"
        )
    finally:
        # Clean up temp file in all cases
        if file_location and os.path.exists(file_location):
            try:
                os.unlink(file_location)
                logger.info("🧹 Temporary file cleaned up")
            except Exception as cleanup_error:
                logger.warning(f"⚠️ Failed to clean up temp file: {cleanup_error}")

@router.post("/voice/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Alternative transcription endpoint (always uses standard Whisper)
    """
    try:
        logger.info(f"🎯 Received voice transcribe request: {file.filename}")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check if Whisper service is available
        status = whisper_service.get_service_status()
        if not status.get("model_loaded", False):
            raise HTTPException(
                status_code=503,
                detail="Whisper model is not loaded. Please check the service status."
            )
        
        audio_bytes = await file.read()
        
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        logger.info(f"📊 Processing audio bytes: {len(audio_bytes)} bytes")
        
        result = whisper_service.transcribe_audio_bytes(audio_bytes, language)
        
        transcription_text = result.get("text", "").strip()
        logger.info(f"✅ Voice transcription successful: '{transcription_text[:100]}...'")
        
        return {
            "success": True,
            "text": transcription_text,
            "language": result.get("language", language),
            "confidence": result.get("confidence", 0.0),
            "model_used": "standard",
            "audio_duration": result.get("duration", 0)
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Voice transcribe validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Voice transcribe error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.get("/speech-models")
async def get_available_models():
    """
    Endpoint to get information about available speech models
    """
    try:
        # Check service status
        whisper_status = whisper_service.get_service_status()
        huggingface_available = hasattr(huggingface_service, 'transcribe_non_standard_speech')
        
        models = [
            {
                "id": "standard",
                "name": "Standard Whisper",
                "description": "OpenAI's Whisper model for general speech recognition",
                "best_for": ["Clear speech", "Standard accents", "General use"],
                "status": "available" if whisper_status.get("model_loaded") else "unavailable",
                "endpoint": "/api/speech-to-text?use_non_standard_model=false"
            }
        ]
        
        # Add non-standard model if available
        if huggingface_available:
            models.append({
                "id": "non-standard", 
                "name": "Non-Standard Speech Model",
                "description": "Fine-tuned model for non-standard speech patterns",
                "best_for": ["Dysarthria", "Heavy accents", "Regional variants", "Speech disabilities"],
                "status": "available",
                "endpoint": "/api/speech-to-text?use_non_standard_model=true"
            })
        else:
            models.append({
                "id": "non-standard", 
                "name": "Non-Standard Speech Model",
                "description": "Fine-tuned model for non-standard speech patterns",
                "best_for": ["Dysarthria", "Heavy accents", "Regional variants", "Speech disabilities"],
                "status": "unavailable",
                "endpoint": "/api/speech-to-text?use_non_standard_model=true"
            })
        
        return {
            "success": True,
            "models": models,
            "timestamp": "2024-01-01T00:00:00Z"  # You can use datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting speech models: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model information")

@router.get("/transcription-status")
async def transcription_status():
    """
    Check transcription service status
    """
    try:
        whisper_status = whisper_service.get_service_status()
        huggingface_available = hasattr(huggingface_service, 'transcribe_non_standard_speech')
        
        return {
            "success": True,
            "services": {
                "whisper": {
                    "status": "healthy" if whisper_status.get("model_loaded") else "unhealthy",
                    "model_loaded": whisper_status.get("model_loaded", False),
                    "device": whisper_status.get("device", "unknown"),
                    "model_name": whisper_status.get("model_name", "unknown")
                },
                "huggingface": {
                    "status": "healthy" if huggingface_available else "unavailable",
                    "available": huggingface_available
                }
            },
            "overall_status": "healthy" if whisper_status.get("model_loaded") else "degraded"
        }
    except Exception as e:
        logger.error(f"Error checking transcription status: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "overall_status": "unhealthy"
        }