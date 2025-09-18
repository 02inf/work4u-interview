import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  const renderWithProvider = (initialLanguage = 'zh') => {
    localStorageMock.getItem.mockReturnValue(initialLanguage);
    
    return render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );
  };

  test('renders language switcher buttons', () => {
    renderWithProvider();
    
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  test('Chinese button is active by default', () => {
    renderWithProvider('zh');
    
    const chineseButton = screen.getByText('中文');
    const englishButton = screen.getByText('EN');
    
    expect(chineseButton).toHaveClass('active');
    expect(englishButton).not.toHaveClass('active');
  });

  test('English button is active when language is en', () => {
    renderWithProvider('en');
    
    const chineseButton = screen.getByText('中文');
    const englishButton = screen.getByText('EN');
    
    expect(chineseButton).not.toHaveClass('active');
    expect(englishButton).toHaveClass('active');
  });

  test('clicking English button changes language', () => {
    renderWithProvider('zh');
    
    const englishButton = screen.getByText('EN');
    fireEvent.click(englishButton);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('preferred-language', 'en');
  });

  test('clicking Chinese button changes language', () => {
    renderWithProvider('en');
    
    const chineseButton = screen.getByText('中文');
    fireEvent.click(chineseButton);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('preferred-language', 'zh');
  });
});