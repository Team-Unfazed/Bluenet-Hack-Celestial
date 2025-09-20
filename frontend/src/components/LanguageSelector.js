import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Globe } from 'lucide-react';
import { languages } from '../utils/translations';
import { useApp } from '../contexts/AppContext';

const LanguageSelector = ({ onLanguageChange }) => {
  const { currentLanguage, setLanguage } = useApp();

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    
    // Trigger re-render of parent components
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
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