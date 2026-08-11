import React, { useState, useEffect, useRef, useContext } from 'react';
import { LanguageContext } from '../App.jsx';

const NameScreen = ({ onNext, onBack, name }) => {
  const { language, translations, changeLanguage } = useContext(LanguageContext);
  const [patientName, setPatientName] = useState(name || '');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
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
      speakText(translations.nameInstruction);
    }, 500);
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.lang = 'en-US'; 
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPatientName(transcript);
        setIsRecording(false);
        speakText(`${translations.nameHint}: ${transcript}`);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error !== 'not-allowed') {
          alert(translations.pleaseEnterName);
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      console.warn('Speech recognition not supported');
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  const handleNameChange = (e) => {
    setPatientName(e.target.value);
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

  const startVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = 'en-US';
        setIsRecording(true);
        recognitionRef.current.start();
        speakText(translations.nameInstruction);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsRecording(false);
        alert(translations.pleaseEnterName);
      }
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  // FIXED: Just save name to localStorage and navigate, don't call API
  const handleSubmit = () => {
    if (!patientName.trim()) {
      alert(translations.pleaseEnterName);
      return;
    }

    // Get existing patient data from localStorage
    const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
    
    // Update with name
    const updatedData = {
      ...patientData,
      name: patientName.trim()
    };
    
    // Save to localStorage
    localStorage.setItem('patientData', JSON.stringify(updatedData));
    
    // Log what's happening
    console.log('📝 Name saved to localStorage:', updatedData);
    
    // Navigate to next screen
    onNext({ name: patientName.trim() });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && patientName.trim()) {
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
        <h2>{translations.yourName}</h2>
        
        <div className="voice-instruction">
          <div className="instruction-icon">🔊</div>
          <div className="instruction-text">
            <p>"{translations.nameInstruction}"</p>
            <button 
              className="hear-again-btn"
              onClick={() => speakText(translations.nameInstruction)}
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
            className="name-input"
            placeholder={translations.enterName}
            value={patientName}
            onChange={handleNameChange}
            onKeyPress={handleKeyPress}
          />
          <div className="name-hint">
            {patientName && (
              <span className="entered-name">
                ✓ {patientName}
              </span>
            )}
          </div>
        </div>

        <div className="voice-actions">
          <button 
            className={`voice-btn ${isRecording ? 'recording' : ''}`}
            onClick={startVoiceRecognition}
            disabled={isRecording || isSpeaking}
          >
            {isRecording ? translations.listening : translations.speakName}
          </button>
        </div>

        <div className="navigation">
          <button 
            className="nav-btn back-btn"
            onClick={onBack}
          >
            {translations.back}
          </button>
          <button 
            className="nav-btn submit-btn"
            onClick={handleSubmit}
            disabled={!patientName.trim()}
          >
            {translations.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NameScreen;