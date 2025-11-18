import whisper
import torch
import numpy as np
from typing import Dict, Any, Optional
import tempfile
import os
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class WhisperService:
    def __init__(self):
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_loaded = False
        self.load_model()
    
    def load_model(self):
        """Load Whisper model with enhanced error handling"""
        try:
            logger.info(f"🔄 Loading Whisper model: {settings.WHISPER_MODEL} on {self.device}")
            self.model = whisper.load_model(settings.WHISPER_MODEL, device=self.device)
            self.model_loaded = True
            logger.info(f"✅ Successfully loaded Whisper model {settings.WHISPER_MODEL} on {self.device}")
            
            # Log model details
            model_size = sum(p.numel() for p in self.model.parameters())
            logger.info(f"📊 Model parameters: {model_size:,}")
            
        except Exception as e:
            logger.error(f"❌ Error loading Whisper model: {e}")
            if "cuda" in str(e).lower() and self.device == "cuda":
                logger.info("🔄 CUDA unavailable, falling back to CPU...")
                self.device = "cpu"
                try:
                    self.model = whisper.load_model(settings.WHISPER_MODEL, device="cpu")
                    self.model_loaded = True
                    logger.info(f"✅ Successfully loaded Whisper model on CPU")
                except Exception as cpu_error:
                    logger.error(f"❌ Failed to load model on CPU: {cpu_error}")
                    raise Exception(f"Failed to load Whisper model on any device: {str(cpu_error)}")
            else:
                self.model_loaded = False
                raise Exception(f"Failed to load Whisper model: {str(e)}")
    
    def transcribe_audio(self, audio_path: str, language: str = "en") -> Dict[str, Any]:
        """Transcribe audio file using Whisper with comprehensive error handling"""
        try:
            if not self.model_loaded or not self.model:
                logger.warning("Model not loaded, attempting to load...")
                self.load_model()
            
            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            # Validate file size
            file_size = os.path.getsize(audio_path)
            if file_size == 0:
                raise ValueError("Audio file is empty")
            if file_size > 100 * 1024 * 1024:  # 100MB limit
                raise ValueError("Audio file too large (max 100MB)")
            
            file_ext = os.path.splitext(audio_path)[1].lower()
            logger.info(f"🎯 Transcribing audio: {os.path.basename(audio_path)} "
                       f"({file_size:,} bytes, {file_ext})")
            
            # Load audio with fallback strategy
            audio_array = self._load_audio_with_fallback(audio_path)
            
            # Validate audio data
            if len(audio_array) == 0:
                raise ValueError("Audio file contains no data")
            
            logger.info(f"🔊 Audio loaded: {len(audio_array):,} samples, "
                       f"duration: {len(audio_array)/16000:.2f}s")
            
            # Transcribe with Whisper
            result = self.model.transcribe(
                audio_array, 
                language=language,
                fp16=False,
                no_speech_threshold=0.6,
                logprob_threshold=-1.0,
                compression_ratio_threshold=2.4
            )
            
            confidence = self._calculate_confidence(result)
            transcription_text = result["text"].strip()
            
            logger.info(f"📝 Transcription completed: "
                       f"'{transcription_text[:100]}{'...' if len(transcription_text) > 100 else ''}' "
                       f"(confidence: {confidence:.2f})")
            
            return {
                "success": True,
                "text": transcription_text,
                "language": result.get("language", language),
                "confidence": confidence,
                "full_transcription": transcription_text,
                "segments": result.get("segments", []),
                "duration": len(audio_array) / 16000  # Duration in seconds
            }
            
        except FileNotFoundError as e:
            logger.error(f"❌ File not found: {e}")
            raise
        except ValueError as e:
            logger.error(f"❌ Invalid audio file: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Transcription error: {e}", exc_info=True)
            raise Exception(f"Transcription failed: {str(e)}")
    
    def _load_audio_with_fallback(self, file_path: str) -> np.ndarray:
        """Load audio with comprehensive fallback strategy"""
        methods = [
            ("soundfile", self._load_with_soundfile),
            ("pydub", self._load_with_pydub),
            ("librosa", self._load_with_librosa)
        ]
        
        last_error = None
        for method_name, method_func in methods:
            try:
                audio_array = method_func(file_path)
                logger.info(f"✅ Audio loaded successfully with {method_name}")
                return audio_array
            except Exception as e:
                logger.warning(f"❌ {method_name.capitalize()} failed: {str(e)}")
                last_error = e
                continue
        
        # All methods failed
        error_msg = f"All audio loading methods failed. Last error: {str(last_error)}"
        logger.error(error_msg)
        raise Exception(error_msg)
    
    def _load_with_soundfile(self, file_path: str) -> np.ndarray:
        """Load audio using soundfile (recommended - no ffmpeg dependency)"""
        import soundfile as sf
        import librosa
        
        # Load audio file with soundfile
        audio, sr = sf.read(file_path)
        
        # Convert to mono if stereo
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)
        
        # Resample to 16kHz if needed
        if sr != 16000:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
        
        # Ensure float32 format
        audio = audio.astype(np.float32)
        
        # Normalize audio to prevent clipping
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            audio = audio / max_val * 0.9  # Scale to 90% of max to avoid clipping
        
        logger.debug(f"🔊 Soundfile: {len(audio)} samples, {sr}Hz -> 16000Hz")
        return audio
    
    def _load_with_pydub(self, file_path: str) -> np.ndarray:
        """Load audio using pydub - handles most formats"""
        from pydub import AudioSegment
        
        # Load audio file
        audio = AudioSegment.from_file(file_path)
        
        # Convert to 16kHz mono
        audio = audio.set_frame_rate(16000).set_channels(1)
        
        # Get raw samples
        samples = np.array(audio.get_array_of_samples())
        
        # Convert to float32 in range [-1, 1]
        if audio.sample_width == 1:  # 8-bit
            audio_float = (samples.astype(np.float32) - 128) / 128.0
        elif audio.sample_width == 2:  # 16-bit
            audio_float = samples.astype(np.float32) / 32768.0
        elif audio.sample_width == 4:  # 32-bit
            audio_float = samples.astype(np.float32) / 2147483648.0
        else:
            audio_float = samples.astype(np.float32) / 32768.0  # Default to 16-bit scaling
        
        # Normalize
        max_val = np.max(np.abs(audio_float))
        if max_val > 0:
            audio_float = audio_float / max_val * 0.9
        
        logger.debug(f"🔊 Pydub: {len(audio_float)} samples, {audio.frame_rate}Hz -> 16000Hz")
        return audio_float
    
    def _load_with_librosa(self, file_path: str) -> np.ndarray:
        """Load audio using librosa as fallback"""
        import librosa
        
        # Load with librosa (auto-converts to 16kHz mono)
        audio, sr = librosa.load(file_path, sr=16000, mono=True)
        audio = audio.astype(np.float32)
        
        # Normalize
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            audio = audio / max_val * 0.9
        
        logger.debug(f"🔊 Librosa: {len(audio)} samples, {sr}Hz")
        return audio
    
    def transcribe_audio_bytes(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        """Transcribe audio from bytes with proper cleanup"""
        temp_path = None
        try:
            # Create temporary file with appropriate extension
            file_ext = self._detect_audio_format(audio_bytes)
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
                temp_file.write(audio_bytes)
                temp_path = temp_file.name
            
            logger.info(f"📁 Created temporary file: {temp_path}")
            result = self.transcribe_audio(temp_path, language)
            return result
            
        except Exception as e:
            logger.error(f"❌ Bytes transcription error: {e}")
            raise Exception(f"Transcription from bytes failed: {str(e)}")
        finally:
            # Clean up temporary file
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                    logger.debug("🧹 Temporary file cleaned up")
                except Exception as cleanup_error:
                    logger.warning(f"⚠️ Failed to clean up temp file: {cleanup_error}")
    
    def _detect_audio_format(self, audio_bytes: bytes) -> str:
        """Detect audio format from bytes"""
        if len(audio_bytes) < 12:
            return ".wav"  # Default to WAV
        
        # Simple magic number detection
        if audio_bytes[:4] == b'RIFF' and audio_bytes[8:12] == b'WAVE':
            return ".wav"
        elif audio_bytes[:4] == b'fLaC':
            return ".flac"
        elif audio_bytes[:3] == b'ID3':
            return ".mp3"
        elif audio_bytes[:4] == b'OggS':
            return ".ogg"
        elif audio_bytes[:4] == b'FORM' and audio_bytes[8:12] in [b'AIFF', b'AIFC']:
            return ".aiff"
        else:
            # Default to webm for modern browser recordings
            return ".webm"
    
    def _calculate_confidence(self, result: Dict) -> float:
        """Calculate confidence score from Whisper result"""
        try:
            segments = result.get("segments", [])
            if not segments:
                return 0.7  # Lower default confidence for no segments
            
            # Calculate confidence from log probabilities
            confidences = []
            for seg in segments:
                if seg.get("avg_logprob") is not None:
                    # Convert log probability to confidence (0-1 scale)
                    logprob = seg["avg_logprob"]
                    confidence = min(1.0, max(0.0, (logprob + 10) / 10))
                    confidences.append(confidence)
            
            if confidences:
                overall_confidence = np.mean(confidences)
                # Apply some smoothing
                overall_confidence = max(0.1, min(0.99, overall_confidence))
                return round(overall_confidence, 2)
            else:
                return 0.7  # Default confidence when no logprobs available
                
        except Exception as e:
            logger.warning(f"⚠️ Confidence calculation failed: {e}, using default")
            return 0.7
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get service status information"""
        return {
            "model_loaded": self.model_loaded,
            "device": self.device,
            "model_name": settings.WHISPER_MODEL if self.model_loaded else None,
            "service": "whisper"
        }

# Global instance
whisper_service = WhisperService()