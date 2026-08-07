import React, { useState, useEffect, useRef, useContext } from 'react';
import { LanguageContext } from '../App.jsx';
import api from '../../api';
const TokenScreen = ({ onNext, onBack, tokenData, department }) => {
    const { language, translations, changeLanguage } = useContext(LanguageContext);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const speechTimeoutRef = useRef(null);
    const [hasCompleted, setHasCompleted] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [waitingCount, setWaitingCount] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState(0);
    const [positionInQueue, setPositionInQueue] = useState(0);
    const [tokenStatus, setTokenStatus] = useState('waiting');
    const [isTokenExpired, setIsTokenExpired] = useState(false);
    const [tokenCreatedDate, setTokenCreatedDate] = useState(null);

    const [isExistingPatient] = useState(tokenData?.isExistingPatient || false);

    const languageVoiceMap = {
        'EN': 'en-US',
        'HI': 'hi-IN'
    };

    // Generate a random token and room number
    const generateToken = () => {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        const letter = letters[Math.floor(Math.random() * letters.length)];
        const number = Math.floor(Math.random() * 90) + 10;
        return `${letter}-${number}`;
    };

    const generateRoom = () => {
        return Math.floor(Math.random() * 20) + 1;
    };

    // Get department name from props or localStorage
    const getDepartmentName = () => {
        if (tokenData?.departmentName && tokenData.departmentName !== '') {
            return tokenData.departmentName;
        }
        if (department && department !== '') {
            return department;
        }
        const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
        if (patientData.departmentName && patientData.departmentName !== '') {
            return patientData.departmentName;
        }
        if (patientData.department) {
            const deptMap = {
                'general': 'General',
                'dental': 'Dental',
                'eye': 'Eye',
                'bones': 'Bones',
                'child': 'Child',
                'women': 'Women'
            };
            const mapped = deptMap[patientData.department.toLowerCase()];
            if (mapped) return mapped;
        }
        return 'General';
    };

    const [token] = useState(tokenData?.token || generateToken());
    const [room] = useState(tokenData?.room || generateRoom());
    const [departmentName, setDepartmentName] = useState(getDepartmentName);

    // Check if token is valid (not completed/expired)
    const checkTokenValidity = async () => {
        try {
            // First check if token exists in database
            const response = await fetch(`/api/tokens`);
            const data = await response.json();
            
            if (data.success) {
                const foundToken = data.data.find(t => t.token_number === token);
                
                if (foundToken) {
                    const isToday = new Date(foundToken.created_at).toDateString() === new Date().toDateString();
                    const isActive = foundToken.status === 'waiting' || foundToken.status === 'called';
                    
                    setTokenCreatedDate(foundToken.created_at);
                    
                    if (!isActive || !isToday) {
                        // Token is expired or completed
                        console.log('❌ Token is expired/completed:', foundToken.status);
                        setIsTokenExpired(true);
                        setTokenStatus('expired');
                        return false;
                    }
                    
                    // Token is active
                    console.log('✅ Token is active:', foundToken.status);
                    return true;
                }
            }
            return true; // New token, not yet in database
        } catch (error) {
            console.error('Error checking token validity:', error);
            return true;
        }
    };

    // Fetch queue information for this department
    const fetchQueueInfo = async () => {
        // First check if token is valid
        const isValid = await checkTokenValidity();
        if (!isValid) {
            // Token is expired, show expired message
            setIsTokenExpired(true);
            setTokenStatus('expired');
            return;
        }

        try {
            const response = await fetch(`/api/tokens/department-status/${encodeURIComponent(departmentName)}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                const waitingTokens = data.data.waitingTokens || [];
                const currentCalled = data.data.currentCalled;
                
                // Check if this token is in waiting list or called
                const tokenInWaiting = waitingTokens.find(t => t.token_number === token);
                const tokenCalled = currentCalled && currentCalled.token_number === token;
                
                let position = 0;
                let status = 'waiting';
                
                if (tokenCalled) {
                    status = 'called';
                    position = 0;
                    console.log(`📢 Token ${token} has been called!`);
                } else if (tokenInWaiting) {
                    status = 'waiting';
                    const index = waitingTokens.findIndex(t => t.token_number === token);
                    position = index + 1;
                } else {
                    // Check if token exists in database but not in waiting/called
                    const allTokensResponse = await fetch(`/api/tokens`);
                    const allTokensData = await allTokensResponse.json();
                    
                    if (allTokensData.success) {
                        const foundToken = allTokensData.data.find(t => t.token_number === token);
                        if (foundToken) {
                            if (foundToken.status === 'completed' || foundToken.status === 'missed') {
                                setIsTokenExpired(true);
                                setTokenStatus('expired');
                                return;
                            }
                        }
                    }
                    
                    // New token not yet in database
                    status = 'waiting';
                    position = waitingTokens.length + 1;
                }
                
                const totalWaiting = waitingTokens.length;
                const waitTimeMinutes = Math.max(0, (position - 1) * 20);
                
                setTokenStatus(status);
                setPositionInQueue(position);
                setWaitingCount(totalWaiting);
                setEstimatedTime(waitTimeMinutes);
                
                console.log(`📊 Queue Info for ${departmentName}:`);
                console.log(`  - Token status: ${status}`);
                console.log(`  - Position in queue: ${position}`);
                console.log(`  - Total waiting: ${totalWaiting}`);
            }
        } catch (error) {
            console.error('Error fetching queue info:', error);
        }
    };

    // Fetch queue info when component mounts
    useEffect(() => {
        fetchQueueInfo();
        
        // Refresh queue info every 10 seconds
        const interval = setInterval(fetchQueueInfo, 10000);
        return () => clearInterval(interval);
    }, [departmentName]);

    useEffect(() => {
        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        speechTimeoutRef.current = setTimeout(() => {
            let tokenMessage = '';
            
            if (tokenStatus === 'expired') {
                tokenMessage = `${translations.yourTokenExpired}. ${translations.pleaseRegisterAgain}.`;
            } else if (tokenStatus === 'called') {
                tokenMessage = `${translations.yourTokenIs} ${token}. ${translations.pleaseGoToDoctor} ${translations.room} ${room}.`;
            } else {
                tokenMessage = `${translations.yourTokenIs} ${token}. ${translations.goToRoom} ${room} ${translations.andWait}.`;
                
                if (positionInQueue > 0) {
                    if (positionInQueue === 1) {
                        tokenMessage += ` ${translations.youAreNext}.`;
                    } else {
                        const hours = Math.floor(estimatedTime / 60);
                        const minutes = estimatedTime % 60;
                        let timeStr = '';
                        if (hours > 0) {
                            timeStr += `${hours} ${translations.hours} `;
                        }
                        timeStr += `${minutes} ${translations.minutes}`;
                        tokenMessage += ` ${translations.estimatedWait} ${timeStr}. ${translations.youArePosition} ${positionInQueue}.`;
                    }
                }
            }
            
            speakText(tokenMessage);
        }, 800);

        return () => {
            if (speechTimeoutRef.current) {
                clearTimeout(speechTimeoutRef.current);
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [language, token, room, positionInQueue, estimatedTime, tokenStatus]);

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

    const handleTokenAgain = () => {
        let tokenMessage = '';
        
        if (tokenStatus === 'expired') {
            tokenMessage = `${translations.yourTokenExpired}. ${translations.pleaseRegisterAgain}.`;
        } else if (tokenStatus === 'called') {
            tokenMessage = `${translations.yourTokenIs} ${token}. ${translations.pleaseGoToDoctor} ${translations.room} ${room}.`;
        } else {
            tokenMessage = `${translations.yourTokenIs} ${token}. ${translations.goToRoom} ${room} ${translations.andWait}.`;
            if (positionInQueue > 0) {
                if (positionInQueue === 1) {
                    tokenMessage += ` ${translations.youAreNext}.`;
                } else {
                    const hours = Math.floor(estimatedTime / 60);
                    const minutes = estimatedTime % 60;
                    let timeStr = '';
                    if (hours > 0) {
                        timeStr += `${hours} ${translations.hours} `;
                    }
                    timeStr += `${minutes} ${translations.minutes}`;
                    tokenMessage += ` ${translations.estimatedWait} ${timeStr}. ${translations.youArePosition} ${positionInQueue}.`;
                }
            }
        }
        speakText(tokenMessage);
    };

    const handleChangeDepartment = () => {
        if (!isSaving && !hasCompleted && tokenStatus !== 'expired') {
            onBack();
        }
    };

    const handleComplete = async () => {
        if (isSaving || hasCompleted || tokenStatus === 'expired') {
            if (tokenStatus === 'expired') {
                alert('⚠️ Your token has expired. Please register again.');
                onBack(); // Go back to phone screen
            }
            return;
        }

        setIsSaving(true);
        
        try {
            const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
            
            let deptName = departmentName;
            if (!deptName || deptName === '') {
                deptName = tokenData?.departmentName || department || patientData.departmentName || 'General';
            }
            
            const validDepartments = ['General', 'Dental', 'Eye', 'Bones', 'Child', 'Women'];
            const hindiToEnglish = {
                'सामान्य': 'General',
                'दंत': 'Dental',
                'नेत्र': 'Eye',
                'हड्डी': 'Bones',
                'बाल': 'Child',
                'महिला': 'Women'
            };
            
            if (hindiToEnglish[deptName]) {
                deptName = hindiToEnglish[deptName];
            }
            
            const deptIdMap = {
                'general': 'General',
                'dental': 'Dental',
                'eye': 'Eye',
                'bones': 'Bones',
                'child': 'Child',
                'women': 'Women'
            };
            
            if (deptIdMap[deptName.toLowerCase()]) {
                deptName = deptIdMap[deptName.toLowerCase()];
            }
            
            if (!validDepartments.includes(deptName)) {
                deptName = 'General';
            }
            
            const saveData = {
                language: patientData.language || 'EN',
                phoneNumber: patientData.phoneNumber || '',
                name: patientData.name || '',
                age: patientData.age || null,
                department: deptName,
                departmentName: deptName,
                token: token,
                roomNumber: room
            };

            const response = await fetch('/api/patients/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(saveData),
            });

            const data = await response.json();
            
            if (response.ok) {
                setHasCompleted(true);
                speakText(translations.registrationComplete);
                
                onNext({ 
                    token: token,
                    room: room,
                    departmentName: deptName,
                    completed: true 
                });
                
                localStorage.removeItem('patientData');
                
                let message = `✅ Registration Complete! Your token is ${token} for ${deptName} department.`;
                if (tokenStatus === 'called') {
                    message += ` Please go to Room ${room} now.`;
                } else if (positionInQueue > 0) {
                    if (positionInQueue === 1) {
                        message += ` You are next in line!`;
                    } else {
                        const hours = Math.floor(estimatedTime / 60);
                        const minutes = estimatedTime % 60;
                        let timeStr = '';
                        if (hours > 0) {
                            timeStr += `${hours} hour${hours > 1 ? 's' : ''} `;
                        }
                        timeStr += `${minutes} minute${minutes > 1 ? 's' : ''}`;
                        message += ` Estimated wait time: ${timeStr}. You are position ${positionInQueue} in queue.`;
                    }
                }
                alert(message);
            } else {
                alert('❌ Error saving: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error saving patient:', error);
            alert('❌ Error saving patient data. Please check if the backend server is running.\n\nError: ' + error.message);
        } finally {
            setIsSaving(false);
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

    // Format wait time for display
    const formatWaitTime = () => {
        if (positionInQueue === 0) return '';
        if (positionInQueue === 1) return 'You are next!';
        
        const hours = Math.floor(estimatedTime / 60);
        const minutes = estimatedTime % 60;
        let timeStr = '';
        if (hours > 0) {
            timeStr += `${hours}h `;
        }
        timeStr += `${minutes}m`;
        return `~${timeStr} wait`;
    };

    const isTokenCalled = tokenStatus === 'called';
    const isTokenExpiredStatus = tokenStatus === 'expired';

    // If token is expired, show expired message
    if (isTokenExpiredStatus) {
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
                    <h2>⏰ Token Expired</h2>
                    
                    <div className="voice-instruction">
                        <div className="instruction-icon">🔊</div>
                        <div className="instruction-text">
                            <p style={{ fontSize: '18px', color: '#e74c3c', fontWeight: 'bold' }}>
                                {translations.yourTokenExpired}
                            </p>
                            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                                Token: {token} • Created: {tokenCreatedDate ? new Date(tokenCreatedDate).toLocaleString() : 'N/A'}
                            </p>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                {translations.pleaseRegisterAgain}
                            </p>
                            <button
                                className="hear-again-btn"
                                onClick={handleTokenAgain}
                                disabled={isSpeaking}
                                style={{ marginTop: '12px' }}
                            >
                                {isSpeaking ? `🔊 ${translations.speaking}` : `🔊 ${translations.hearAgain}`}
                            </button>
                        </div>
                    </div>

                    <div className="token-card" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
                        <div className="token-department" style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
                            {departmentName}
                        </div>
                        <div className="token-number" style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                            {token}
                        </div>
                        <div className="token-room">
                            {translations.room} {room}
                        </div>
                        <div style={{ 
                            marginTop: '12px', 
                            padding: '8px 16px', 
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            ⚠️ EXPIRED
                        </div>
                    </div>

                    <div className="navigation">
                        <button 
                            className="nav-btn back-btn"
                            onClick={handleChangeDepartment}
                        >
                            {translations.back}
                        </button>
                        <button 
                            className="nav-btn submit-btn"
                            onClick={handleComplete}
                            style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
                        >
                            Register New
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                <h2>{translations.yourToken}</h2>

                <div className="voice-instruction">
                    <div className="instruction-icon">🔊</div>
                    <div className="instruction-text">
                        <p>
                            {isTokenCalled ? (
                                `"${translations.yourTokenIs} ${token}. ${translations.pleaseGoToDoctor} ${translations.room} ${room}."`
                            ) : (
                                `"${translations.yourTokenIs} ${token}. ${translations.goToRoom} ${room} ${translations.andWait}."`
                            )}
                        </p>
                        {!isTokenCalled && positionInQueue > 0 && (
                            <p style={{ fontSize: '14px', color: '#667eea', fontWeight: '600', marginTop: '4px' }}>
                                {positionInQueue === 1 ? '🔔 You are next in line!' : `⏱️ Position: ${positionInQueue} | Estimated wait: ${formatWaitTime()}`}
                            </p>
                        )}
                        {isTokenCalled && (
                            <p style={{ fontSize: '14px', color: '#4CAF50', fontWeight: '600', marginTop: '4px' }}>
                                🏥 Please go to Room {room} now!
                            </p>
                        )}
                        {tokenCreatedDate && (
                            <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                Issued: {new Date(tokenCreatedDate).toLocaleString()}
                            </p>
                        )}
                        <button
                            className="hear-again-btn"
                            onClick={handleTokenAgain}
                            disabled={isSpeaking}
                        >
                            {isSpeaking ? `🔊 ${translations.speaking}` : `🔊 ${translations.hearAgain}`}
                        </button>
                    </div>
                </div>

                <div className="token-card">
                    <div className="token-department" style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
                        {departmentName}
                    </div>
                    <div className="token-number">
                        {token}
                    </div>
                    <div className="token-room">
                        {translations.room} {room}
                    </div>
                    {isTokenCalled ? (
                        <div style={{ 
                            marginTop: '12px', 
                            padding: '8px 16px', 
                            background: 'rgba(76, 175, 80, 0.3)',
                            borderRadius: '8px',
                            color: '#2e7d32',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            🏥 Please go to the doctor now!
                        </div>
                    ) : positionInQueue > 0 && (
                        <div style={{ 
                            marginTop: '12px', 
                            padding: '8px 16px', 
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px'
                        }}>
                            {positionInQueue === 1 ? '🔔 Next in line!' : `👥 Position ${positionInQueue} | ~${Math.ceil(estimatedTime/60)}h ${estimatedTime%60}m wait`}
                        </div>
                    )}
                </div>

                <div className="token-actions">
                    <button
                        className="token-btn room-btn"
                        onClick={handleTokenAgain}
                        disabled={isSpeaking}
                    >
                        🔊 {translations.roomTokenAgain}
                    </button>
                    <button
                        className="token-btn change-btn"
                        onClick={handleChangeDepartment}
                        disabled={isSaving || hasCompleted || isTokenCalled}
                    >
                        🔄 {translations.changeDepartment}
                    </button>
                </div>

                <div className="navigation">
                    <button
                        className="nav-btn back-btn"
                        onClick={handleChangeDepartment}
                        disabled={isSaving || hasCompleted || isTokenCalled}
                    >
                        {translations.back}
                    </button>
                    <button
                        className="nav-btn submit-btn"
                        onClick={handleComplete}
                        disabled={isSaving || hasCompleted}
                    >
                        {isSaving ? '⏳ Saving...' : translations.complete}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TokenScreen;