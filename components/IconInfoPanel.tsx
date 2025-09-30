
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CloseIcon } from './icons';

const NeutralFaceIcon: React.FC = () => (
    <svg viewBox="0 0 100 100" className="w-24 h-24 text-gray-500 pointer-events-none">
        <circle cx="50" cy="50" r="45" fill="#808080" />
        <circle cx="35" cy="40" r="5" fill="#000" />
        <circle cx="65" cy="40" r="5" fill="#000" />
        <rect x="25" y="65" width="50" height="8" rx="4" fill="#000" />
    </svg>
);

const DeadFaceIcon: React.FC = () => (
    <svg viewBox="0 0 100 100" className="w-24 h-24 text-gray-500 pointer-events-none">
        <circle cx="50" cy="50" r="45" fill="#808080" />
        <path d="M30 35 l15 15 M45 35 l-15 15" stroke="#000" strokeWidth="8" strokeLinecap="round" />
        <path d="M60 35 l15 15 M75 35 l-15 15" stroke="#000" strokeWidth="8" strokeLinecap="round" />
        <rect x="25" y="65" width="50" height="8" rx="4" fill="#000" />
    </svg>
);


type IconState = {
    dataUrl: string;
    position: { x: number; y: number };
} | null;

interface IconInfoPanelProps {
    isActive: boolean;
}

const IconInfoPanel: React.FC<IconInfoPanelProps> = ({ isActive }) => {
    const { t } = useLanguage();
    const [iconName, setIconName] = useState('');
    const [icon1, setIcon1] = useState<IconState>(null);
    const [icon2, setIcon2] = useState<IconState>(null);
    const [selectedIcon, setSelectedIcon] = useState<1 | 2 | null>(null);

    const fileInput1Ref = useRef<HTMLInputElement>(null);
    const fileInput2Ref = useRef<HTMLInputElement>(null);

    const isDraggingRef = useRef<{ 
        icon: 1 | 2; 
        startX: number; 
        startY: number; 
        startPosX: number; 
        startPosY: number;
    } | null>(null);

    useEffect(() => {
        if (!isActive) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedIcon) return;
            
            const target = e.target as HTMLElement;
            if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
                return;
            }

            const iconToMove = selectedIcon === 1 ? icon1 : icon2;
            if (!iconToMove) return;

            e.preventDefault();
            let { x, y } = iconToMove.position;
            const moveAmount = 1;

            switch (e.key.toLowerCase()) {
                case 'w': y -= moveAmount; break;
                case 'a': x -= moveAmount; break;
                case 's': y += moveAmount; break;
                case 'd': x += moveAmount; break;
                default: return;
            }
            
            if (selectedIcon === 1) {
                setIcon1(prev => prev ? { ...prev, position: { x, y } } : null);
            } else {
                setIcon2(prev => prev ? { ...prev, position: { x, y } } : null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, selectedIcon, icon1, icon2]);

    const handleContainerClick = (iconNumber: 1 | 2) => {
        if (iconNumber === 1 && !icon1) fileInput1Ref.current?.click();
        if (iconNumber === 2 && !icon2) fileInput2Ref.current?.click();
        setSelectedIcon(iconNumber);
    };
    
    const handleRemoveIcon = (iconNumber: 1 | 2, e: React.MouseEvent) => {
        e.stopPropagation();
        if (iconNumber === 1) {
            setIcon1(null);
        } else {
            setIcon2(null);
        }
        if (selectedIcon === iconNumber) {
            setSelectedIcon(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, iconNumber: 1 | 2) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                const newIconState = { dataUrl, position: { x: 0, y: 0 } };
                if (iconNumber === 1) setIcon1(newIconState);
                else setIcon2(newIconState);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const { icon, startX, startY, startPosX, startPosY } = isDraggingRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newPos = { x: startPosX + dx, y: startPosY + dy };

        if (icon === 1 && icon1) {
            setIcon1({ ...icon1, position: newPos });
        } else if (icon === 2 && icon2) {
            setIcon2({ ...icon2, position: newPos });
        }
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        isDraggingRef.current = null;
    };

    const handleMouseDown = (e: React.MouseEvent, iconNumber: 1 | 2) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIcon(iconNumber);
        const iconState = iconNumber === 1 ? icon1 : icon2;
        if (!iconState) return;
        isDraggingRef.current = {
            icon: iconNumber,
            startX: e.clientX,
            startY: e.clientY,
            startPosX: iconState.position.x,
            startPosY: iconState.position.y,
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };


    return (
        <div className="p-3 bg-[#333333] h-full text-gray-300 flex flex-col" onClick={() => setSelectedIcon(null)}>
            <div className="grid grid-cols-3 items-center gap-2 mb-4">
                <label className="text-xs text-gray-400 col-span-1">{t('icon')}</label>
                <input 
                    type="text" 
                    value={iconName} 
                    onChange={(e) => setIconName(e.target.value)}
                    className="col-span-2 bg-[#2A2A2A] border border-gray-900/50 rounded-md p-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#00AEEF]" 
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div className="flex-grow grid grid-cols-2 gap-3">
                <div className="relative">
                    {icon1 && (
                        <button 
                            onClick={(e) => handleRemoveIcon(1, e)}
                            className="absolute top-1 right-1 z-10 p-0.5 bg-gray-800/70 rounded-md text-red-500 hover:text-red-400 hover:bg-gray-700 transition-colors"
                            title="Remove Image"
                        >
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    )}
                    <div 
                        onClick={(e) => { e.stopPropagation(); handleContainerClick(1); }}
                        className={`bg-[#2A2A2A] rounded-md border-2 flex items-center justify-center overflow-hidden relative transition-colors h-full w-full ${selectedIcon === 1 ? 'border-[#00AEEF]' : 'border-gray-900/50'}`}
                        style={{ cursor: icon1 ? 'default' : 'pointer' }}
                    >
                        {icon1 ? (
                             <img
                                src={icon1.dataUrl}
                                className="max-w-full max-h-full object-contain absolute"
                                style={{ 
                                    transform: `translate(${icon1.position.x}px, ${icon1.position.y}px)`,
                                    cursor: 'grab',
                                 }}
                                onMouseDown={(e) => handleMouseDown(e, 1)}
                                draggable={false}
                             />
                        ) : (
                            <NeutralFaceIcon />
                        )}
                    </div>
                </div>
                <div className="relative">
                     {icon2 && (
                        <button 
                            onClick={(e) => handleRemoveIcon(2, e)}
                            className="absolute top-1 right-1 z-10 p-0.5 bg-gray-800/70 rounded-md text-red-500 hover:text-red-400 hover:bg-gray-700 transition-colors"
                            title="Remove Image"
                        >
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    )}
                    <div 
                        onClick={(e) => { e.stopPropagation(); handleContainerClick(2); }}
                        className={`bg-[#2A2A2A] rounded-md border-2 flex items-center justify-center overflow-hidden relative transition-colors h-full w-full ${selectedIcon === 2 ? 'border-[#00AEEF]' : 'border-gray-900/50'}`}
                         style={{ cursor: icon2 ? 'default' : 'pointer' }}
                    >
                        {icon2 ? (
                            <img
                                src={icon2.dataUrl}
                                className="max-w-full max-h-full object-contain absolute"
                                style={{ 
                                    transform: `translate(${icon2.position.x}px, ${icon2.position.y}px)`,
                                    cursor: 'grab'
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 2)}
                                draggable={false}
                            />
                        ) : (
                            <DeadFaceIcon />
                        )}
                    </div>
                </div>
            </div>
            <input type="file" ref={fileInput1Ref} onChange={(e) => handleFileChange(e, 1)} className="hidden" accept="image/*" />
            <input type="file" ref={fileInput2Ref} onChange={(e) => handleFileChange(e, 2)} className="hidden" accept="image/*" />
        </div>
    );
};

export default IconInfoPanel;
