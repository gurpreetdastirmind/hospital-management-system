// frontend/src/components/PhoneScreen.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { LanguageContext } from '../App.jsx';
import api from '../api';

const PhoneScreen = ({ onNext, onBack, phoneNumber, onTokenFound }) => {
  const { language, translations, changeLanguage } = useContext(LanguageContext);
  const [phone, setPhone] = useState(phoneNumber || '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isGeneratingQuickToken, setIsGeneratingQuickToken] = useState(false);
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

  // Check if phone exists in database
  const checkExistingPatient = async (phoneNumber) => {
    setIsChecking(true);
    
    try {
      console.log(`🔍 Checking phone number: ${phoneNumber}`);
      
      const response = await api.get(`/api/patients/phone/${phoneNumber}`);
      
      if (response.data.success && response.data.data) {
        const patient = response.data.data;
        console.log('✅ Found existing patient:', patient);
        
        if (patient.token) {
          const tokensResponse = await api.get('/api/tokens');
          
          if (tokensResponse.data.success) {
            const foundToken = tokensResponse.data.data.find(t => t.token_number === patient.token);
            
            if (foundToken) {
              const isToday = new Date(foundToken.created_at).toDateString() === new Date().toDateString();
              const isActive = foundToken.status === 'waiting' || foundToken.status === 'called';
              
              if (isActive && isToday) {
                console.log('🎫 Active token found:', patient.token);
                
                let deptName = patient.department || patient.department_name || 'General';
                
                alert(`✅ Welcome back!\n\nYou already have an active token:\nToken: ${patient.token}\nDepartment: ${deptName}\nRoom: ${patient.room_number || 'N/A'}\nStatus: ${foundToken.status.toUpperCase()}\n\nWe'll take you to your token now.`);
                
                onTokenFound({
                  token: patient.token,
                  room: patient.room_number || Math.floor(Math.random() * 20) + 1,
                  departmentName: deptName,
                  isExistingPatient: true,
                  tokenStatus: foundToken.status,
                  positionInQueue: 0,
                  quickTokenGenerated: false
                });
                
                return true;
              } else {
                console.log('⏰ Token expired or completed:', foundToken.status);
                const wantsNew = window.confirm(
                  `You had a token (${patient.token}) but it's already ${foundToken.status}.\n\nWould you like to register for a new token?`
                );
                
                if (wantsNew) {
                  return false;
                } else {
                  return true;
                }
              }
            }
          }
        }
        
        const wantsRegister = window.confirm(
          `Welcome back ${patient.name || 'Patient'}!\n\nYour phone number is already registered.\nWould you like to register for a new token?`
        );
        
        if (wantsRegister) {
          return false;
        } else {
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('Error checking patient:', error);
      if (error.response?.status === 404) {
        console.log('📝 New patient - proceeding to registration');
        return false;
      }
      const continueAnyway = window.confirm(
        'Could not check existing records. Would you like to continue with registration?'
      );
      return !continueAnyway;
    } finally {
      setIsChecking(false);
    }
  };

  // Generate Quick Token for General Medicine
  const handleGenerateQuickToken = async () => {
    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    setIsGeneratingQuickToken(true);

    try {
      // Get patient data from localStorage
      const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
      
      // First check if patient exists and has a token
      let hasActiveToken = false;
      try {
        const checkResponse = await api.get(`/api/patients/phone/${phone}`);
        
        if (checkResponse.data.success && checkResponse.data.data) {
          const patient = checkResponse.data.data;
          if (patient.token) {
            const tokensResponse = await api.get('/api/tokens');
            if (tokensResponse.data.success) {
              const foundToken = tokensResponse.data.data.find(t => t.token_number === patient.token);
              if (foundToken) {
                const isToday = new Date(foundToken.created_at).toDateString() === new Date().toDateString();
                const isActive = foundToken.status === 'waiting' || foundToken.status === 'called';
                
                if (isActive && isToday) {
                  hasActiveToken = true;
                  alert(`✅ You already have an active token:\nToken: ${patient.token}\nDepartment: ${foundToken.department}\nStatus: ${foundToken.status.toUpperCase()}`);
                  
                  onTokenFound({
                    token: patient.token,
                    room: patient.room_number || Math.floor(Math.random() * 20) + 1,
                    departmentName: foundToken.department || 'General',
                    isExistingPatient: true,
                    tokenStatus: foundToken.status,
                    positionInQueue: 0,
                    quickTokenGenerated: true
                  });
                  setIsGeneratingQuickToken(false);
                  return;
                }
              }
            }
          }
        }
      } catch (checkError) {
        if (checkError.response?.status !== 404) {
          console.error('Error checking patient:', checkError);
        }
      }

      // If no active token, generate new one
      if (!hasActiveToken) {
        console.log('🔄 Generating quick token for General Medicine...');
        
        const patientName = patientData.name || 'Patient';
        const patientAge = patientData.age || null;
        
        // Step 1: Generate token
        const tokenResponse = await api.post('/api/tokens/generate', {
          name: patientName,
          phoneNumber: phone,
          age: patientAge,
          department: 'General Medicine',
          source: 'Counter'
        });

        if (tokenResponse.data.success) {
          const tokenData = tokenResponse.data.data;
          
          // Step 2: Save patient with the token
          const saveResponse = await api.post('/api/patients/save', {
            phoneNumber: phone,
            name: patientName,
            age: patientAge || null,
            department: 'General Medicine',
            departmentName: 'General Medicine',
            token: tokenData.token_number,
            roomNumber: tokenData.room_number,
            language: patientData.language || 'EN'
          });

          console.log('📝 Save response:', saveResponse.data);

          // IMPORTANT: Save to localStorage with ALL data
          localStorage.setItem('patientData', JSON.stringify({
            ...patientData,
            phoneNumber: phone,
            name: patientName,
            age: patientAge,
            department: 'General Medicine',
            departmentName: 'General Medicine',
            token: tokenData.token_number,
            room: tokenData.room_number,
            tokenStatus: tokenData.status,
            quickTokenGenerated: true
          }));

          alert(`✅ Quick Token Generated!\n\nToken: ${tokenData.token_number}\nDepartment: General Medicine\nRoom: ${tokenData.room_number}\nStatus: ${tokenData.status.toUpperCase()}`);
          
          // Navigate to token screen with flag
          onTokenFound({
            token: tokenData.token_number,
            room: tokenData.room_number || Math.floor(Math.random() * 20) + 1,
            departmentName: 'General Medicine',
            isExistingPatient: false,
            tokenStatus: tokenData.status,
            positionInQueue: 0,
            quickTokenGenerated: true
          });
        } else {
          alert('❌ Failed to generate token: ' + (tokenResponse.data.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('❌ Error generating quick token:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        alert(`Error generating quick token: ${error.response.data?.error || error.message}`);
      } else {
        alert('Error generating quick token. Please try again.\n\nError: ' + error.message);
      }
    } finally {
      setIsGeneratingQuickToken(false);
    }
  };

  const handleNext = async () => {
    if (phone.length !== 10) {
      alert(translations.pleaseEnterPhone);
      return;
    }

    const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
    localStorage.setItem('patientData', JSON.stringify({
      ...patientData,
      phoneNumber: phone
    }));

    const shouldStop = await checkExistingPatient(phone);
    
    if (!shouldStop) {
      onNext({ phoneNumber: phone });
    }
  };

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

        {/* Quick Token Button - Directly generate token for General Medicine */}
        <div className="quick-token-section">
          <button 
            className="quick-token-btn"
            onClick={handleGenerateQuickToken}
            disabled={phone.length !== 10 || isGeneratingQuickToken}
          >
            {isGeneratingQuickToken ? (
              '⏳ Generating...'
            ) : (
              '⚡ Quick Token - General Medicine'
            )}
          </button>
          <p className="quick-token-hint">Directly generate a token for General Medicine department</p>
        </div>

        {/* Check Token Button */}
        <div className="phone-actions">
          <button 
            className="check-token-btn"
            onClick={handleCheckToken}
            disabled={phone.length !== 10 || isChecking}
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