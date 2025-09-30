import React, { useRef, useCallback, useState } from 'react';
import { PanelPosition, PanelSize } from '../types';
import { CloseIcon, MinimizeIcon, MaximizeIcon } from './icons';

interface PanelProps {
  id: string;
  children: React.ReactNode;
  title: string;
  position: PanelPosition;
  size: PanelSize;
  zIndex: number;
  isActive: boolean;
  isMinimized: boolean;
  isEffectivelyDisabled: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMove: (pos: PanelPosition) => void;
  onResize: (size: PanelSize, pos: PanelPosition) => void;
  onMinimizeToggle: () => void;
}

type DraggingState = { type: 'move'; startX: number; startY: number; } |
                     { type: 'resize'; handle: string; startX: number; startY: number; } |
                     null;

const Panel: React.FC<PanelProps> = ({ id, children, title, position, size, zIndex, isActive, isMinimized, isEffectivelyDisabled, onClose, onFocus, onMove, onResize, onMinimizeToggle }) => {
  const dragStateRef = useRef<DraggingState>(null);
  const initialRectRef = useRef({ ...position, ...size });
  const [isInteracting, setIsInteracting] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current) return;
    
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;

    if (dragStateRef.current.type === 'move') {
      onMove({
        x: initialRectRef.current.x + dx,
        y: initialRectRef.current.y + dy,
      });
    } else if (dragStateRef.current.type === 'resize') {
        const handle = dragStateRef.current.handle;
        let newWidth = initialRectRef.current.width;
        let newHeight = initialRectRef.current.height;
        let newX = initialRectRef.current.x;
        let newY = initialRectRef.current.y;

        // Right and Bottom resizing
        if (handle.includes('right')) newWidth = Math.max(200, initialRectRef.current.width + dx);
        if (handle.includes('bottom')) newHeight = Math.max(150, initialRectRef.current.height + dy);
        
        // Left and Top resizing
        if (handle.includes('left')) {
            const calculatedWidth = initialRectRef.current.width - dx;
            if (calculatedWidth < 200) {
                newWidth = 200;
                newX = initialRectRef.current.x + initialRectRef.current.width - 200;
            } else {
                newWidth = calculatedWidth;
                newX = initialRectRef.current.x + dx;
            }
        }
        if (handle.includes('top')) {
            const calculatedHeight = initialRectRef.current.height - dy;
            if (calculatedHeight < 150) {
                newHeight = 150;
                newY = initialRectRef.current.y + initialRectRef.current.height - 150;
            } else {
                newHeight = calculatedHeight;
                newY = initialRectRef.current.y + dy;
            }
        }
        
        onResize({ width: newWidth, height: newHeight }, { x: newX, y: newY });
    }
  }, [onMove, onResize]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    dragStateRef.current = null;
    setIsInteracting(false);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onFocus();
    initialRectRef.current = { ...position, ...size };
    dragStateRef.current = {
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
    };
    setIsInteracting(true);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [onFocus, position, size, handleMouseMove, handleMouseUp]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, handle: string) => {
    if (isMinimized) return;
    e.stopPropagation();
    e.preventDefault();
    onFocus();
    initialRectRef.current = { ...position, ...size };
    dragStateRef.current = {
      type: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
    };
    setIsInteracting(true);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [onFocus, position, size, isMinimized, handleMouseMove, handleMouseUp]);
  
  const resizeHandles = [
    { name: 'top', cursor: 'ns-resize', classes: 'top-0 left-0 w-full h-1' },
    { name: 'bottom', cursor: 'ns-resize', classes: 'bottom-0 left-0 w-full h-1' },
    { name: 'left', cursor: 'ew-resize', classes: 'top-0 left-0 w-1 h-full' },
    { name: 'right', cursor: 'ew-resize', classes: 'top-0 right-0 w-1 h-full' },
    { name: 'top-left', cursor: 'nwse-resize', classes: 'top-0 left-0 w-2 h-2' },
    { name: 'top-right', cursor: 'nesw-resize', classes: 'top-0 right-0 w-2 h-2' },
    { name: 'bottom-left', cursor: 'nesw-resize', classes: 'bottom-0 left-0 w-2 h-2' },
    { name: 'bottom-right', cursor: 'nwse-resize', classes: 'bottom-0 right-0 w-2 h-2' },
  ];

  return (
    <div
      className="absolute bg-[#3C3C3C] border border-[#222222] rounded-md shadow-2xl flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? `36px` : `${size.height}px`,
        zIndex,
        transition: isInteracting ? 'none' : 'height 0.3s ease-in-out',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onFocus();
      }}
    >
      <div
        className="h-9 bg-[#4A4A4A] flex items-center justify-between px-3 rounded-t-md cursor-move flex-shrink-0"
        onMouseDown={handleMouseDown}
      >
        <span className="font-semibold text-sm transition-colors" style={{ color: isActive ? '#E0E0E0' : '#737475' }}>{title}</span>
        <div className="flex items-center space-x-2">
            <button onClick={onMinimizeToggle} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white">
              {isMinimized ? <MaximizeIcon className="w-4 h-4" /> : <MinimizeIcon className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white">
              <CloseIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      <div className={`flex-grow p-1 bg-[#333333] overflow-auto transition-opacity duration-200 ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${isEffectivelyDisabled ? 'pointer-events-none' : ''}`}>
        {children}
      </div>
      {!isMinimized && resizeHandles.map(handle => (
        <div 
          key={handle.name}
          className={`absolute ${handle.classes} ${isEffectivelyDisabled ? 'pointer-events-none' : ''}`}
          style={{ cursor: handle.cursor }}
          onMouseDown={(e) => handleResizeMouseDown(e, handle.name)}
        />
      ))}
    </div>
  );
};

export default Panel;