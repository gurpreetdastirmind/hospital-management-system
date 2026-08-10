import React, { useState, useEffect, useRef, useContext } from 'react';
import { LanguageContext } from '../App.jsx';
import api from '../api'; // Make sure to import api

const PhoneScreen = ({ onNext, onBack, phoneNumber, onTokenFound }) => {
  const { language, translations, changeLanguage } = useContext(LanguageContext);
  const [phone, setPhone] = useState(phoneNumber || '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
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

  // NEW: Check if phone exists in database
  const checkExistingPatient = async (phoneNumber) => {
    setIsChecking(true);
    
    try {
      console.log(`🔍 Checking phone number: ${phoneNumber}`);
      
      const response = await api.get(`/api/patients/phone/${phoneNumber}`);
      
      if (response.data.success && response.data.data) {
        const patient = response.data.data;
        console.log('✅ Found existing patient:', patient);
        
        // Check if patient has an active token
        if (patient.token) {
          // Check if token is still active (waiting or called)
          const tokensResponse = await api.get('/api/tokens');
          
          if (tokensResponse.data.success) {
            const foundToken = tokensResponse.data.data.find(t => t.token_number === patient.token);
            
            if (foundToken) {
              const isToday = new Date(foundToken.created_at).toDateString() === new Date().toDateString();
              const isActive = foundToken.status === 'waiting' || foundToken.status === 'called';
              
              if (isActive && isToday) {
                // Token is active - show token screen
                console.log('🎫 Active token found:', patient.token);
                
                // Get department name
                let deptName = patient.department || patient.department_name || 'General';
                
                // Show alert with token info
                alert(`✅ Welcome back!\n\nYou already have an active token:\nToken: ${patient.token}\nDepartment: ${deptName}\nRoom: ${patient.room_number || 'N/A'}\nStatus: ${foundToken.status.toUpperCase()}\n\nWe'll take you to your token now.`);
                
                // Navigate directly to token screen with existing data
                onTokenFound({
                  token: patient.token,
                  room: patient.room_number || Math.floor(Math.random() * 20) + 1,
                  departmentName: deptName,
                  isExistingPatient: true,
                  tokenStatus: foundToken.status,
                  positionInQueue: 0 // Will be calculated in TokenScreen
                });
                
                return true; // Found active token
              } else {
                console.log('⏰ Token expired or completed:', foundToken.status);
                // Token exists but is expired/completed - ask user what to do
                const wantsNew = window.confirm(
                  `You had a token (${patient.token}) but it's already ${foundToken.status}.\n\nWould you like to register for a new token?`
                );
                
                if (wantsNew) {
                  // User wants new token - proceed to next screen
                  return false;
                } else {
                  // User doesn't want new token - go back
                  return true; // Stop further processing
                }
              }
            }
          }
        }
        
        // No active token found - ask if they want to register
        const wantsRegister = window.confirm(
          `Welcome back ${patient.name || 'Patient'}!\n\nYour phone number is already registered.\nWould you like to register for a new token?`
        );
        
        if (wantsRegister) {
          // User wants to register new token
          return false; // Proceed to next screen
        } else {
          // User doesn't want to register
          return true; // Stop
        }
      }
      
      // No patient found - continue to registration
      return false;
      
    } catch (error) {
      console.error('Error checking patient:', error);
      // If patient not found (404), continue to registration
      if (error.response?.status === 404) {
        console.log('📝 New patient - proceeding to registration');
        return false;
      }
      // For other errors, ask user if they want to continue
      const continueAnyway = window.confirm(
        'Could not check existing records. Would you like to continue with registration?'
      );
      return !continueAnyway;
    } finally {
      setIsChecking(false);
    }
  };

  const handleNext = async () => {
    if (phone.length !== 10) {
      alert(translations.pleaseEnterPhone);
      return;
    }

    // Save phone to localStorage first
    const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
    localStorage.setItem('patientData', JSON.stringify({
      ...patientData,
      phoneNumber: phone
    }));

    // Check if patient already exists
    const shouldStop = await checkExistingPatient(phone);
    
    if (!shouldStop) {
      // No active token found - proceed to next screen (Name)
      onNext({ phoneNumber: phone });
    }
    // If shouldStop is true, we either showed token or user cancelled
  };

  // NEW: Handle "Check Token" button click
  const handleCheckToken = async () => {
    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    
    await checkExistingPatient(phone);
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

  const toggleLanguage = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    const newLang = language === 'EN' ? 'HI' : 'EN';
    const langName = newLang === 'EN' ? translations.english : translations.hindi;
    
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

        {/* NEW: Check Token Button */}
        <div className="phone-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
          <button 
            className="check-token-btn"
            onClick={handleCheckToken}
            disabled={phone.length !== 10 || isChecking}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: phone.length === 10 ? 'pointer' : 'not-allowed',
              opacity: phone.length === 10 ? 1 : 0.5
            }}
          >
            {isChecking ? '⏳ Checking...' : '🔍 Check Existing Token'}
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
            className="nav-btn next-btn"
            onClick={handleNext}
            disabled={phone.length !== 10 || isChecking}
          >
            {isChecking ? '⏳ Checking...' : translations.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneScreen;