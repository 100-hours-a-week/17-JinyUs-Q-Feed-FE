import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { storage } from '@/utils/storage';

const Splash = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            const isLoggedIn = storage.isLoggedIn();
            navigate(isLoggedIn ? '/' : '/login', { replace: true });
        }, 1200);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center w-full max-w-sm"
            >
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Q-Feed</h1>
                    <p className="text-muted-foreground text-base">
                        Debug Your Answers.<br />
                        Refactor Your Interview Skills.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Splash;
