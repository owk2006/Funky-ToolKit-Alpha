import React, { useRef, useEffect } from 'react';
import { FileSystemNode } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TimelinePanelProps {
    images: FileSystemNode[];
    currentFrame: number;
    onSetFrame: (frame: number) => void;
    onNodeSelect: (id: string) => void;
    selectedFolderId: string | null;
    onReorderImages: (folderId: string, oldIndex: number, newIndex: number) => void;
}

const TimelinePanel: React.FC<TimelinePanelProps> = ({ images, currentFrame, onSetFrame, onNodeSelect, selectedFolderId, onReorderImages }) => {
    const { t } = useLanguage();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const frameRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        frameRefs.current = frameRefs.current.slice(0, images.length);
    }, [images.length]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const frameEl = frameRefs.current[currentFrame - 1];

        if (container && frameEl) {
            const containerWidth = container.clientWidth;
            const frameWidth = frameEl.offsetWidth;
            const frameLeft = frameEl.offsetLeft;

            const targetScrollLeft = frameLeft - (containerWidth / 2) + (frameWidth / 2);

            container.scrollTo({
                left: targetScrollLeft,
                behavior: 'auto'
            });
        }
    }, [currentFrame]);

    const handleFrameClick = (imageNode: FileSystemNode, frameIndex: number) => {
        onSetFrame(frameIndex + 1);
        onNodeSelect(imageNode.id);
    };

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDrop = () => {
        if (selectedFolderId && dragItem.current !== null && dragOverItem.current !== null) {
            onReorderImages(selectedFolderId, dragItem.current, dragOverItem.current);
        }
        handleDragEnd();
    };


    return (
        <div className="h-full flex flex-col bg-[#333333]">
            <div className="p-2 border-b border-gray-900/50">
                <h4 className="font-semibold text-sm">{t('frames')} ({images.length})</h4>
            </div>
            <div ref={scrollContainerRef} className="flex-grow p-2 overflow-x-auto overflow-y-hidden flex items-center space-x-2">
                {images.length > 0 ? images.map((image, index) => (
                    <button 
                        key={image.id}
                        ref={el => { frameRefs.current[index] = el }}
                        onClick={() => handleFrameClick(image, index)}
                        className={`flex-shrink-0 w-20 h-24 bg-[#2A2A2A] rounded-md border-2 flex flex-col items-center justify-center p-1 focus:outline-none
                        ${currentFrame === index + 1 ? 'border-[#00AEEF]' : 'border-gray-900/50'}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="w-full h-16 bg-[#1e1e1e] flex items-center justify-center overflow-hidden pointer-events-none">
                           <img src={image.dataUrl} alt={image.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs mt-1 text-gray-400 truncate w-full text-center pointer-events-none">{index + 1}</span>
                    </button>
                )) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                        {t('noImages')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimelinePanel;