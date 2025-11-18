# app/services/elevenlabs_service.py
import requests
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class ElevenLabsService:
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.base_url = "https://api.elevenlabs.io/v1"
        # Use a VALID voice ID - NOT "default"
        self.default_voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
        self.timeout = 30
        
        # Common default voice IDs
        self.default_voices = {
            "rachel": "21m00Tcm4TlvDq8ikWAM",
            "domi": "AZnzlk1XvdvUeBnXmlld", 
            "bella": "EXAVITQu4vr4xnSDxMaL",
            "antoni": "ErXwobaYiN019PkySvjV",
            "elli": "MF3mGyEYCl7XYWbV9V6O",
            "josh": "TxGEqnHWrfWFTfGW9XjX"
        }
    
    def text_to_speech(self, text: str, voice_id: str = None, **kwargs) -> bytes:
        """Convert text to speech using ElevenLabs"""
        try:
            # Validate inputs
            if not self.api_key:
                raise ValueError("ElevenLabs API key not configured")
            
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            # CRITICAL: Use valid voice ID, never "default"
            voice_id = voice_id or self.default_voice_id
            
            # If someone passes "default", replace it with a valid ID
            if voice_id == "default":
                voice_id = self.default_voice_id
                logger.warning("Replaced 'default' voice ID with valid voice ID")
            
            text = text.strip()
            
            # Limit text length
            if len(text) > 5000:
                text = text[:5000]
                logger.warning(f"Text truncated to 5000 characters")
            
            url = f"{self.base_url}/text-to-speech/{voice_id}"
            
            headers = {
                "xi-api-key": self.api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            }
            
            data = {
                "text": text,
                "model_id": kwargs.get("model_id", "eleven_monolingual_v1"),
                "voice_settings": {
                    "stability": kwargs.get("stability", 0.5),
                    "similarity_boost": kwargs.get("similarity_boost", 0.5),
                    "style": kwargs.get("style", 0.0),
                    "use_speaker_boost": kwargs.get("use_speaker_boost", True)
                }
            }
            
            logger.info(f"🔄 Calling ElevenLabs TTS with voice: {voice_id}")
            logger.debug(f"Text: '{text[:100]}...'")
            
            response = requests.post(url, json=data, headers=headers, timeout=self.timeout)
            
            if response.status_code == 200:
                audio_data = response.content
                if len(audio_data) == 0:
                    raise ValueError("ElevenLabs returned empty audio data")
                
                logger.info(f"✅ TTS successful! Generated {len(audio_data)} bytes")
                return audio_data
                
            elif response.status_code == 401:
                raise ValueError("Invalid ElevenLabs API key")
            elif response.status_code == 404:
                # Get available voices to help debug
                available_voices = self.get_voices()
                available_ids = [v['voice_id'] for v in available_voices]
                error_msg = f"Voice not found: {voice_id}. Available voices: {available_ids[:3]}..."  # Show first 3
                logger.error(error_msg)
                raise ValueError(error_msg)
            elif response.status_code == 429:
                raise ValueError("Rate limit exceeded for ElevenLabs API")
            else:
                error_msg = f"ElevenLabs API error {response.status_code}: {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)
                
        except requests.exceptions.Timeout:
            error_msg = "ElevenLabs API timeout - service took too long to respond"
            logger.error(error_msg)
            raise Exception(error_msg)
        except requests.exceptions.ConnectionError:
            error_msg = "Network error - cannot connect to ElevenLabs API"
            logger.error(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"TTS processing error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    def get_voices(self):
        """Get available voices from ElevenLabs"""
        try:
            if not self.api_key:
                logger.warning("No API key configured")
                return []
            
            url = f"{self.base_url}/voices"
            headers = {"xi-api-key": self.api_key}
            
            logger.info("🔄 Fetching available voices from ElevenLabs")
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                voices = []
                for voice in data.get("voices", []):
                    voices.append({
                        "voice_id": voice["voice_id"],
                        "name": voice["name"],
                        "category": voice.get("category", "premade"),
                        "description": voice.get("description", ""),
                        "preview_url": voice.get("preview_url", "")
                    })
                
                logger.info(f"✅ Retrieved {len(voices)} voices from ElevenLabs")
                return voices
            else:
                logger.error(f"Failed to get voices: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting voices: {str(e)}")
            return []
    
    def get_default_voice_id(self) -> str:
        """Get the default voice ID"""
        return self.default_voice_id

# Global instance
elevenlabs_service = ElevenLabsService()