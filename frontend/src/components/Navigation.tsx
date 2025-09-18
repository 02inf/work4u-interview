import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav>
      <div className="nav-container container">
        <div>
          <h1>🤖 {t.appTitle}</h1>
        </div>
        
        <div className="nav-links">
          <Link to="/" className={isActive('/')}>
            {t.navigation.home}
          </Link>
          <Link to="/history" className={isActive('/history')}>
            {t.navigation.history}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;