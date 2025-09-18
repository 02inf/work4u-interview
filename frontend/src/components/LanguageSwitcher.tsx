import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${language === 'zh' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('zh')}
        title="切换到中文"
      >
        中文
      </button>
      <button
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('en')}
        title="Switch to English"
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;