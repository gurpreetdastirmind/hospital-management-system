// frontend/src/components/DepartmentScreen.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { LanguageContext } from '../App.jsx';
import boneImg from '../image/bones.png';
import dentalImg from '../image/teeth1.png';
import childImg from '../image/child.png';
import eyeImg from '../image/eye1.png';
import generalImg from '../image/general.png';
import womenImg from '../image/women.png';
import api from '../api';

const DepartmentScreen = ({ onNext, onBack, department }) => {
  const { language, translations, changeLanguage } = useContext(LanguageContext);
  const [selectedDepartment, setSelectedDepartment] = useState(department || null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const speechTimeoutRef = useRef(null);

  const languageVoiceMap = {
    'EN': 'en-US',
    'HI': 'hi-IN'
  };

  // English name mapping for backend storage
  const departmentEnglishMap = {
    'general': 'General',
    'dental': 'Dental',
    'eye': 'Eye',
    'bones': 'Bones',
    'child': 'Child',
    'women': 'Women'
  };

  // Hindi name mapping for display and speech
  const departmentHindiMap = {
    'general': 'सामान्य',
    'dental': 'दंत',
    'eye': 'नेत्र',
    'bones': 'हड्डी',
    'child': 'बाल',
    'women': 'महिला'
  };

  const departments = [
    { 
      id: 'general', 
      englishName: 'General',
      hindiName: 'सामान्य',
      imageSrc: generalImg,
      fallbackText: '🏥',
      color: '#4CAF50',
      bgColor: '#E8F5E9'
    },
    { 
      id: 'dental', 
      englishName: 'Dental',
      hindiName: 'दंत',
      imageSrc: dentalImg,
      fallbackText: '🦷',
      color: '#2196F3',
      bgColor: '#E3F2FD'
    },
    { 
      id: 'eye', 
      englishName: 'Eye',
      hindiName: 'नेत्र',
      imageSrc: eyeImg,
      fallbackText: '👁️',
      color: '#FF9800',
      bgColor: '#FFF3E0'
    },
    { 
      id: 'bones', 
      englishName: 'Bones',
      hindiName: 'हड्डी',
      imageSrc: boneImg,
      fallbackText: '🦴',
      color: '#9C27B0',
      bgColor: '#F3E5F5'
    },
    { 
      id: 'child', 
      englishName: 'Child',
      hindiName: 'बाल',
      imageSrc: childImg,
      fallbackText: '👶',
      color: '#E91E63',
      bgColor: '#FCE4EC'
    },
    { 
      id: 'women', 
      englishName: 'Women',
      hindiName: 'महिला',
      imageSrc: womenImg,
      fallbackText: '👩‍⚕️',
      color: '#F44336',
      bgColor: '#FFEBEE'
    }
  ];

  // Get display name based on language
  const getDisplayName = (dept) => {
    if (language === 'HI') {
      return dept.hindiName || dept.englishName;
    }
    return dept.englishName;
  };

  // Get the name to speak based on language
  const getSpeakName = (dept) => {
    if (language === 'HI') {
      return dept.hindiName || dept.englishName;
    }
    return dept.englishName;
  };

  useEffect(() => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    speechTimeoutRef.current = setTimeout(() => {
      speakText(translations.departmentInstruction);
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

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        // Use the appropriate language for speech
        utterance.lang = languageVoiceMap[language] || 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  };

  // Speak department name in the selected language
  const speakDepartmentName = (dept) => {
    const speakName = getSpeakName(dept);
    const message = `${translations.youSelected} ${speakName}.`;
    speakText(message);
  };

  // Check if patient already has a token in this department
  const checkExistingTokenForDepartment = async (dept) => {
    setIsChecking(true);
    
    try {
      const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
      const phoneNumber = patientData.phoneNumber;
      
      if (!phoneNumber) {
        return true;
      }
      
      const response = await api.get(`/api/patients/phone/${phoneNumber}`);
      
      if (response.data.success && response.data.data) {
        const patient = response.data.data;
        
        if (patient.token) {
          const tokensResponse = await api.get('/api/tokens');
          
          if (tokensResponse.data.success) {
            const foundToken = tokensResponse.data.data.find(t => t.token_number === patient.token);
            
            if (foundToken) {
              const isToday = new Date(foundToken.created_at).toDateString() === new Date().toDateString();
              const isActive = foundToken.status === 'waiting' || foundToken.status === 'called';
              
              if (isActive && isToday) {
                const existingDept = foundToken.department || patient.department_name || patient.department || 'General';
                
                if (existingDept === dept.englishName) {
                  const alertMessage = language === 'HI' 
                    ? `⚠️ आपके पास पहले से ही ${existingDept} विभाग के लिए एक सक्रिय टोकन (${patient.token}) है।\n\nकृपया अपना टोकन देखें।`
                    : `⚠️ You already have an active token (${patient.token}) for ${existingDept} department.\n\nPlease check your token.`;
                  
                  alert(alertMessage);
                  
                  onNext({ 
                    department: dept.id,
                    departmentName: dept.englishName,
                    token: patient.token,
                    room: patient.room_number,
                    isExistingPatient: true
                  });
                  return false;
                } else {
                  const confirmMessage = language === 'HI'
                    ? `आपके पास पहले से ही ${existingDept} विभाग के लिए एक सक्रिय टोकन (${patient.token}) है।\n\nक्या आप ${dept.englishName} विभाग के लिए पंजीकरण करना चाहते हैं?`
                    : `You already have an active token (${patient.token}) for ${existingDept} department.\n\nDo you want to register for ${dept.englishName} department instead?`;
                  
                  const confirmSwitch = window.confirm(confirmMessage);
                  
                  if (!confirmSwitch) {
                    onNext({ 
                      department: patient.department || existingDept,
                      departmentName: existingDept,
                      token: patient.token,
                      room: patient.room_number,
                      isExistingPatient: true
                    });
                    return false;
                  }
                  return true;
                }
              }
            }
          }
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('Error checking existing token:', error);
      return true;
    } finally {
      setIsChecking(false);
    }
  };

  const handleDepartmentSelect = (dept) => {
    setSelectedDepartment(dept);
    
    const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
    localStorage.setItem('patientData', JSON.stringify({
      ...patientData,
      department: dept.id,
      departmentName: dept.englishName
    }));
    
    // Speak the department name in the selected language
    speakDepartmentName(dept);
  };

  const handleNotSure = () => {
    setSelectedDepartment(null);
    const message = language === 'HI' 
      ? 'कृपया सहायता के लिए हेल्प डेस्क पर जाएं।'
      : 'Please visit the help desk for assistance.';
    speakText(message);
  };

  const handleSubmit = async () => {
    if (!selectedDepartment) {
      const message = language === 'HI'
        ? 'कृपया एक विभाग चुनें'
        : 'Please select a department';
      alert(message);
      return;
    }

    const canProceed = await checkExistingTokenForDepartment(selectedDepartment);
    
    if (canProceed) {
      const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
      localStorage.setItem('patientData', JSON.stringify({
        ...patientData,
        department: selectedDepartment.id,
        departmentName: selectedDepartment.englishName
      }));

      onNext({ 
        department: selectedDepartment.id,
        departmentName: selectedDepartment.englishName
      });
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

  const handleImageError = (deptId) => {
    setImageErrors(prev => ({ ...prev, [deptId]: true }));
  };

  // Get the instruction text in the current language
  const getInstructionText = () => {
    if (language === 'HI') {
      return '"आप किस विभाग में जाना चाहते हैं? चित्र पर टैप करें।"';
    }
    return `"${translations.departmentInstruction}"`;
  };

  // Get the "Hear Again" button text
  const getHearAgainText = () => {
    if (language === 'HI') {
      return 'फिर से सुनें';
    }
    return translations.hearAgain;
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
        <h2>{translations.chooseDepartment}</h2>
        
        <div className="voice-instruction">
          <div className="instruction-icon">🔊</div>
          <div className="instruction-text">
            <p>"{translations.departmentInstruction}"</p>
            <button 
              className="hear-again-btn"
              onClick={() => speakText(translations.departmentInstruction)}
              disabled={isSpeaking}
            >
              {isSpeaking ? `🔊 ${translations.speaking}` : `🔊 ${getHearAgainText()}`}
            </button>
          </div>
        </div>

        <div className="department-grid">
          {departments.map((dept) => {
            const isSelected = selectedDepartment?.id === dept.id;
            const hasError = imageErrors[dept.id];
            const displayName = getDisplayName(dept);
            
            return (
              <button
                key={dept.id}
                className={`department-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDepartmentSelect(dept)}
                style={{ 
                  borderColor: isSelected ? dept.color : '#e8e8e8',
                  backgroundColor: isSelected ? dept.bgColor : 'white'
                }}
                disabled={isChecking}
              >
                <div 
                  className="dept-icon" 
                  style={{ 
                    backgroundColor: dept.color 
                  }}
                >
                  {hasError ? (
                    <span style={{ fontSize: '36px' }}>{dept.fallbackText}</span>
                  ) : (
                    <img 
                      src={dept.imageSrc} 
                      alt={dept.englishName}
                      className="dept-img"
                      onError={() => handleImageError(dept.id)}
                      loading="lazy"
                    />
                  )}
                </div>
                <span className="dept-name">{displayName}</span>
              </button>
            );
          })}
        </div>

        <div className="navigation">
          <button 
            className="nav-btn back-btn"
            onClick={onBack}
            disabled={isChecking}
          >
            {translations.back}
          </button>
          <button 
            className="nav-btn not-sure-btn"
            onClick={handleNotSure}
            disabled={isChecking}
          >
            {translations.notSure}
          </button>
          <button 
            className="nav-btn next-btn"
            onClick={handleSubmit}
            disabled={!selectedDepartment || isChecking}
          >
            {isChecking ? '⏳ Checking...' : translations.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentScreen;