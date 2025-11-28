// src/components/Layout/Header.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Mic, User, Settings, History, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { 
      name: "Speech Lab", 
      href: "/speech-lab", 
      icon: Mic, 
      emoji: "🧠",
      description: "Speech to Text & Text to Speech"
    },
    { 
      name: "Voice Personalizer", 
      href: "/voice-personalizer", 
      icon: User, 
      emoji: "🎙️",
      description: "Custom voice profiles"
    },
    { 
      name: "History", 
      href: "/history", 
      icon: History, 
      emoji: "📚",
      description: "Your conversion history"
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings, 
      emoji: "⚙️",
      description: "App configuration"
    },
  ];

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('sautiai-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Scroll detection for glass effect enhancement
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setHasScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sautiai-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sautiai-theme', 'light');
    }
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    closeMobileMenu();
  };

  const handleNavigationClick = (href) => {
    navigate(href);
    closeMobileMenu();
  };

  return (
    <>
      {/* Main Header with Glass Effect */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        hasScrolled 
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl shadow-black/10' 
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-black/5'
      } border-b border-white/20 dark:border-gray-800/50`}>
        
        {/* Reflective Bottom Edge */}
        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-b from-white/40 to-transparent dark:from-gray-900/40 transition-opacity duration-500 ${
          hasScrolled ? 'opacity-100' : 'opacity-70'
        }`} />
        
        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Link
                to="/speech-lab"
                className="flex items-center gap-3 group"
                onClick={closeMobileMenu}
              >
                <div className="relative">
                  {/* Logo from assets */}
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img 
                      src="/src/assets/logo.png"
                      alt="SautiAI Logo"
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        // Fallback if logo doesn't exist
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback logo */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 hidden">
                      <span className="text-white font-bold text-lg">s</span>
                    </div>
                  </div>
                  {/* Logo glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    SautiAI
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    AI Speech Platform
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all group relative ${
                      isActive
                        ? "bg-white/20 dark:bg-white/10 text-gray-900 dark:text-white backdrop-blur-sm border border-white/30 dark:border-white/20 shadow-lg shadow-black/10"
                        : "text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white backdrop-blur-sm border border-transparent hover:border-white/20"
                    }`}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span className="font-semibold">{item.name}</span>
                    
                    {/* Glass tooltip on hover */}
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl text-gray-900 dark:text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 border border-white/20 shadow-2xl">
                      {item.description}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rotate-45 border-l border-t border-white/20"></div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Navigation - Compact */}
            <nav className="hidden md:flex lg:hidden items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all group relative ${
                      isActive
                        ? "bg-white/20 dark:bg-white/10 text-gray-900 dark:text-white backdrop-blur-sm border border-white/30 dark:border-white/20 shadow-lg"
                        : "text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white backdrop-blur-sm"
                    }`}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span className="font-semibold text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle Button - Desktop */}
              <button
                onClick={toggleTheme}
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-white/30 dark:hover:bg-white/20 transition-all border border-white/30 dark:border-white/20 backdrop-blur-sm shadow-lg shadow-black/5 hover:shadow-black/10"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* User Profile - Placeholder */}
              <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-white/30 dark:hover:bg-white/20 transition-all border border-white/30 dark:border-white/20 backdrop-blur-sm shadow-lg shadow-black/5 hover:shadow-black/10">
                <User className="w-5 h-5" />
                <span className="font-medium text-sm">Account</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl bg-white/20 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-white/30 dark:hover:bg-white/20 transition-all border border-white/30 dark:border-white/20 backdrop-blur-sm shadow-lg shadow-black/5"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation with Glass Effect */}
      {isMenuOpen && (
        <div className="fixed top-16 inset-x-0 z-50 md:hidden">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-b border-white/20 dark:border-gray-800/50 shadow-2xl shadow-black/20">
            {/* Reflective Bottom Edge for Mobile Menu */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-b from-white/40 to-transparent dark:from-gray-900/40" />
            
            <div className="px-2 pt-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigationClick(item.href)}
                    className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl font-medium transition-all backdrop-blur-sm border text-left ${
                      isActive
                        ? "bg-white/20 dark:bg-white/10 text-gray-900 dark:text-white border-white/30 dark:border-white/20 shadow-lg"
                        : "text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 border-transparent"
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-base font-semibold">{item.name}</span>
                      <span className="text-xs opacity-75">{item.description}</span>
                    </div>
                  </button>
                );
              })}
              
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 transition-all backdrop-blur-sm border border-transparent"
              >
                <span className="text-xl">
                  {isDarkMode ? "☀️" : "🌙"}
                </span>
                <div className="flex flex-col">
                  <span className="text-base font-semibold">
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                  </span>
                  <span className="text-xs opacity-75">
                    Switch theme
                  </span>
                </div>
              </button>

              {/* Mobile Account Button */}
              <button className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 transition-all backdrop-blur-sm border border-transparent">
                <span className="text-xl">👤</span>
                <div className="flex flex-col">
                  <span className="text-base font-semibold">Account</span>
                  <span className="text-xs opacity-75">Manage profile</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMobileMenu}
          />
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind fixed header */}
      <div className="h-16" />
    </>
  );
}