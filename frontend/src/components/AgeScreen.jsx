import React, { useState, useEffect, useRef, useContext } from 'react';
import { LanguageContext } from '../App.jsx';

const AgeScreen = ({ onNext, onBack, age }) => {
  const { language, translations, changeLanguage } = useContext(LanguageContext);
  const [patientAge, setPatientAge] = useState(age || '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  const languageVoiceMap = {
    'EN': 'en-US',
    'HI': 'hi-IN'
  };

  useEffect(() => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    speechTimeoutRef.current = setTimeout(() => {
      speakText(translations.ageInstruction);
    }, 500);

    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  const handleAgeChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPatientAge(value);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageVoiceMap[language] || 'en-US';
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
    }
  };

  const handleSubmit = () => {
    if (!patientAge.trim()) {
      alert(translations.pleaseEnterAge);
      return;
    }

    const ageNum = parseInt(patientAge);
    if (ageNum < 1 || ageNum > 120) {
      alert(translations.pleaseEnterValidAge);
      return;
    }

    setIsSubmitting(true);
    onNext({ age: patientAge });
    setIsSubmitting(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && patientAge.trim()) {
      handleSubmit();
    }
  };

  const toggleLanguage = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    const newLang = language === 'EN' ? 'HI' : 'EN';

    
    changeLanguage(newLang);
    
    setTimeout(() => {
      speakText(`${translations.youSelected} ${langName}.`);
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
        <h2>{translations.yourAge}</h2>
        
        <div className="voice-instruction">
          <div className="instruction-icon">🔊</div>
          <div className="instruction-text">
            <p>"{translations.ageInstruction}"</p>
            <button 
              className="hear-again-btn"
              onClick={() => speakText(translations.ageInstruction)}
              disabled={isSpeaking}
            >
              {isSpeaking ? `🔊 ${translations.speaking}` : `🔊 ${translations.hearAgain}`}
            </button>
          </div>
        </div>

        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            className="age-input"
            placeholder={translations.enterAge}
            value={patientAge}
            onChange={handleAgeChange}
            onKeyPress={handleKeyPress}
            maxLength={3}
          />
          <div className="age-hint">
            {patientAge && (
              <span className="entered-age">
                {language === 'EN' ? '✓ ' : '✓ '} {patientAge} {translations.years}
              </span>
            )}
          </div>
        </div>

        <div className="navigation">
          <button 
            className="nav-btn back-btn"
            onClick={onBack}
          >
            {translations.back}
          </button>
          <button 
            className="nav-btn next-btn"
            onClick={handleSubmit}
            disabled={!patientAge.trim() || isSubmitting}
          >
            {translations.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeScreen;