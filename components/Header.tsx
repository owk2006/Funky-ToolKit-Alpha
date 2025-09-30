import React, { useState, useRef, useEffect } from 'react';
import { PanelState } from '../types';
import { CheckIcon, ChevronRightIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  panels: Record<string, PanelState>;
  togglePanelVisibility: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ panels, togglePanelVisibility }) => {
  const { t } = useLanguage();
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [stickyMenu, setStickyMenu] = useState<string | null>(null);
  const [isPreferencesHovered, setIsPreferencesHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const panelTitles: Record<string, string> = {
    projectNavigator: t('projectNavigator'),
    animationEditor: t('animationEditor'),
    timeline: t('timeline'),
    properties: t('properties'),
    iconInfo: t('iconInfo'),
  };
  
  const menuItems = [
    { key: 'file', label: t('file') },
    { key: 'view', label: t('view') },
    { key: 'windows', label: t('windows') },
    { key: 'tools', label: t('tools') },
    { key: 'help', label: t('help') },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setStickyMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (itemKey: string) => {
    setStickyMenu(prev => (prev === itemKey ? null : itemKey));
  };

  const closeMenus = () => {
    setStickyMenu(null);
    setHoveredMenu(null);
    setIsPreferencesHovered(false);
  };

  return (
    <header className="absolute top-0 left-0 right-0 bg-[#3C3C3C] h-12 flex items-center px-4 text-sm shadow-md z-50">
      <nav className="flex items-center h-full" ref={menuRef}>
        {menuItems.map((item) => (
          <div 
            key={item.key} 
            className="relative h-full flex items-center"
            onMouseEnter={() => setHoveredMenu(item.key)}
            onMouseLeave={() => setHoveredMenu(null)}
          >
            <button
              onClick={() => handleMenuClick(item.key)}
              className="px-3 py-1 rounded-md hover:bg-[#555555] focus:outline-none transition-colors"
              style={{ color: (hoveredMenu === item.key || stickyMenu === item.key) ? '#FFFFFF' : '#737475' }}
            >
              {item.label}
            </button>
            {(hoveredMenu === item.key || stickyMenu === item.key) && (
              <div className="absolute top-full left-0 bg-[#2D2D2D] border border-gray-900/50 rounded-md shadow-lg py-1 w-48 z-20">
                {item.key === 'windows' ? (
                  Object.keys(panelTitles).map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        togglePanelVisibility(id);
                        closeMenus();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#00AEEF] hover:text-white flex items-center justify-between"
                    >
                      <span>{panelTitles[id]}</span>
                      {panels[id]?.isVisible && <CheckIcon className="w-4 h-4" />}
                    </button>
                  ))
                ) : item.key === 'file' ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => setIsPreferencesHovered(true)}
                    onMouseLeave={() => setIsPreferencesHovered(false)}
                  >
                    <button className="w-full text-left px-3 py-1.5 hover:bg-[#00AEEF] hover:text-white flex items-center justify-between">
                      <span>{t('preferences')}</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                    {isPreferencesHovered && (
                       <div className="absolute left-full -top-1 ml-px bg-[#2D2D2D] border border-gray-900/50 rounded-md shadow-lg py-1 w-48">
                         <button
                           onClick={() => {
                             togglePanelVisibility('languages');
                             closeMenus();
                           }}
                           className="w-full text-left px-3 py-1.5 hover:bg-[#00AEEF] hover:text-white"
                         >
                           {t('language')}
                         </button>
                       </div>
                    )}
                  </div>
                ) : (
                  <span className="px-3 py-1.5 text-gray-500 italic text-xs">{t('noActions')}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
};

export default Header;