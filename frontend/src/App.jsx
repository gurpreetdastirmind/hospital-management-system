import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LanguageScreen from './components/LanguageScreen.jsx';
import PhoneScreen from './components/PhoneScreen.jsx';
import NameScreen from './components/NameScreen.jsx';
import AgeScreen from './components/AgeScreen.jsx';
import DepartmentScreen from './components/DepartmentScreen.jsx';
import TokenScreen from './components/TokenScreen.jsx';
import StaffLogin from './components/Staff/StaffLogin.jsx';
import StaffApp from './components/Staff/StaffApp.jsx';
import './styles/App.css';

// Create Language Context
export const LanguageContext = createContext();

// Patient App Component
const PatientApp = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [patientData, setPatientData] = useState({
    language: 'EN',
    phoneNumber: '',
    name: '',
    age: '',
    department: '',
    departmentName: '',
    token: '',
    room: '',
    isExistingPatient: false,
    tokenStatus: 'waiting',
    positionInQueue: 0,
    estimatedTime: 0
  });

  const { language, translations, changeLanguage } = React.useContext(LanguageContext);

  const handleNext = (data) => {
    const updatedData = { ...patientData, ...data };
    setPatientData(updatedData);
    localStorage.setItem('patientData', JSON.stringify(updatedData));
    
    if (currentScreen < 5) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handleBack = () => {
    // If existing patient, go back to phone screen instead of department
    if (patientData.isExistingPatient && currentScreen === 5) {
      setCurrentScreen(1);
      return;
    }
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleTokenFound = (tokenData) => {
    const updatedData = { 
      ...patientData, 
      ...tokenData,
      isExistingPatient: true
    };
    setPatientData(updatedData);
    localStorage.setItem('patientData', JSON.stringify(updatedData));
    
    // Directly go to TokenScreen (index 5)
    setCurrentScreen(5);
  };

  const handleComplete = async (data) => {
    const finalData = { ...patientData, ...data };
    setPatientData(finalData);
    localStorage.setItem('patientData', JSON.stringify(finalData));
    console.log('Final patient data:', finalData);
    alert('Registration Complete!');
  };

  return (
    <div className="app">
      <div className="screen-container">
        {currentScreen === 0 && (
          <LanguageScreen 
            onNext={handleNext}
            onBack={handleBack}
            selectedLanguage={patientData.language}
          />
        )}
        {currentScreen === 1 && (
          <PhoneScreen 
            onNext={handleNext}
            onBack={handleBack}
            phoneNumber={patientData.phoneNumber}
            onTokenFound={handleTokenFound}
          />
        )}
        {currentScreen === 2 && (
          <NameScreen 
            onNext={handleNext}
            onBack={handleBack}
            name={patientData.name}
          />
        )}
        {currentScreen === 3 && (
          <AgeScreen 
            onNext={handleNext}
            onBack={handleBack}
            age={patientData.age}
          />
        )}
        {currentScreen === 4 && (
          <DepartmentScreen 
            onNext={handleNext}
            onBack={handleBack}
            department={patientData.departmentName}
          />
        )}
        {currentScreen === 5 && (
          <TokenScreen 
            onNext={handleComplete}
            onBack={handleBack}
            tokenData={{
              token: patientData.token,
              room: patientData.room,
              departmentName: patientData.departmentName,
              tokenStatus: patientData.tokenStatus,
              positionInQueue: patientData.positionInQueue,
              estimatedTime: patientData.estimatedTime,
              isExistingPatient: patientData.isExistingPatient
            }}
            department={patientData.departmentName}
          />
        )}
      </div>
      
      <div className="progress-indicator">
        <span className={`dot ${currentScreen === 0 ? 'active' : ''}`}></span>
        <span className={`dot ${currentScreen === 1 ? 'active' : ''}`}></span>
        <span className={`dot ${currentScreen === 2 ? 'active' : ''}`}></span>
        <span className={`dot ${currentScreen === 3 ? 'active' : ''}`}></span>
        <span className={`dot ${currentScreen === 4 ? 'active' : ''}`}></span>
        <span className={`dot ${currentScreen === 5 ? 'active' : ''}`}></span>
      </div>
    </div>
  );
};

// Main App with Router
function App() {
  const [language, setLanguage] = useState('EN');
  
  const translations = {
    EN: {
      hospital: 'CIVIL HOSPITAL',
      chooseLanguage: 'Choose Language',
      chooseLanguageInstruction: 'Choose your language.',
      phoneNumber: 'Phone Number',
      phoneInstruction: 'Enter your phone number.',
      yourName: 'Your Name',
      nameInstruction: 'Enter your name.',
      yourAge: 'Your Age',
      ageInstruction: 'Enter your age.',
      chooseDepartment: 'Choose Department',
      departmentInstruction: 'Which department do you want? Tap the picture.',
      yourToken: 'Your Token',
      tokenInstruction: 'Your token is ready. Please wait.',
      hearAgain: 'Hear Again',
      speaking: 'Speaking...',
      next: 'Next →',
      back: '← Back',
      submit: '✓ Submit',
      submitting: '⏳ Submitting...',
      speakName: '🎤 Speak Name',
      listening: '🎙️ Listening...',
      enterPhone: 'Enter 10-digit number',
      enterName: 'Enter your name',
      enterAge: 'Enter your age',
      pleaseSelectLanguage: 'Please select a language',
      pleaseEnterPhone: 'Please enter a valid 10-digit phone number',
      pleaseEnterName: 'Please enter or speak your name',
      pleaseEnterAge: 'Please enter your age',
      pleaseEnterValidAge: 'Please enter a valid age (1-120)',
      pleaseSelectDepartment: 'Please select a department',
      registrationComplete: 'Registration complete. Thank you.',
      errorSaving: 'Error saving data. Please check if the backend server is running.',
      youSelected: 'You selected',
      hindi: 'Hindi',
      english: 'English',
      nameHint: 'Entered name',
      years: 'years',
      general: 'General',
      dental: 'Dental',
      eye: 'Eye',
      bones: 'Bones',
      child: 'Child',
      women: 'Women',
      notSure: '? Not Sure',
      notSureMessage: 'Please visit the help desk for assistance.',
      yourTokenIs: 'Your token is',
      goToRoom: 'Go to Room',
      andWait: 'and wait',
      room: 'Room',
      roomTokenAgain: 'Room Token Again',
      changeDepartment: 'Change Department',
      complete: '✓ Complete',
      switchToHindi: 'Switch to Hindi',
      switchToEnglish: 'Switch to English',
      youAreNext: 'You are next in line',
      estimatedWait: 'Estimated wait time is',
      youArePosition: 'You are position',
      hours: 'hours',
      minutes: 'minutes',
      pleaseGoToDoctor: 'Please go to the doctor in',
      welcomeBack: 'Welcome back',
      yourTokenExpired: 'Your token has expired',
      pleaseRegisterAgain: 'Please register again',
    },
    HI: {
      hospital: 'सिविल अस्पताल',
      chooseLanguage: 'भाषा चुनें',
      chooseLanguageInstruction: 'अपनी भाषा चुनें।',
      phoneNumber: 'फोन नंबर',
      phoneInstruction: 'अपना फोन नंबर दर्ज करें।',
      yourName: 'आपका नाम',
      nameInstruction: 'अपना नाम दर्ज करें।',
      yourAge: 'आपकी उम्र',
      ageInstruction: 'अपनी उम्र दर्ज करें।',
      chooseDepartment: 'विभाग चुनें',
      departmentInstruction: 'आप किस विभाग में जाना चाहते हैं? चित्र पर टैप करें।',
      yourToken: 'आपका टोकन',
      tokenInstruction: 'आपका टोकन तैयार है। कृपया प्रतीक्षा करें।',
      hearAgain: 'फिर से सुनें',
      speaking: 'बोल रहा है...',
      next: 'आगे →',
      back: '← पीछे',
      submit: '✓ जमा करें',
      submitting: '⏳ जमा हो रहा है...',
      speakName: '🎤 नाम बोलें',
      listening: '🎙️ सुन रहा है...',
      enterPhone: '10 अंकों का नंबर दर्ज करें',
      enterName: 'अपना नाम दर्ज करें',
      enterAge: 'अपनी उम्र दर्ज करें',
      pleaseSelectLanguage: 'कृपया एक भाषा चुनें',
      pleaseEnterPhone: 'कृपया एक मान्य 10 अंकों का फोन नंबर दर्ज करें',
      pleaseEnterName: 'कृपया अपना नाम दर्ज करें या बोलें',
      pleaseEnterAge: 'कृपया अपनी उम्र दर्ज करें',
      pleaseEnterValidAge: 'कृपया मान्य उम्र दर्ज करें (1-120)',
      pleaseSelectDepartment: 'कृपया एक विभाग चुनें',
      registrationComplete: 'पंजीकरण पूरा हुआ। धन्यवाद।',
      errorSaving: 'डेटा सहेजने में त्रुटि। कृपया जांचें कि बैकेंड सर्वर चल रहा है।',
      youSelected: 'आपने चुना',
      hindi: 'हिंदी',
      english: 'अंग्रेज़ी',
      nameHint: 'दर्ज किया गया नाम',
      years: 'साल',
      general: 'सामान्य',
      dental: 'दंत',
      eye: 'नेत्र',
      bones: 'हड्डी',
      child: 'बाल',
      women: 'महिला',
      notSure: '? पता नहीं',
      notSureMessage: 'कृपया सहायता के लिए हेल्प डेस्क पर जाएं।',
      yourTokenIs: 'आपका टोकन है',
      goToRoom: 'कमरा नंबर पर जाएं',
      andWait: 'और प्रतीक्षा करें',
      room: 'कमरा',
      roomTokenAgain: 'टोकन फिर से सुनें',
      changeDepartment: 'विभाग बदलें',
      complete: '✓ पूरा हुआ',
      switchToHindi: 'हिंदी में बदलें',
      switchToEnglish: 'अंग्रेज़ी में बदलें',
      youAreNext: 'आप अगले हैं',
      estimatedWait: 'अनुमानित प्रतीक्षा समय है',
      youArePosition: 'आपकी स्थिति है',
      hours: 'घंटे',
      minutes: 'मिनट',
      pleaseGoToDoctor: 'कृपया डॉक्टर के पास जाएं',
      welcomeBack: 'वापसी पर स्वागत है',
      yourTokenExpired: 'आपका टोकन समाप्त हो गया है',
      pleaseRegisterAgain: 'कृपया फिर से पंजीकरण करें',
    }
  };

  const changeLanguage = (langCode) => {
    setLanguage(langCode);
  };

  return (
    <LanguageContext.Provider value={{
      language: language,
      translations: translations[language] || translations.EN,
      changeLanguage
    }}>
      <Router>
        <Routes>
          <Route path="/" element={<PatientApp />} />
          <Route path="/staff" element={<StaffLogin />} />
          <Route path="/staff/dashboard" element={<StaffApp />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </LanguageContext.Provider>
  );
}

export default App;