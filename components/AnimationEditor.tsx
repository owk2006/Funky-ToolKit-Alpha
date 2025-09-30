import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon, SkipNextIcon, SkipPreviousIcon, OnionSkinIcon, CenterViewIcon, LoopIcon } from './icons';
import { FileSystemNode, CanvasView } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AnimationEditorProps {
    images: FileSystemNode[];
    isPlaying: boolean;
    onTogglePlay: () => void;
    isLooping: boolean;
    onToggleLoop: () => void;
    currentFrame: number;
    onSetFrame: (frame: number) => void;
    totalFrames: number;
    selectedFolderName: string | null;
    onUpdateNodeProperties: (id: string, properties: Partial<FileSystemNode>) => void;
    canvasView: CanvasView;
    onCanvasViewChange: (view: CanvasView) => void;
    frameRate: number;
    isActive: boolean;
}

const AnimationEditor: React.FC<AnimationEditorProps> = ({ 
    images, isPlaying, onTogglePlay, isLooping, onToggleLoop, currentFrame, onSetFrame, totalFrames,
    selectedFolderName, onUpdateNodeProperties, canvasView, onCanvasViewChange,
    isActive
}) => {
    const { t } = useLanguage();
    const [onionSkinLevel, setOnionSkinLevel] = useState<0 | 1 | 2>(0);
    
    const viewportRef = useRef<HTMLDivElement>(null);
    const panStartRef = useRef({ x: 0, y: 0, startPan: { x: 0, y: 0 } });
    const isPanningRef = useRef(false);
    
    const [imageSizes, setImageSizes] = useState<Record<string, {width: number, height: number}>>({});

    const currentFrameIndex = currentFrame - 1;
    const currentImage = images.length > 0 ? images[currentFrameIndex] : null;
    const prevImage = onionSkinLevel >= 1 && currentFrameIndex > 0 ? images[currentFrameIndex - 1] : null;
    const prevPrevImage = onionSkinLevel === 2 && currentFrameIndex > 1 ? images[currentFrameIndex - 2] : null;

    const getImageSize = (node: FileSystemNode | null) => {
        if (!node || !node.id) return { width: 0, height: 0 };
        return imageSizes[node.id] || { width: 0, height: 0 };
    }

    useEffect(() => {
        images.forEach(imageNode => {
            if (imageNode.dataUrl && !imageSizes[imageNode.id]) {
                const img = new Image();
                img.onload = () => {
                    setImageSizes(prev => ({
                        ...prev,
                        [imageNode.id]: { width: img.naturalWidth, height: img.naturalHeight }
                    }));
                };
                img.src = imageNode.dataUrl;
            }
        });
    }, [images, imageSizes]);

    const currentImageSize = getImageSize(currentImage);
    const prevImageSize = getImageSize(prevImage);
    const prevPrevImageSize = getImageSize(prevPrevImage);


    const resetView = useCallback(() => {
        if (viewportRef.current && images.length > 0 && images[0].dataUrl) {
            const firstImageSize = getImageSize(images[0]);
            
            const processSize = (imgWidth: number, imgHeight: number) => {
                 if (!viewportRef.current) return;
                const { clientWidth, clientHeight } = viewportRef.current;
                
                const verticalPadding = 100;
                const horizontalPadding = 50;

                const availableWidth = clientWidth - horizontalPadding;
                const availableHeight = clientHeight - verticalPadding;

                if (imgWidth <= 0 || imgHeight <= 0) {
                     onCanvasViewChange({ pan: { x: clientWidth / 2, y: clientHeight / 2 }, zoom: 1 });
                    return;
                }

                const widthScale = availableWidth / imgWidth;
                const heightScale = availableHeight / imgHeight;
                
                const newZoom = Math.min(widthScale, heightScale, 1);

                onCanvasViewChange({ 
                    pan: { x: clientWidth / 2, y: clientHeight / 2 }, 
                    zoom: newZoom > 0 ? newZoom : 1
                });
            }

            if (firstImageSize.width > 0) {
                processSize(firstImageSize.width, firstImageSize.height);
            } else {
                const img = new Image();
                img.onload = () => processSize(img.naturalWidth, img.naturalHeight);
                img.onerror = () => {
                     if (viewportRef.current) {
                        const { clientWidth, clientHeight } = viewportRef.current;
                        onCanvasViewChange({ pan: { x: clientWidth / 2, y: clientHeight / 2 }, zoom: 1 });
                     }
                };
                img.src = images[0].dataUrl;
            }
        } else if (viewportRef.current) {
            const { clientWidth, clientHeight } = viewportRef.current;
            onCanvasViewChange({ pan: { x: clientWidth / 2, y: clientHeight / 2 }, zoom: 1 });
        }
    }, [images, onCanvasViewChange, imageSizes]);

    useEffect(() => {
        resetView();
    }, [selectedFolderName]);


    const handleNextFrame = useCallback(() => {
        onSetFrame((currentFrame % totalFrames) + 1);
    }, [currentFrame, totalFrames, onSetFrame]);

    const handlePrevFrame = useCallback(() => {
        onSetFrame(((currentFrame - 2 + totalFrames) % totalFrames) + 1);
    }, [currentFrame, totalFrames, onSetFrame]);

    const handleZoom = useCallback((direction: 'in' | 'out', mousePos?: {x: number, y: number}) => {
        if (!viewportRef.current) return;
        
        const rect = viewportRef.current.getBoundingClientRect();
        const { clientWidth, clientHeight } = viewportRef.current;
        
        const pivotX = mousePos ? mousePos.x - rect.left : clientWidth / 2;
        const pivotY = mousePos ? mousePos.y - rect.top : clientHeight / 2;
    
        const pointX = (pivotX - canvasView.pan.x) / canvasView.zoom;
        const pointY = (pivotY - canvasView.pan.y) / canvasView.zoom;
        
        const zoomFactor = 1.1;
        const newZoom = Math.max(0.1, Math.min(10, direction === 'in' ? canvasView.zoom * zoomFactor : canvasView.zoom / zoomFactor));
        
        const newPanX = pivotX - pointX * newZoom;
        const newPanY = pivotY - pointY * newZoom;
    
        onCanvasViewChange({
            pan: { x: newPanX, y: newPanY },
            zoom: newZoom,
        });
    }, [canvasView, onCanvasViewChange]);

    useEffect(() => {
        if (!isActive) {
            return;
        }

        const activeKeys = new Set<string>();
        let animationFrameId: number | null = null;

        const movementLoop = () => {
            if (!currentImage) {
                animationFrameId = null;
                return;
            }

            const moveAmount = 5 / canvasView.zoom;
            let dx = 0;
            let dy = 0;

            if (activeKeys.has('a')) dx -= moveAmount;
            if (activeKeys.has('d')) dx += moveAmount;
            if (activeKeys.has('w')) dy -= moveAmount;
            if (activeKeys.has('s')) dy += moveAmount;

            if (dx !== 0 || dy !== 0) {
                const currentPosition = currentImage.position ?? { x: 0, y: 0 };
                const newPosition = { x: currentPosition.x + dx, y: currentPosition.y + dy };
                onUpdateNodeProperties(currentImage.id, { position: newPosition });
            }

            if (['w', 'a', 's', 'd'].some(key => activeKeys.has(key))) {
                animationFrameId = requestAnimationFrame(movementLoop);
            } else {
                animationFrameId = null;
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
                return; // Ignore keyboard shortcuts if typing in an input field
            }

            switch (e.key.toLowerCase()) {
                case 'arrowright': handleNextFrame(); return;
                case 'arrowleft': handlePrevFrame(); return;
            }

            if (['q', 'e'].includes(e.key.toLowerCase()) && currentImage) {
                const scaleFactor = 1.1;
                const currentScale = currentImage.scale ?? 1;
                const newScale = e.key.toLowerCase() === 'e' 
                    ? currentScale * scaleFactor
                    : currentScale / scaleFactor;
                onUpdateNodeProperties(currentImage.id, { scale: newScale });
                return;
            }

            if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                if (!activeKeys.has(e.key.toLowerCase())) {
                    activeKeys.add(e.key.toLowerCase());
                    if (!animationFrameId) {
                        animationFrameId = requestAnimationFrame(movementLoop);
                    }
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            activeKeys.delete(e.key.toLowerCase());
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isActive, currentImage, onUpdateNodeProperties, handleNextFrame, handlePrevFrame, canvasView.zoom]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        panStartRef.current = { x: e.clientX, y: e.clientY, startPan: canvasView.pan };
        isPanningRef.current = true;
        e.currentTarget.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanningRef.current) return;
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        onCanvasViewChange({
            ...canvasView,
            pan: { x: panStartRef.current.startPan.x + dx, y: panStartRef.current.startPan.y + dy }
        });
    };

    const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        isPanningRef.current = false;
        e.currentTarget.style.cursor = 'grab';
    };
    
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleZoom(e.deltaY < 0 ? 'in' : 'out', {x: e.clientX, y: e.clientY});
    };
    
    const getTransform = (node: FileSystemNode | null, size: {width: number, height: number}) => {
        if (!node) return '';
        const pos = node.position ?? { x: 0, y: 0 };
        const scale = node.scale ?? 1;
        const x = pos.x - (size.width / 2);
        const y = pos.y - (size.height / 2);
        return `translate(${x}px, ${y}px) scale(${scale})`;
    };

    const onionSkinColors: Record<number, string> = {
        0: 'text-gray-300',
        1: 'text-green-500',
        2: 'text-blue-500'
    };

    const toggleOnionSkin = () => {
        setOnionSkinLevel(prev => (prev + 1) % 3 as 0 | 1 | 2);
    };

    return (
        <div className="h-full flex flex-col bg-[#2A2A2A]">
            <div className="p-1 text-xs text-gray-400 border-b border-gray-900/50 flex items-center justify-between flex-shrink-0">
                <span className="truncate pl-2">{selectedFolderName || t('noAnimationSelected')}</span>
                <button onClick={resetView} className="p-1 rounded hover:bg-[#555] text-gray-400 hover:text-white" title={t('centerView')}>
                    <CenterViewIcon className="w-4 h-4" />
                </button>
            </div>
            <div
                ref={viewportRef}
                className="flex-grow relative overflow-hidden bg-repeat"
                style={{ 
                    backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)', 
                    backgroundSize: '20px 20px',
                    cursor: 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onWheel={handleWheel}
            >
                <div 
                    className="absolute top-0 left-0" 
                    style={{ transform: `translate(${canvasView.pan.x}px, ${canvasView.pan.y}px) scale(${canvasView.zoom})` }}
                >
                    <div 
                      className="absolute left-0 top-0 pointer-events-none" 
                      style={{
                        zIndex: 20, 
                        transform: `scale(${1 / canvasView.zoom})`
                      }}
                    >
                        <div className="absolute w-px h-5 bg-white mix-blend-difference -translate-y-1/2"></div>
                        <div className="absolute w-5 h-px bg-white mix-blend-difference -translate-x-1/2"></div>
                    </div>
                     
                     {prevPrevImage && (
                        <img
                            src={prevPrevImage.dataUrl}
                            alt="Onion Skin Frame"
                            className="absolute top-0 left-0 max-w-none max-h-none object-contain opacity-40 pointer-events-none origin-top-left"
                            style={{ 
                                transform: getTransform(prevPrevImage, prevPrevImageSize),
                                filter: 'sepia(1) hue-rotate(180deg) saturate(5) brightness(0.8)',
                                zIndex: 1
                            }}
                        />
                     )}

                     {prevImage && (
                        <img
                            src={prevImage.dataUrl}
                            alt="Onion Skin Frame"
                            className="absolute top-0 left-0 max-w-none max-h-none object-contain opacity-40 pointer-events-none origin-top-left"
                            style={{ 
                                transform: getTransform(prevImage, prevImageSize), 
                                filter: 'sepia(1) hue-rotate(90deg) saturate(5) brightness(0.8)',
                                zIndex: 2 
                            }}
                        />
                     )}
                     {currentImage && (
                        <img 
                            src={currentImage.dataUrl} 
                            alt={`Frame ${currentFrameIndex + 1}`}
                            className="absolute top-0 left-0 max-w-none max-h-none object-contain pointer-events-none origin-top-left"
                            style={{ transform: getTransform(currentImage, currentImageSize), zIndex: 5 }}
                        />
                    )}
                </div>

                {!currentImage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-48 border-2 border-red-500/80 bg-black bg-opacity-50 flex flex-col items-center justify-center text-center p-4 animate-pulse-soft">
                            <p className="text-sm text-white">{t('noAnimationSelected')}</p>
                            <p className="text-xs text-gray-400 mt-2">{t('noAnimationSelectedDesc')}</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-[#3C3C3C] h-14 flex items-center justify-between px-4 border-t border-gray-900/50 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <button onClick={handlePrevFrame} className="p-2 rounded-full hover:bg-[#555] disabled:opacity-50 disabled:cursor-not-allowed" disabled={images.length === 0}><SkipPreviousIcon className="w-5 h-5" /></button>
                    <button onClick={onTogglePlay} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#00AEEF] text-white hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={images.length === 0}>
                        {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={handleNextFrame} className="p-2 rounded-full hover:bg-[#555] disabled:opacity-50 disabled:cursor-not-allowed" disabled={images.length === 0}><SkipNextIcon className="w-5 h-5" /></button>
                    <button onClick={toggleOnionSkin} className={`p-2 rounded-full hover:bg-[#555] ${onionSkinColors[onionSkinLevel]}`}><OnionSkinIcon className="w-5 h-5" /></button>
                    <button onClick={onToggleLoop} className={`p-2 rounded-full hover:bg-[#555] ${isLooping ? 'text-[#00AEEF]' : ''}`}><LoopIcon className="w-5 h-5" /></button>
                </div>
                <div className="flex-grow mx-4 flex items-center">
                    <span className="text-sm mr-4 min-w-[70px]">{t('frame')}: {totalFrames > 0 ? currentFrame : 0}/{totalFrames}</span>
                    <input 
                        type="range" 
                        min="1" 
                        max={totalFrames || 1} 
                        value={currentFrame} 
                        onChange={(e) => onSetFrame(Number(e.target.value))} 
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={totalFrames === 0}
                    />
                </div>
            </div>
        </div>
    );
};

export default AnimationEditor;