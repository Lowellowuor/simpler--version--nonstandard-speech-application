// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { 
  Save, 
  RefreshCw, 
  Volume2, 
  Mic, 
  User, 
  Moon, 
  Sun,
  Download,
  Upload,
  Trash2,
  Shield,
  Wifi,
  WifiOff
} from "lucide-react";

// API endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [backendConnected, setBackendConnected] = useState(false);

  // Settings states
  const [settings, setSettings] = useState({
    // General
    theme: "system",
    language: "en-US",
    autoSave: true,
    notifications: true,
    
    // Speech Lab
    speechLab: {
      defaultLanguage: "en-US",
      defaultVoice: "21m00Tcm4TlvDq8ikWAM",
      playbackSpeed: 1.0,
      autoPlay: false,
      liveTranscription: true
    },
    
    // Voice Personalizer
    voicePersonalizer: {
      defaultTone: "neutral",
      minSamples: 10,
      autoTrain: true,
      speechCharacteristics: {
        articulation_clarity: "medium",
        speech_rate: "medium",
        volume_consistency: "medium"
      }
    },
    
    // Privacy
    privacy: {
      dataCollection: false,
      analytics: false,
      saveAudio: true,
      saveTranscripts: true
    },
    
    // Advanced
    advanced: {
      apiEndpoint: API_BASE_URL,
      cacheSize: "100MB",
      autoUpdate: true,
      debugMode: false
    }
  });

  // Available options
  const themes = [
    { id: "light", name: "Light", icon: Sun },
    { id: "dark", name: "Dark", icon: Moon },
    { id: "system", name: "System", icon: RefreshCw }
  ];

  const languages = [
    { code: "en-US", name: "English (US)", flag: "🇺🇸" },
    { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
    { code: "sw-KE", name: "Kiswahili (Kenya)", flag: "🇰🇪" },
    { code: "en-KE", name: "English (Kenyan)", flag: "🇰🇪" }
  ];

  const voiceModels = [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" }
  ];

  const tones = [
    { id: "neutral", name: "Neutral", emoji: "🎯" },
    { id: "patient", name: "Patient", emoji: "❤️" },
    { id: "clear", name: "Very Clear", emoji: "🔊" },
    { id: "calm", name: "Calm", emoji: "🌊" },
    { id: "friendly", name: "Friendly", emoji: "😊" }
  ];

  const tabs = [
    { id: "general", name: "General", icon: User },
    { id: "speech-lab", name: "Speech Lab", icon: Mic },
    { id: "voice-personalizer", name: "Voice Personalizer", icon: Volume2 },
    { id: "privacy", name: "Privacy", icon: Shield },
    { id: "advanced", name: "Advanced", icon: Save }
  ];

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      setBackendConnected(response.ok);
    } catch (error) {
      setBackendConnected(false);
    }
  };

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('voiceai_settings');
      if (savedSettings) {
        setSettings(prev => ({
          ...prev,
          ...JSON.parse(savedSettings)
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = () => {
    setIsLoading(true);
    setSaveStatus("saving");
    
    try {
      localStorage.setItem('voiceai_settings', JSON.stringify(settings));
      
      // Apply theme immediately
      if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      setTimeout(() => {
        setSaveStatus("saved");
        setIsLoading(false);
        
        setTimeout(() => {
          setSaveStatus("");
        }, 2000);
      }, 500);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus("error");
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    if (!window.confirm("Are you sure you want to reset all settings to default? This action cannot be undone.")) return;
    
    localStorage.removeItem('voiceai_settings');
    setSettings({
      // Reset to default values
      theme: "system",
      language: "en-US",
      autoSave: true,
      notifications: true,
      speechLab: {
        defaultLanguage: "en-US",
        defaultVoice: "21m00Tcm4TlvDq8ikWAM",
        playbackSpeed: 1.0,
        autoPlay: false,
        liveTranscription: true
      },
      voicePersonalizer: {
        defaultTone: "neutral",
        minSamples: 10,
        autoTrain: true,
        speechCharacteristics: {
          articulation_clarity: "medium",
          speech_rate: "medium",
          volume_consistency: "medium"
        }
      },
      privacy: {
        dataCollection: false,
        analytics: false,
        saveAudio: true,
        saveTranscripts: true
      },
      advanced: {
        apiEndpoint: API_BASE_URL,
        cacheSize: "100MB",
        autoUpdate: true,
        debugMode: false
      }
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'voiceai-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        setSettings(prev => ({
          ...prev,
          ...importedSettings
        }));
        alert('Settings imported successfully!');
      } catch (error) {
        alert('Error importing settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllData = () => {
    if (!window.confirm("Are you sure you want to clear all app data? This will delete all your history, voice profiles, and settings. This action cannot be undone.")) return;
    
    try {
      localStorage.clear();
      alert('All data has been cleared. The page will reload.');
      window.location.reload();
    } catch (error) {
      alert('Error clearing data. Please try again.');
    }
  };

  const updateSetting = (path, value) => {
    const pathParts = path.split('.');
    setSettings(prev => {
      const newSettings = { ...prev };
      let current = newSettings;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current[pathParts[i]] = { ...current[pathParts[i]] };
        current = current[pathParts[i]];
      }
      
      current[pathParts[pathParts.length - 1]] = value;
      return newSettings;
    });
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case "saving": return "Saving...";
      case "saved": return "Settings saved!";
      case "error": return "Error saving settings";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Content Card */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">⚙️ Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Customize your VoiceAI experience
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex justify-center mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
              backendConnected 
                ? "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" 
                : "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}>
              {backendConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {backendConnected ? 'AI Backend Connected' : 'Backend Offline'}
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all ${
                          activeTab === tab.id
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Save Button */}
                <div className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save Changes
                  </button>
                  
                  {saveStatus && (
                    <div className={`mt-2 text-center text-sm ${
                      saveStatus === "saved" ? "text-green-600 dark:text-green-400" :
                      saveStatus === "error" ? "text-red-600 dark:text-red-400" :
                      "text-blue-600 dark:text-blue-400"
                    }`}>
                      {getSaveStatusText()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                {/* General Settings */}
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">General Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Theme */}
                      <div>
                        <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                          Theme
                        </label>
                        <div className="space-y-2">
                          {themes.map((theme) => {
                            const Icon = theme.icon;
                            return (
                              <button
                                key={theme.id}
                                onClick={() => updateSetting('theme', theme.id)}
                                className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all ${
                                  settings.theme === theme.id
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium text-gray-900 dark:text-white">{theme.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Language */}
                      <div>
                        <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                          Language
                        </label>
                        <select
                          value={settings.language}
                          onChange={(e) => updateSetting('language', e.target.value)}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                        >
                          {languages.map((lang) => (
                            <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-800">
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Auto Save</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Automatically save your work
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('autoSave', !settings.autoSave)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.autoSave ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Notifications</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Show desktop notifications
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', !settings.notifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Speech Lab Settings */}
                {activeTab === "speech-lab" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Speech Lab Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                          Default Language
                        </label>
                        <select
                          value={settings.speechLab.defaultLanguage}
                          onChange={(e) => updateSetting('speechLab.defaultLanguage', e.target.value)}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                        >
                          {languages.map((lang) => (
                            <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-800">
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                          Default Voice
                        </label>
                        <select
                          value={settings.speechLab.defaultVoice}
                          onChange={(e) => updateSetting('speechLab.defaultVoice', e.target.value)}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                        >
                          {voiceModels.map((model) => (
                            <option key={model.id} value={model.id} className="bg-white dark:bg-gray-800">
                              {model.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                        Playback Speed: <span className="text-blue-600 dark:text-blue-400">{settings.speechLab.playbackSpeed}x</span>
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={settings.speechLab.playbackSpeed}
                        onChange={(e) => updateSetting('speechLab.playbackSpeed', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-500"
                      />
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <span>Slower</span>
                        <span>Faster</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Auto Play</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Automatically play audio after generation
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('speechLab.autoPlay', !settings.speechLab.autoPlay)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.speechLab.autoPlay ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.speechLab.autoPlay ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Live Transcription</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Enable real-time speech recognition
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('speechLab.liveTranscription', !settings.speechLab.liveTranscription)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.speechLab.liveTranscription ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.speechLab.liveTranscription ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice Personalizer Settings */}
                {activeTab === "voice-personalizer" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Voice Personalizer Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                          Default Tone
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {tones.map((tone) => (
                            <button
                              key={tone.id}
                              onClick={() => updateSetting('voicePersonalizer.defaultTone', tone.id)}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                settings.voicePersonalizer.defaultTone === tone.id
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

                      <div>
                        <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                          Minimum Samples
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={settings.voicePersonalizer.minSamples}
                          onChange={(e) => updateSetting('voicePersonalizer.minSamples', parseInt(e.target.value))}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-gray-900 dark:text-white"
                        />
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Minimum voice samples required for training
                        </div>
                      </div>
                    </div>

                    {/* Speech Characteristics */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Speech Characteristics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Articulation</label>
                          <select
                            value={settings.voicePersonalizer.speechCharacteristics.articulation_clarity}
                            onChange={(e) => updateSetting('voicePersonalizer.speechCharacteristics.articulation_clarity', e.target.value)}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                          >
                            <option value="low">Needs clearer articulation</option>
                            <option value="medium">Moderate clarity</option>
                            <option value="high">Clear articulation</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Speech Rate</label>
                          <select
                            value={settings.voicePersonalizer.speechCharacteristics.speech_rate}
                            onChange={(e) => updateSetting('voicePersonalizer.speechCharacteristics.speech_rate', e.target.value)}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                          >
                            <option value="slow">Slower speech</option>
                            <option value="medium">Moderate pace</option>
                            <option value="fast">Faster speech</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Volume</label>
                          <select
                            value={settings.voicePersonalizer.speechCharacteristics.volume_consistency}
                            onChange={(e) => updateSetting('voicePersonalizer.speechCharacteristics.volume_consistency', e.target.value)}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                          >
                            <option value="low">Softer volume</option>
                            <option value="medium">Moderate volume</option>
                            <option value="high">Louder volume</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Auto Train</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Automatically train voice models when ready
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('voicePersonalizer.autoTrain', !settings.voicePersonalizer.autoTrain)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.voicePersonalizer.autoTrain ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.voicePersonalizer.autoTrain ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === "privacy" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy & Data</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Save Audio Files</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Store recorded audio files locally
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('privacy.saveAudio', !settings.privacy.saveAudio)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.privacy.saveAudio ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.privacy.saveAudio ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Save Transcripts</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Store text transcripts locally
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('privacy.saveTranscripts', !settings.privacy.saveTranscripts)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.privacy.saveTranscripts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.privacy.saveTranscripts ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Data Collection</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Help improve VoiceAI by sharing usage data
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('privacy.dataCollection', !settings.privacy.dataCollection)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.privacy.dataCollection ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.privacy.dataCollection ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Analytics</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Collect usage analytics and crash reports
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('privacy.analytics', !settings.privacy.analytics)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.privacy.analytics ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.privacy.analytics ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Settings */}
                {activeTab === "advanced" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Settings</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          API Endpoint
                        </label>
                        <input
                          type="url"
                          value={settings.advanced.apiEndpoint}
                          onChange={(e) => updateSetting('advanced.apiEndpoint', e.target.value)}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                          placeholder="https://api.example.com"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Auto Update</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Automatically check for updates
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('advanced.autoUpdate', !settings.advanced.autoUpdate)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.advanced.autoUpdate ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.advanced.autoUpdate ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Debug Mode</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Enable detailed logging and debugging
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('advanced.debugMode', !settings.advanced.debugMode)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.advanced.debugMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.advanced.debugMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Data Management */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Data Management</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={exportSettings}
                          className="flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition"
                        >
                          <Download className="w-5 h-5" />
                          Export Settings
                        </button>

                        <label className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition cursor-pointer">
                          <Upload className="w-5 h-5" />
                          Import Settings
                          <input
                            type="file"
                            accept=".json"
                            onChange={importSettings}
                            className="hidden"
                          />
                        </label>

                        <button
                          onClick={resetSettings}
                          className="flex items-center justify-center gap-2 p-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition"
                        >
                          <RefreshCw className="w-5 h-5" />
                          Reset Settings
                        </button>
                      </div>

                      <button
                        onClick={clearAllData}
                        className="w-full mt-4 flex items-center justify-center gap-2 p-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
                      >
                        <Trash2 className="w-5 h-5" />
                        Clear All Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}