// src/pages/History.jsx
import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Play, 
  Download, 
  Copy, 
  Trash2, 
  Star, 
  StarOff,
  Calendar,
  Clock,
  Volume2,
  MessageSquare,
  FileAudio,
  Archive,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Header from "../components/Layout/Header";

// API endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function History() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);

  // Fetch history data
  useEffect(() => {
    testBackendConnection();
    fetchHistoryData();
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      setBackendConnected(response.ok);
    } catch (error) {
      setBackendConnected(false);
    }
  };

  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      // Fetch from localStorage for Speech Lab
      const sttHistory = JSON.parse(localStorage.getItem('speechLab_stt_history') || '[]');
      const ttsHistory = JSON.parse(localStorage.getItem('speechLab_tts_history') || '[]');

      // Combine and normalize data
      const combinedHistory = [
        ...sttHistory.map(item => ({
          ...item,
          id: `stt-${item.id || Date.now()}`,
          type: 'stt',
          service: 'speech-lab'
        })),
        ...ttsHistory.map(item => ({
          ...item,
          id: `tts-${item.id || Date.now()}`,
          type: 'tts',
          service: 'speech-lab'
        }))
      ];

      setHistory(combinedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "all", name: "All", count: history.length, emoji: "📚" },
    { id: "stt", name: "Speech to Text", count: history.filter(item => item.type === "stt").length, emoji: "🎤" },
    { id: "tts", name: "Text to Speech", count: history.filter(item => item.type === "tts").length, emoji: "🔊" }
  ];

  const dateFilters = [
    { id: "all", name: "All Time" },
    { id: "today", name: "Today" },
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" }
  ];

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      // Tab filter
      if (activeTab !== "all" && item.type !== activeTab) return false;

      // Search filter
      if (searchQuery && !item.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Date filter
      const now = new Date();
      const itemDate = new Date(item.timestamp);
      
      switch (dateFilter) {
        case "today":
          if (itemDate.toDateString() !== now.toDateString()) return false;
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < weekAgo) return false;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < monthAgo) return false;
          break;
        default:
          break;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.timestamp) - new Date(a.timestamp);
        case "oldest":
          return new Date(a.timestamp) - new Date(b.timestamp);
        case "accuracy":
          return (b.accuracy || 0) - (a.accuracy || 0);
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

  const toggleFavorite = (id) => {
    setHistory(history.map(item => 
      item.id === id ? { ...item, favorite: !item.favorite } : item
    ));
    
    // Update localStorage
    const item = history.find(item => item.id === id);
    if (item && item.service === 'speech-lab') {
      const key = `speechLab_${item.type}_history`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.map(storedItem =>
        storedItem.id === item.id ? { ...storedItem, favorite: !storedItem.favorite } : storedItem
      );
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === filteredHistory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredHistory.map(item => item.id));
    }
  };

  const deleteItems = (ids) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} item(s)?`)) return;

    try {
      // Delete from state
      setHistory(history.filter(item => !ids.includes(item.id)));
      
      // Delete from localStorage
      ids.forEach(id => {
        const item = history.find(item => item.id === id);
        if (item && item.service === 'speech-lab') {
          const key = `speechLab_${item.type}_history`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = existing.filter(storedItem => storedItem.id !== item.id);
          localStorage.setItem(key, JSON.stringify(updated));
        }
      });

      setSelectedItems([]);
      
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('Error deleting items. Please try again.');
    }
  };

  const downloadItem = (item) => {
    let content = '';
    let filename = '';

    switch (item.type) {
      case 'stt':
        content = `Speech-to-Text Result\n\nText: ${item.content}\nAccuracy: ${item.accuracy}%\nLanguage: ${item.language}\nDuration: ${item.duration}\nDate: ${new Date(item.timestamp).toLocaleString()}`;
        filename = `stt-result-${item.id}.txt`;
        break;
      case 'tts':
        content = `Text-to-Speech Result\n\nText: ${item.content}\nVoice Model: ${item.voiceModel}\nLanguage: ${item.language}\nDuration: ${item.duration}\nDate: ${new Date(item.timestamp).toLocaleString()}`;
        filename = `tts-result-${item.id}.txt`;
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const clearAllHistory = () => {
    if (!window.confirm("Are you sure you want to clear all history? This action cannot be undone.")) return;

    try {
      localStorage.removeItem('speechLab_stt_history');
      localStorage.removeItem('speechLab_tts_history');
      setHistory([]);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
              <span className="text-lg text-gray-600 dark:text-gray-400">Loading history...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Connection Status */}
        <div className="flex justify-center mb-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
            backendConnected 
              ? "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" 
              : "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}>
            {backendConnected ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {backendConnected ? 'AI Connected' : 'Offline Mode'}
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">📚 History</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your speech conversion history and saved items
            </p>
          </div>

          {/* Stats Overview */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{history.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {history.filter(item => item.favorite).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Favorites</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {history.filter(item => item.type === "stt").length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">STT Items</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 mb-6">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent"
                  }`}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  {tab.name}
                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <button
                onClick={fetchHistoryData}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Date Range</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                    >
                      {dateFilters.map(filter => (
                        <option key={filter.id} value={filter.id}>{filter.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="accuracy">Highest Accuracy</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selection Bar */}
          {selectedItems.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={selectAll}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    {selectedItems.length === filteredHistory.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteItems(selectedItems)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clear All Button */}
          {history.length > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={clearAllHistory}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
              >
                <Trash2 className="w-4 h-4" />
                Clear All History
              </button>
            </div>
          )}

          {/* History List */}
          <div>
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {searchQuery || dateFilter !== "all" ? "No matching items found" : "No history yet"}
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  {searchQuery || dateFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Your speech conversions will appear here"}
                </p>
                {(searchQuery || dateFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDateFilter("all");
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all ${
                      selectedItems.includes(item.id)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              item.type === "stt" 
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            }`}>
                              {item.type === "stt" ? <MessageSquare className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white mb-1">
                                {item.content}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatTimeAgo(item.timestamp)}
                                </span>
                                {item.duration && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {item.duration}
                                    </span>
                                  </>
                                )}
                                {item.accuracy && (
                                  <>
                                    <span>•</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      item.accuracy >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                      item.accuracy >= 80 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    }`}>
                                      {item.accuracy}% accuracy
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className={`p-2 rounded-lg transition ${
                                item.favorite
                                  ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500 dark:bg-gray-700 dark:hover:bg-yellow-900/20"
                              }`}
                            >
                              {item.favorite ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                            </button>
                            
                            <button
                              onClick={() => copyToClipboard(item.content)}
                              className="p-2 bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-blue-900/20 rounded-lg transition"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => downloadItem(item)}
                              className="p-2 bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-green-900/20 rounded-lg transition"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => deleteItems([item.id])}
                              className="p-2 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-red-900/20 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}