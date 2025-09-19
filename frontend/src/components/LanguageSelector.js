import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Globe } from 'lucide-react';
import { languages, getCurrentLanguage, setCurrentLanguage } from '../utils/translations';

const LanguageSelector = ({ onLanguageChange }) => {
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const handleLanguageChange = (newLanguage) => {
    setCurrentLanguage(newLanguage);
    setCurrentLang(newLanguage);
    
    // Trigger re-render of parent components
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
    
    // Reload the page to apply new language
    window.location.reload();
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <Select value={currentLang} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languages).map(([code, name]) => (
            <SelectItem key={code} value={code}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;