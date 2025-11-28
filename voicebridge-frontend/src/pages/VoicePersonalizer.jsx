// src/pages/VoicePersonalizer.jsx
import { useState, useRef, useEffect } from "react";
import { 
  Mic, 
  Save, 
  Play, 
  Trash2, 
  Volume2,
  Loader2,
  Square,
  User,
  Settings,
  History,
  X
} from "lucide-react";
import Header from "../components/Layout/Header";

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API service functions
const voicePersonalizerAPI = {
  async getVoiceProfiles() {
    const response = await fetch(`${API_BASE_URL}/api/voice/profiles`);
    if (!response.ok) throw new Error('Failed to fetch voice profiles');
    const data = await response.json();
    return data.profiles || [];
  },

  async uploadVoiceSample(audioBlob, speechCharacteristics) {
    const formData = new FormData();
    const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    
    formData.append('audio', audioFile);
    formData.append('speech_characteristics', JSON.stringify(speechCharacteristics));

    const response = await fetch(`${API_BASE_URL}/api/voice/upload-sample`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Failed to upload voice sample');
    return await response.json();
  },

  async deleteVoiceSample(sampleId) {
    const response = await fetch(`${API_BASE_URL}/api/voice/samples/${sampleId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete voice sample');
    return await response.json();
  },

  async createVoiceProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/api/voice/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) throw new Error('Failed to create voice profile');
    return await response.json();
  },

  async trainVoiceModel(profileId, samples) {
    const response = await fetch(`${API_BASE_URL}/api/voice/profiles/${profileId}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ samples }),
    });
    
    if (!response.ok) throw new Error('Failed to train voice model');
    return await response.json();
  },

  async activateVoiceProfile(profileId) {
    const response = await fetch(`${API_BASE_URL}/api/voice/profiles/${profileId}/activate`, {
      method: 'POST',
    });
    
    if (!response.ok) throw new Error('Failed to activate voice profile');
    return await response.json();
  },

  async deleteVoiceProfile(profileId) {
    const response = await fetch(`${API_BASE_URL}/api/voice/profiles/${profileId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete voice profile');
    return await response.json();
  },

  async testVoiceSynthesis(text, profileId) {
    const response = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, profile_id: profileId }),
    });
    
    if (!response.ok) throw new Error('Failed to synthesize voice');
    return await response.blob();
  }
};

// History management functions
const saveVoiceHistory = (profileName, tone, samplesCount) => {
  const historyItem = {
    id: Date.now().toString(),
    profileName,
    tone,
    samplesCount,
    timestamp: new Date().toISOString(),
  };
  
  const existing = JSON.parse(localStorage.getItem('voicePersonalizer_history') || '[]');
  const updated = [historyItem, ...existing.slice(0, 49)]; // Keep last 50 items
  localStorage.setItem('voicePersonalizer_history', JSON.stringify(updated));
  return historyItem;
};

export default function VoicePersonalizer() {
  // Core states
  const [samples, setSamples] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const [activeSample, setActiveSample] = useState(null);
  const [voiceProfiles, setVoiceProfiles] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  // Voice settings
  const [voiceSettings, setVoiceSettings] = useState({
    name: "",
    tone: "neutral",
    speakingRate: 1.0,
    stability: 0.5,
    similarity: 0.75
  });

  // Speech characteristics
  const [speechCharacteristics, setSpeechCharacteristics] = useState({
    articulation_clarity: "medium",
    speech_rate: "medium",
    volume_consistency: "medium"
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Voice tones
  const tones = [
    { id: "neutral", name: "Neutral", emoji: "🎯" },
    { id: "patient", name: "Patient", emoji: "❤️" },
    { id: "clear", name: "Very Clear", emoji: "🔊" },
    { id: "calm", name: "Calm", emoji: "🌊" },
    { id: "friendly", name: "Friendly", emoji: "😊" }
  ];

  // Load data on component mount
  useEffect(() => {
    loadVoiceProfiles();
    loadHistory();
  }, []);

  const loadVoiceProfiles = async () => {
    try {
      const profiles = await voicePersonalizerAPI.getVoiceProfiles();
      setVoiceProfiles(profiles);
    } catch (error) {
      setVoiceProfiles([]);
    }
  };

  const loadHistory = () => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('voicePersonalizer_history') || '[]');
      setHistory(savedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('voicePersonalizer_history');
    setHistory([]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 22050,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true 
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          const result = await voicePersonalizerAPI.uploadVoiceSample(
            audioBlob,
            speechCharacteristics
          );

          const newSample = {
            id: result.sample_id || Date.now().toString(),
            audioUrl: URL.createObjectURL(audioBlob),
            duration: result.duration || '5s',
            date: new Date().toISOString(),
            confidence: result.confidence || 0.85
          };
          
          setSamples(prev => [...prev, newSample]);
          setRecordingError(null);
          
        } catch (error) {
          setRecordingError(error.message);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 10000);
      
    } catch (error) {
      setRecordingError(`Microphone error: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const playSample = async (sampleId) => {
    const sample = samples.find(s => s.id === sampleId);
    if (sample && sample.audioUrl) {
      setActiveSample(sampleId);
      try {
        const audio = new Audio(sample.audioUrl);
        await audio.play();
        audio.onended = () => setActiveSample(null);
      } catch (error) {
        setActiveSample(null);
      }
    }
  };

  const deleteSample = async (sampleId) => {
    try {
      await voicePersonalizerAPI.deleteVoiceSample(sampleId);
      setSamples(samples.filter(sample => sample.id !== sampleId));
    } catch (error) {
      console.error("Failed to delete sample:", error);
    }
  };

  const saveVoiceProfile = async () => {
    if (samples.length < 10) {
      alert("Please record at least 10 voice samples for better personalization");
      return;
    }
    
    if (!voiceSettings.name.trim()) {
      alert("Please give your custom voice a name");
      return;
    }

    setIsProcessing(true);
    
    try {
      const profileData = {
        name: voiceSettings.name,
        tone: voiceSettings.tone,
        speaking_rate: voiceSettings.speakingRate,
        stability: voiceSettings.stability,
        similarity: voiceSettings.similarity,
        speech_characteristics: speechCharacteristics,
        sample_ids: samples.map(s => s.id)
      };

      const result = await voicePersonalizerAPI.createVoiceProfile(profileData);
      
      if (result.success) {
        await voicePersonalizerAPI.trainVoiceModel(result.profile_id, samples);
        await loadVoiceProfiles();
        
        // Save to history
        saveVoiceHistory(voiceSettings.name, voiceSettings.tone, samples.length);
        loadHistory();
        
        setSamples([]);
        setVoiceSettings(prev => ({ ...prev, name: "" }));
        alert("Voice profile created successfully!");
      }
    } catch (error) {
      alert("Failed to save voice profile: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const activateProfile = async (profileId) => {
    try {
      const result = await voicePersonalizerAPI.activateVoiceProfile(profileId);
      if (result.success) {
        await loadVoiceProfiles();
      }
    } catch (error) {
      console.error("Failed to activate profile:", error);
    }
  };

  const testVoiceSynthesis = async () => {
    const activeProfile = voiceProfiles.find(p => p.isActive);
    if (!activeProfile) {
      alert("Please activate a voice profile first");
      return;
    }

    try {
      const testText = "Hello, this is a test of your personalized voice. How does it sound?";
      const audioBlob = await voicePersonalizerAPI.testVoiceSynthesis(testText, activeProfile.id);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      alert("Failed to test voice synthesis: " + error.message);
    }
  };

  const progress = Math.min((samples.length / 25) * 100, 100);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Use the shared Header component */}
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Content Card */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">🎙️ Voice Personalizer</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create your unique digital voice using AI
            </p>
          </div>

          {/* Progress Overview */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <div className="text-2xl font-bold text-purple-600">{samples.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Samples Recorded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Recording Section */}
          <div className="space-y-6">
            {/* Speech Characteristics */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Speech Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Articulation</label>
                  <select
                    value={speechCharacteristics.articulation_clarity}
                    onChange={(e) => setSpeechCharacteristics(prev => ({
                      ...prev,
                      articulation_clarity: e.target.value
                    }))}
                    className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                  >
                    <option value="low" className="bg-white dark:bg-gray-800">Needs clearer articulation</option>
                    <option value="medium" className="bg-white dark:bg-gray-800">Moderate clarity</option>
                    <option value="high" className="bg-white dark:bg-gray-800">Clear articulation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Speech Rate</label>
                  <select
                    value={speechCharacteristics.speech_rate}
                    onChange={(e) => setSpeechCharacteristics(prev => ({
                      ...prev,
                      speech_rate: e.target.value
                    }))}
                    className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                  >
                    <option value="slow" className="bg-white dark:bg-gray-800">Slower speech</option>
                    <option value="medium" className="bg-white dark:bg-gray-800">Moderate pace</option>
                    <option value="fast" className="bg-white dark:bg-gray-800">Faster speech</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Volume</label>
                  <select
                    value={speechCharacteristics.volume_consistency}
                    onChange={(e) => setSpeechCharacteristics(prev => ({
                      ...prev,
                      volume_consistency: e.target.value
                    }))}
                    className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                  >
                    <option value="low" className="bg-white dark:bg-gray-800">Softer volume</option>
                    <option value="medium" className="bg-white dark:bg-gray-800">Moderate volume</option>
                    <option value="high" className="bg-white dark:bg-gray-800">Louder volume</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recording Interface */}
            <div className="text-center space-y-4">
              {/* Error Display */}
              {recordingError && (
                <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 justify-center">
                    {recordingError}
                  </div>
                </div>
              )}

              {/* Recording Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording 
                    ? "bg-red-600 animate-pulse" 
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>

              {/* Recording Visualization */}
              {isRecording && (
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i}
                      className="w-2 h-8 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRecording ? "Recording... Speak naturally" : "Click to start recording"}
              </p>
            </div>
          </div>

          {/* Recorded Samples */}
          {samples.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Recorded Samples</h3>
              <div className="space-y-3">
                {samples.map((sample, index) => (
                  <div key={sample.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 dark:text-gray-200">Voice Sample {index + 1}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span>{sample.duration}</span>
                            <span>•</span>
                            <span>{Math.round(sample.confidence * 100)}% quality</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => playSample(sample.id)}
                          disabled={activeSample === sample.id}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSample(sample.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Profile Creation */}
          {samples.length >= 10 && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create Voice Profile</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Voice Name</label>
                  <input
                    type="text"
                    value={voiceSettings.name}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a name for your voice"
                    className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Voice Tone</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {tones.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => setVoiceSettings(prev => ({ ...prev, tone: tone.id }))}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          voiceSettings.tone === tone.id
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                        }`}
                      >
                        <div className="text-2xl mb-1">{tone.emoji}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{tone.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={saveVoiceProfile}
                  disabled={isProcessing || !voiceSettings.name.trim()}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-semibold shadow-lg transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Voice Profile...
                    </div>
                  ) : (
                    "Create Voice Profile"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Voice Profiles */}
          {voiceProfiles.length > 0 && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Voice Profiles</h3>
              <div className="space-y-3">
                {voiceProfiles.map((profile) => (
                  <div key={profile.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <User className="w-6 h-6 text-purple-600" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{profile.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{profile.tone} • {profile.status}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!profile.isActive && (
                          <button
                            onClick={() => activateProfile(profile.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm"
                          >
                            Activate
                          </button>
                        )}
                        {profile.isActive && (
                          <button
                            onClick={testVoiceSynthesis}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all text-sm flex items-center gap-2"
                          >
                            <Volume2 className="w-4 h-4" />
                            Test
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-center gap-6">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <History className="w-5 h-5" />
                <span>History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-600 dark:text-gray-300">
                  Speaking Rate: <span className="text-blue-600 dark:text-blue-400">{voiceSettings.speakingRate}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.speakingRate}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, speakingRate: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-500"
                />
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>Slower</span>
                  <span>Faster</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-600 dark:text-gray-300">
                  Stability: <span className="text-blue-600 dark:text-blue-400">{voiceSettings.stability}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.stability}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, stability: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-500"
                />
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>More Variable</span>
                  <span>More Stable</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-600 dark:text-gray-300">
                  Similarity: <span className="text-blue-600 dark:text-blue-400">{voiceSettings.similarity}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.similarity}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, similarity: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-500"
                />
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>Less Similar</span>
                  <span>More Similar</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className="mt-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white">History</h3>
              <div className="flex gap-3">
                <button
                  onClick={clearHistory}
                  disabled={history.length === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  Clear History
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No history yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your created voice profiles will appear here</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.profileName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="capitalize">{item.tone}</span>
                          <span>•</span>
                          <span>{item.samplesCount} samples</span>
                          <span>•</span>
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // You could implement a function to load this profile
                          alert(`Loading profile: ${item.profileName}`);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}