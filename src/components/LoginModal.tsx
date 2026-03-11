
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Chrome } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginModalProps {
  language: 'ar' | 'en';
  onLanguageToggle: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ language, onLanguageToggle }) => {
  const { loginWithGoogle, authError, isLoggingIn } = useAuth();

  const isAr = language === 'ar';

  const providers = [
    { 
      name: isAr ? 'Gmail' : 'Gmail', 
      icon: <Chrome className="w-5 h-5" />, 
      onClick: loginWithGoogle, 
      color: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' 
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative"
      >
        <button 
          onClick={onLanguageToggle}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-all font-bold text-xs z-10"
          disabled={isLoggingIn}
        >
          {isAr ? 'EN' : 'عربي'}
        </button>

        <div className="p-8 text-center">
          <div className="w-24 h-24 bg-emerald-100/10 dark:bg-emerald-900/10 rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <motion.img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Earth_Western_Hemisphere_transparent_background.png/600px-Earth_Western_Hemisphere_transparent_background.png"
              alt="Rotating Earth"
              className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ rotateZ: 23.5 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
              referrerPolicy="no-referrer"
            />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {isAr ? 'مرحباً بك في دليل التأشيرات' : 'Welcome to Visa Guide'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            {isAr 
              ? 'سجل دخولك للوصول إلى كافة المميزات ومعلومات التأشيرات المحدثة' 
              : 'Sign in to access all features and updated visa information'}
          </p>

          {authError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl border border-rose-100 dark:border-rose-900/30"
            >
              {authError}
            </motion.div>
          )}

          <div className="space-y-3">
            {providers.map((provider, idx) => (
              <button
                key={idx}
                onClick={provider.onClick}
                disabled={isLoggingIn}
                className={`w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl border font-bold transition-all active:scale-[0.98] ${provider.color} ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  provider.icon
                )}
                <span>
                  {isLoggingIn 
                    ? (isAr ? 'جاري التحميل...' : 'Loading...') 
                    : (isAr ? `تسجيل الدخول بواسطة ${provider.name}` : `Sign in with ${provider.name}`)}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-8 text-[10px] text-slate-400 dark:text-slate-500 px-4">
            {isAr 
              ? 'بتسجيل دخولك، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا' 
              : 'By signing in, you agree to our Terms of Service and Privacy Policy'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;
