import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckIcon } from './icons';

const LanguagePanel: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();

    return (
        <div className="p-3 bg-[#333333] h-full text-gray-300 flex flex-col">
            <h3 className="text-sm font-semibold mb-3">{t('selectLanguage')}</h3>
            <div className="space-y-2">
                <button
                    onClick={() => setLanguage('en')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#00AEEF] hover:text-white rounded flex items-center justify-between"
                >
                    <span>{t('english')}</span>
                    {language === 'en' && <CheckIcon className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => setLanguage('es')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#00AEEF] hover:text-white rounded flex items-center justify-between"
                >
                    <span>{t('spanish')}</span>
                    {language === 'es' && <CheckIcon className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

export default LanguagePanel;
