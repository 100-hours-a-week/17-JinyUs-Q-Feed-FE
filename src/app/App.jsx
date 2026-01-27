import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/app/components/ui/sonner';
import { storage } from '@/utils/storage';

// Pages
import Splash from '@/app/pages/Splash';
import AuthLogin from '@/app/pages/AuthLogin';
import Home from '@/app/pages/Home';
import PracticeMain from '@/app/pages/PracticeMain';
import PracticeAnswer from '@/app/pages/PracticeAnswer';
import PracticeAnswerVoice from '@/app/pages/PracticeAnswerVoice';
import PracticeSTT from '@/app/pages/PracticeSTT';
import PracticeAnswerEdit from '@/app/pages/PracticeAnswerEdit';
import PracticeAnswerText from '@/app/pages/PracticeAnswerText';
import PracticeResultKeyword from '@/app/pages/PracticeResultKeyword';
import PracticeResultAI from '@/app/pages/PracticeResultAI';
import ProfileMain from '@/app/pages/ProfileMain';
import SettingMain from '@/app/pages/SettingMain';
import RealInterview from '@/app/pages/RealInterview';
import { PracticeQuestionProvider } from '@/app/contexts/practiceQuestionContext.jsx';

function AppRoutes() {
    const isLoggedIn = storage.isLoggedIn();

    return (
        <>
            <Routes>
                {/* Auth */}
                <Route path="/splash" element={<Splash />} />
                <Route path="/login" element={<AuthLogin />} />

                {/* Protected Routes */}
                {isLoggedIn ? (
                    <>
                        <Route path="/" element={<Home />} />

                        {/* Practice Mode */}
                        <Route path="/practice" element={<PracticeMain />} />
                        <Route path="/practice/answer/:questionId" element={<PracticeAnswer />} />
                        <Route path="/practice/answer-voice/:questionId" element={<PracticeAnswerVoice />} />
                        <Route path="/practice/stt/:questionId" element={<PracticeSTT />} />
                        <Route path="/practice/answer-edit/:questionId" element={<PracticeAnswerEdit />} />
                        <Route path="/practice/answer-text/:questionId" element={<PracticeAnswerText />} />
                        <Route path="/practice/result-keyword/:questionId" element={<PracticeResultKeyword />} />
                        <Route path="/practice/result-ai/:questionId" element={<PracticeResultAI />} />

                        {/* Real Interview */}
                        <Route path="/real-interview" element={<RealInterview />} />

                        {/* Profile */}
                        <Route path="/profile" element={<ProfileMain />} />
                        <Route path="/settings" element={<SettingMain />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                ) : (
                    <Route path="*" element={<Navigate to="/login" replace />} />
                )}
            </Routes>
            <Toaster />
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <PracticeQuestionProvider>
                <AppRoutes />
            </PracticeQuestionProvider>
        </BrowserRouter>
    );
}

export default App;
