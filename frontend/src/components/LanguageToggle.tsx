import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '', showIcon = false }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full border border-purple-300 shadow-2xs transition-all ${className}`}
      style={{ backgroundColor: '#E9D5FF' }}
      role="group"
      aria-label="Language Selector"
    >
      {showIcon && (
        <Globe className="w-3.5 h-3.5 ml-1.5 mr-1 text-[#581C87] shrink-0" />
      )}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-full text-xs font-black transition-all duration-200 cursor-pointer select-none ${
          language === 'en'
            ? 'text-white shadow-xs scale-100'
            : 'text-[#581C87] hover:text-purple-900 opacity-80 hover:opacity-100'
        }`}
        style={{
          backgroundColor: language === 'en' ? '#A855F7' : 'transparent',
        }}
        title="Switch to English"
        aria-pressed={language === 'en'}
      >
        English
      </button>
      <span className="text-purple-400 font-bold text-xs select-none px-0.5">|</span>
      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`px-3 py-1 rounded-full text-xs font-black transition-all duration-200 cursor-pointer select-none ${
          language === 'ta'
            ? 'text-white shadow-xs scale-100'
            : 'text-[#581C87] hover:text-purple-900 opacity-80 hover:opacity-100'
        }`}
        style={{
          backgroundColor: language === 'ta' ? '#A855F7' : 'transparent',
        }}
        title="தமிழுக்கு மாற்றவும் (Switch to Tamil)"
        aria-pressed={language === 'ta'}
      >
        தமிழ்
      </button>
    </div>
  );
};
