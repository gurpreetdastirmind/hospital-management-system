import React, { useState, useEffect, useRef, useContext } from 'react'; // Added useRef
import { LanguageContext } from '../App.jsx';

const PhoneScreen = ({ onNext, onBack, phoneNumber }) => {
  const { language, translations, changeLanguage } = useContext(LanguageContext);
  const [phone, setPhone] = useState(phoneNumber || '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const inputRef = useRef(null);
  const speechTimeoutRef = useRef(null);

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
      speakText(translations.phoneInstruction);
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

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech FIRST
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

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  const handleNext = () => {
    if (phone.length === 10) {
      onNext({ phoneNumber: phone });
    } else {
      alert(translations.pleaseEnterPhone);
    }
  };

  const formatPhoneNumber = (value) => {
    if (value.length === 10) {
      return value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return value;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && phone.length === 10) {
      handleNext();
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
        <h2>{translations.phoneNumber}</h2>
        
        <div className="voice-instruction">
          <div className="instruction-icon">🔊</div>
          <div className="instruction-text">
            <p>"{translations.phoneInstruction}"</p>
            <button 
              className="hear-again-btn"
              onClick={() => speakText(translations.phoneInstruction)}
              disabled={isSpeaking}
            >
              {isSpeaking ? `🔊 ${translations.speaking}` : `🔊 ${translations.hearAgain}`}
            </button>
          </div>
        </div>

        <div className="input-container">
          <input
            ref={inputRef}
            type="tel"
            className="phone-input"
            placeholder={translations.enterPhone}
            value={phone}
            onChange={handlePhoneChange}
            onKeyPress={handleKeyPress}
            maxLength="10"
            pattern="\d{10}"
            autoFocus
          />
          <div className="phone-display">
            {phone && <span className="formatted-number">{formatPhoneNumber(phone)}</span>}
            <span className="digit-count">{phone.length}/10</span>
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
            onClick={handleNext}
            disabled={phone.length !== 10}
          >
            {translations.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneScreen;