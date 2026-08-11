import React, { useState, useEffect, useRef, useContext } from 'react'; // Added useRef
import { LanguageContext } from '../App.jsx';

const LanguageScreen = ({ onNext, onBack, selectedLanguage }) => {
  const { language, translations, changeLanguage } = useContext(LanguageContext);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechTimeoutRef = useRef(null);

  // Only Hindi and English
  const languages = [
    { code: 'EN', name: translations.english || 'English' },
    { code: 'HI', name: translations.hindi || 'Hindi' }
  ];

  // Language codes for speech synthesis
  const languageVoiceMap = {
    'EN': 'en-US',
    'HI': 'hi-IN'
  };

  useEffect(() => {
    // Clear any pending timeouts
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    
    // Cancel any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    speechTimeoutRef.current = setTimeout(() => {
      speakText(translations.chooseLanguageInstruction, language);
    }, 500);

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  const speakText = (text, langCode = language) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech FIRST
      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageVoiceMap[langCode] || 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => {
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech error:', event);
          setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
      }, 100);
    } else {
      alert('Text-to-speech is not supported in this browser.');
    }
  };

  const handleLanguageSelect = (code, name) => {
    // Cancel any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Change the language
    changeLanguage(code);
    
    // Speak the selected language name
    setTimeout(() => {
      speakText(`${translations.youSelected} ${name}.`, code);
    }, 300);
  };

  const handleNext = () => {
    if (language) {
      onNext({ language });
    } else {
      alert(translations.pleaseSelectLanguage);
    }
  };

  // Toggle language function
  const toggleLanguage = () => {
    // Cancel any ongoing speech immediately
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    const newLang = language === 'EN' ? 'HI' : 'EN';
    
    // Change language first
    changeLanguage(newLang);
    
    // Then speak in the new language after a short delay
    setTimeout(() => {
      speakText(`${translations.youSelected} ${langName}.`, newLang);
    }, 200);
  };

  return (
    <div className="screen">
      <div className="header">
        <span className="time">9:41</span>
        <span className="hospital-name">{translations.hospital}</span>
        <button className="lang-switch-btn" onClick={toggleLanguage}>
          {language === 'EN' ? 'हिंदी' : 'English'}
        </button>
      </div>

      <div className="content">
        <h2>{translations.chooseLanguage}</h2>
        
        <div className="voice-instruction">
          <div className="instruction-icon">🔊</div>
          <div className="instruction-text">
            <p>"{translations.chooseLanguageInstruction}"</p>
            <button 
              className="hear-again-btn"
              onClick={() => speakText(translations.chooseLanguageInstruction)}
              disabled={isSpeaking}
            >
              {isSpeaking ? `🔊 ${translations.speaking}` : `🔊 ${translations.hearAgain}`}
            </button>
          </div>
        </div>

        <div className="language-options">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-btn ${language === lang.code ? 'selected' : ''}`}
              onClick={() => handleLanguageSelect(lang.code, lang.name)}
            >
              <span className="lang-code">{lang.code}</span>
              <span className="lang-name">{lang.name}</span>
            </button>
          ))}
        </div>

        <div className="navigation">
          <button 
            className="nav-btn back-btn"
            onClick={onBack}
            style={{ visibility: 'hidden' }}
          >
            {translations.back}
          </button>
          <button 
            className="nav-btn next-btn"
            onClick={handleNext}
            disabled={!language}
          >
            {translations.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageScreen;