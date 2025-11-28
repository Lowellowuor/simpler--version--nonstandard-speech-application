import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Layout/Header";
import VoicePersonalizer from "./pages/VoicePersonalizer";
import SpeechLab from "./pages/SpeechLab";
import History from "./pages/History";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* Redirect root to Speech Lab as the main page */}
            <Route path="/" element={<Navigate to="/speech-lab" replace />} />
            
            {/* Main application routes */}
            <Route path="/speech-lab" element={<SpeechLab />} />
            <Route path="/voice-personalizer" element={<VoicePersonalizer />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Fallback route for 404 pages */}
            <Route path="*" element={<Navigate to="/speech-lab" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}