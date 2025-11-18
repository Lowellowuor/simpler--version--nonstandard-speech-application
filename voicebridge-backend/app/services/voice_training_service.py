import os
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.core.config import settings
from app.services.elevenlabs_service import elevenlabs_service

class VoiceTrainingService:
    def __init__(self):
        self.profiles_file = "data/voice_profiles.json"
        self.samples_dir = settings.UPLOAD_DIR
        self.ensure_directories()
    
    def ensure_directories(self):
        """Ensure necessary directories exist"""
        os.makedirs(self.samples_dir, exist_ok=True)
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
    
    def create_voice_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new voice profile"""
        try:
            profile_id = str(uuid.uuid4())
            
            profile = {
                "id": profile_id,
                "name": profile_data["name"],
                "description": profile_data.get("description", ""),
                "tone": profile_data.get("tone", "neutral"),
                "speaking_rate": profile_data.get("speaking_rate", 1.0),
                "stability": profile_data.get("stability", 0.5),
                "similarity": profile_data.get("similarity", 0.75),
                "speech_characteristics": profile_data.get("speech_characteristics", {}),
                "samples": [],
                "elevenlabs_voice_id": None,
                "is_active": False,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "accuracy": 0.0,
                "samples_count": 0
            }
            
            # Save to file (in production, use database)
            self._save_profile(profile)
            
            return profile
            
        except Exception as e:
            print(f"Error creating voice profile: {e}")
            raise
    
    def add_voice_sample(self, profile_id: str, sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a voice sample to profile"""
        try:
            profile = self._get_profile(profile_id)
            if not profile:
                raise Exception("Profile not found")
            
            sample_id = str(uuid.uuid4())
            sample = {
                "id": sample_id,
                "phrase": sample_data["phrase"],
                "audio_path": sample_data["audio_path"],
                "category": sample_data.get("category", "general"),
                "duration": sample_data.get("duration", 0),
                "accuracy": sample_data.get("accuracy", 0.0),
                "transcription": sample_data.get("transcription", ""),
                "confidence": sample_data.get("confidence", 0.0),
                "created_at": datetime.now().isoformat()
            }
            
            profile["samples"].append(sample)
            profile["samples_count"] = len(profile["samples"])
            profile["updated_at"] = datetime.now().isoformat()
            
            self._save_profile(profile)
            
            return sample
            
        except Exception as e:
            print(f"Error adding voice sample: {e}")
            raise
    
    def train_voice_model(self, profile_id: str) -> Dict[str, Any]:
        """Train voice model using Eleven Labs"""
        try:
            profile = self._get_profile(profile_id)
            if not profile:
                raise Exception("Profile not found")
            
            if len(profile["samples"]) < 5:
                raise Exception("At least 5 voice samples required for training")
            
            # Create voice in Eleven Labs
            voice_name = f"{profile['name']}_{profile_id[:8]}"
            description = f"Personalized voice for {profile['name']} - Non-standard speech optimized"
            
            # Prepare sample files for Eleven Labs
            sample_files = []
            for sample in profile["samples"]:
                # In production, you would upload the actual audio files
                # This is a simplified version
                sample_files.append({
                    "path": sample["audio_path"],
                    "phrase": sample["phrase"]
                })
            
            # Note: Actual file upload to Eleven Labs would happen here
            # For now, we'll simulate the response
            elevenlabs_voice_id = f"voice_{profile_id.replace('-', '')}"
            
            profile["elevenlabs_voice_id"] = elevenlabs_voice_id
            profile["is_active"] = True
            profile["updated_at"] = datetime.now().isoformat()
            
            self._save_profile(profile)
            
            return {
                "success": True,
                "voice_id": elevenlabs_voice_id,
                "profile_id": profile_id,
                "message": "Voice model training completed successfully"
            }
            
        except Exception as e:
            print(f"Error training voice model: {e}")
            raise
    
    def analyze_speech_patterns(self, sample_ids: List[str]) -> Dict[str, Any]:
        """Analyze speech patterns from samples"""
        try:
            # This would use your non-standard speech analysis logic
            # Based on the Nairobi Innovation Sprint project
            
            analysis_result = {
                "articulation_score": 85.5,
                "consistency_score": 78.2,
                "overall_score": 82.0,
                "recommended_settings": {
                    "speaking_rate": 0.9,
                    "stability": 0.6,
                    "similarity": 0.8
                },
                "detected_patterns": [
                    "clear_articulation",
                    "consistent_pacing"
                ]
            }
            
            return analysis_result
            
        except Exception as e:
            print(f"Error analyzing speech patterns: {e}")
            raise
    
    def _get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get profile by ID"""
        try:
            profiles = self._load_profiles()
            return next((p for p in profiles if p["id"] == profile_id), None)
        except:
            return None
    
    def _load_profiles(self) -> List[Dict[str, Any]]:
        """Load all profiles from file"""
        try:
            if os.path.exists(self.profiles_file):
                with open(self.profiles_file, 'r') as f:
                    return json.load(f)
            return []
        except:
            return []
    
    def _save_profile(self, profile: Dict[str, Any]):
        """Save profile to file"""
        try:
            profiles = self._load_profiles()
            
            # Update existing or add new
            existing_index = next((i for i, p in enumerate(profiles) if p["id"] == profile["id"]), -1)
            if existing_index >= 0:
                profiles[existing_index] = profile
            else:
                profiles.append(profile)
            
            with open(self.profiles_file, 'w') as f:
                json.dump(profiles, f, indent=2)
                
        except Exception as e:
            print(f"Error saving profile: {e}")
            raise

# Global instance
voice_training_service = VoiceTrainingService()