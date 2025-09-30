import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { PanelDefinition, PanelState, FileSystemNode, CanvasView } from './types';
import Header from './components/Header';
import Panel from './components/Panel';
import ProjectNavigator from './components/ProjectNavigator';
import AnimationEditor from './components/AnimationEditor';
import PropertiesPanel from './components/PropertiesPanel';
import TimelinePanel from './components/TimelinePanel';
import IconInfoPanel from './components/IconInfoPanel';
import LanguagePanel from './components/LanguagePanel';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { findNode, findParent } from './utils/fileSystem';
import { packImages } from './utils/packer';
import { generateSpritesheet, generateXML, downloadFile } from './utils/exportUtils';


const AppContent: React.FC = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  
  const initialPanels = useMemo((): Record<string, PanelDefinition> => ({
    projectNavigator: {
      id: 'projectNavigator',
      title: t('projectNavigator'),
      component: ProjectNavigator,
      initialState: {
        position: { x: 20, y: 60 },
        size: { width: 280, height: 400 },
        isVisible: true, zIndex: 10, isMinimized: false,
      },
    },
    animationEditor: {
      id: 'animationEditor',
      title: t('animationEditor'),
      component: AnimationEditor,
      initialState: {
        position: { x: 320, y: 60 },
        size: { width: 700, height: 500 },
        isVisible: true, zIndex: 10, isMinimized: false,
      },
    },
    properties: {
      id: 'properties',
      title: t('properties'),
      component: PropertiesPanel,
      initialState: {
        position: { x: 1040, y: 60 },
        size: { width: 320, height: 600 },
        isVisible: true, zIndex: 10, isMinimized: false,
      },
    },
    timeline: {
      id: 'timeline',
      title: t('timeline'),
      component: TimelinePanel,
      initialState: {
        position: { x: 320, y: 580 },
        size: { width: 700, height: 200 },
        isVisible: true, zIndex: 10, isMinimized: false,
      },
    },
    iconInfo: {
      id: 'iconInfo',
      title: t('iconInfo'),
      component: IconInfoPanel,
      initialState: {
        position: { x: 1040, y: 680 },
        size: { width: 320, height: 200 },
        isVisible: true, zIndex: 10, isMinimized: false,
      },
    },
    languages: {
      id: 'languages',
      title: t('languages'),
      component: LanguagePanel,
      initialState: {
        position: { x: 400, y: 200 },
        size: { width: 300, height: 180 },
        isVisible: false, zIndex: 11, isMinimized: false,
      },
    },
  }), [t]);

  const [panels, setPanels] = useState<Record<string, PanelState>>(() =>
    Object.keys(initialPanels).reduce((acc, key) => {
      acc[key] = initialPanels[key].initialState;
      return acc;
    }, {} as Record<string, PanelState>)
  );

  const [fileSystem, setFileSystem] = useState<FileSystemNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [canvasView, setCanvasView] = useState<CanvasView>({ pan: { x: 0, y: 0 }, zoom: 1 });
  const animationIntervalRef = useRef<number | null>(null);

  const selectedNode = useMemo(() => selectedNodeId ? findNode(fileSystem, selectedNodeId) : null, [selectedNodeId, fileSystem]);
  
  const animationFolderNode = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.type === 'folder' && findParent(fileSystem, selectedNode.id)) return selectedNode;
    if (selectedNode.type === 'file') return findParent(fileSystem, selectedNode.id);
    return null;
  }, [selectedNode, fileSystem]);
  
  const activeSpriteNode = useMemo(() => {
    if (!selectedNodeId) return null;
    let currentNode = findNode(fileSystem, selectedNodeId);
    if (!currentNode) return null;
    let parent = findParent(fileSystem, currentNode.id);
    while(parent) {
      currentNode = parent;
      parent = findParent(fileSystem, currentNode.id);
    }
    return currentNode;
  }, [selectedNodeId, fileSystem]);

  const imageFiles = animationFolderNode?.children?.filter(child => child.type === 'file' && child.dataUrl) ?? [];
  const frameRate = animationFolderNode?.frameRate ?? 24;

  const handleTogglePlay = () => {
    const isAtEnd = currentFrame >= imageFiles.length;
  
    // If paused at the end of a non-looping animation, restart from frame 1
    if (!isPlaying && !isLooping && isAtEnd) {
      setCurrentFrame(1);
      setIsPlaying(true);
    } else {
      // Otherwise, just toggle the playing state
      setIsPlaying(p => !p);
    }
  };

  useEffect(() => {
    if (isPlaying && imageFiles.length > 0) {
      animationIntervalRef.current = window.setInterval(() => {
        setCurrentFrame(prev => {
          if (prev < imageFiles.length) {
            return prev + 1;
          }
          if (isLooping) {
            return 1; // Loop back to start
          }
          // If not looping, stop at the end
          setIsPlaying(false);
          return imageFiles.length;
        });
      }, 1000 / frameRate);
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isPlaying, imageFiles.length, frameRate, isLooping]);

  useEffect(() => {
    const parentOfSelected = selectedNodeId ? findParent(fileSystem, selectedNodeId) : null;
    if (animationFolderNode?.id !== parentOfSelected?.id) {
        setCurrentFrame(1);
        setIsPlaying(false);
    }
  }, [animationFolderNode, selectedNodeId, fileSystem]);

  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) {
      const node = findNode(fileSystem, nodeId);
      if (node?.type === 'file') {
        const parent = findParent(fileSystem, node.id);
        const frameIndex = parent?.children?.findIndex(child => child.id === nodeId) ?? -1;
        if (frameIndex !== -1) {
          setCurrentFrame(frameIndex + 1);
        }
      }
    }
  };

  const bringToFront = useCallback((id: string) => {
    setActivePanelId(id);
    setPanels(prev => {
      const panel = prev[id];
      if (!panel) return prev;
      const maxZ = Math.max(...Object.values(prev).map((p: PanelState) => p.zIndex));
      if (panel.zIndex === maxZ) return prev;
      return { ...prev, [id]: { ...panel, zIndex: maxZ + 1 } };
    });
  }, []);

  const togglePanelVisibility = useCallback((id: string) => {
    setPanels(prev => {
      const panel = prev[id];
      if (!panel) return prev;
      const newState = { ...prev, [id]: { ...panel, isVisible: !panel.isVisible } };
      if (newState[id].isVisible) {
         bringToFront(id);
      }
      return newState;
    });
  }, [bringToFront]);

  const togglePanelMinimized = useCallback((id: string) => {
    setPanels(p => {
      const panel = p[id];
      if (!panel) return p;
      return { ...p, [id]: { ...panel, isMinimized: !panel.isMinimized }};
    });
  }, []);

  const handleSetFrame = (frame: number) => {
    if (frame > 0 && frame <= imageFiles.length) {
      setCurrentFrame(frame);
      if (animationFolderNode && animationFolderNode.children) {
        const fileNode = animationFolderNode.children[frame - 1];
        if (fileNode) {
          setSelectedNodeId(fileNode.id);
        }
      }
    }
  };
  
  const handleUpdateNodeProperties = useCallback((nodeId: string, properties: Partial<FileSystemNode>) => {
    const updateRecursive = (nodes: FileSystemNode[]): FileSystemNode[] => {
        return nodes.map(node => {
            if (node.id === nodeId) {
                if ('name' in properties && !properties.name) {
                    return node; 
                }
                return { ...node, ...properties };
            }
            if (node.children) {
                return { ...node, children: updateRecursive(node.children) };
            }
            return node;
        });
    };
    setFileSystem(prevFS => updateRecursive(prevFS));
  }, []);

  const handleAddRootSprite = (name: string) => {
      const newSprite: FileSystemNode = {
          id: `sprite_${Date.now()}`,
          name,
          type: 'folder',
          children: [],
          // Default properties
          dataFormat: 'xml',
          exportScale: 1,
          allowTrim: true,
          allowRotation: true,
          padding: 2,
          maxWidth: 4096,
          maxHeight: 4096,
          powerOfTwo: true,
      };
      setFileSystem(fs => [...fs, newSprite]);
  };
  
  const handleReorderImages = (folderId: string, oldIndex: number, newIndex: number) => {
    const reorderRecursive = (nodes: FileSystemNode[]): FileSystemNode[] => {
        return nodes.map(node => {
            if (node.id === folderId && node.children) {
                const newChildren = [...node.children];
                if (newIndex >= 0 && newIndex < newChildren.length) {
                    const [removed] = newChildren.splice(oldIndex, 1);
                    newChildren.splice(newIndex, 0, removed);
                    return { ...node, children: newChildren };
                }
            }
            if (node.children) {
                return { ...node, children: reorderRecursive(node.children) };
            }
            return node;
        });
    };
    setFileSystem(prevFS => reorderRecursive(prevFS));
  };

  const handleExport = async () => {
    if (!activeSpriteNode) {
      alert("Please select a sprite to export.");
      return;
    }
    setIsExporting(true);
    try {
      const allImageNodes: FileSystemNode[] = [];
      const traverse = (node: FileSystemNode) => {
        if (node.type === 'file' && node.dataUrl) {
          allImageNodes.push(node);
        }
        if (node.children) {
          node.children.forEach(traverse);
        }
      };
      activeSpriteNode.children?.forEach(traverse);
  
      if (allImageNodes.length === 0) {
        alert("No images found in the selected sprite to export.");
        return;
      }
      
      const { packedItems, sheetWidth, sheetHeight } = await packImages(allImageNodes, {
        padding: activeSpriteNode.padding ?? 2,
        maxWidth: activeSpriteNode.maxWidth ?? 4096,
        maxHeight: activeSpriteNode.maxHeight ?? 4096,
        powerOfTwo: activeSpriteNode.powerOfTwo ?? false,
      });

      const spritesheetDataUrl = await generateSpritesheet(packedItems, sheetWidth, sheetHeight);
      const xmlString = generateXML(packedItems, activeSpriteNode);

      downloadFile(spritesheetDataUrl, `${activeSpriteNode.textureName || activeSpriteNode.name}.png`);
      const xmlBlob = new Blob([xmlString], { type: 'text/xml' });
      downloadFile(URL.createObjectURL(xmlBlob), `${activeSpriteNode.dataFileName || activeSpriteNode.name}.xml`);

    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const constrainPanel = (panelState: PanelState): PanelState => {
      const mainBounds = mainRef.current?.getBoundingClientRect();
      if (!mainBounds) return panelState;
      
      const newPos = { ...panelState.position };
      const newSize = { ...panelState.size };
      
      const titleBarHeight = 36; // From Panel.tsx h-9
      const headerHeight = 48;   // From Header.tsx h-12
      const footerHeight = 48;
      
      newPos.x = Math.max(-(newSize.width - 40), Math.min(newPos.x, mainBounds.width - 40));
      newPos.y = Math.max(headerHeight, Math.min(newPos.y, mainBounds.height - footerHeight - titleBarHeight));

      return { ...panelState, position: newPos, size: newSize };
  }


  return (
    <div 
        className="w-screen h-screen bg-[#2D2D2D] relative select-none" 
        ref={mainRef}
        onMouseDown={(e) => { if(e.target === e.currentTarget) setActivePanelId(null); }}
    >
      <Header panels={panels} togglePanelVisibility={togglePanelVisibility} />
      
      {Object.keys(initialPanels).map((id) => {
        const def = initialPanels[id];
        const state = panels[id];
        if (!state || !state.isVisible) return null;
        const PanelComponent = def.component;
        
        const props: any = {};

        if (id === 'projectNavigator') {
          props.fileSystem = fileSystem;
          props.selectedNodeId = selectedNodeId;
          props.onSelectNode = handleSelectNode;
          props.onFileSystemUpdate = setFileSystem;
          props.onReorderImages = handleReorderImages;
          props.onAddRootSprite = handleAddRootSprite;
          props.onUpdateNodeProperties = handleUpdateNodeProperties;
        } else if (id === 'animationEditor') {
          props.isActive = id === activePanelId;
          props.images = imageFiles;
          props.isPlaying = isPlaying;
          props.onTogglePlay = handleTogglePlay;
          props.isLooping = isLooping;
          props.onToggleLoop = () => setIsLooping(p => !p);
          props.currentFrame = currentFrame;
          props.onSetFrame = handleSetFrame;
          props.totalFrames = imageFiles.length;
          props.selectedFolderName = animationFolderNode?.name ?? null;
          props.onUpdateNodeProperties = handleUpdateNodeProperties;
          props.canvasView = canvasView;
          props.onCanvasViewChange = setCanvasView;
          props.frameRate = frameRate;
        } else if (id === 'timeline') {
            props.images = imageFiles;
            props.currentFrame = currentFrame;
            props.onSetFrame = handleSetFrame;
            props.onNodeSelect = handleSelectNode;
            props.selectedFolderId = animationFolderNode?.id ?? null;
            props.onReorderImages = handleReorderImages;
        } else if (id === 'properties') {
          const parentOfSelected = selectedNodeId ? findParent(fileSystem, selectedNodeId) : null;
          props.selectedNode = selectedNode;
          props.activeSpriteNode = activeSpriteNode;
          props.onUpdateNodeProperties = handleUpdateNodeProperties;
          props.isAnimationFolderSelected = !!(selectedNode?.type === 'folder' && parentOfSelected && !findParent(fileSystem, parentOfSelected.id));
        } else if (id === 'iconInfo') {
            props.isActive = id === activePanelId;
        }

        return (
          <Panel
            key={id}
            id={id}
            title={def.title}
            position={state.position}
            size={state.size}
            zIndex={state.zIndex}
            isActive={id === activePanelId}
            isMinimized={state.isMinimized}
            isEffectivelyDisabled={activePanelId !== null && id !== activePanelId}
            onClose={() => togglePanelVisibility(id)}
            onFocus={() => bringToFront(id)}
            onMove={(position) => setPanels(p => {
              const panel = p[id];
              if (!panel) return p;
              return { ...p, [id]: constrainPanel({ ...panel, position }) };
            })}
            onResize={(size, position) => setPanels(p => {
              const panel = p[id];
              if (!panel) return p;
              return { ...p, [id]: constrainPanel({ ...panel, size, position }) };
            })}
            onMinimizeToggle={() => togglePanelMinimized(id)}
          >
            <PanelComponent {...props} />
          </Panel>
        );
      })}
      
      <footer className="absolute bottom-0 left-0 right-0 bg-[#3C3C3C] h-12 flex items-center justify-end px-4 shadow-md z-50 border-t border-black/20" style={{ color: '#737475' }}>
        <button 
          onClick={handleExport}
          disabled={isExporting || !activeSpriteNode}
          className="px-6 py-1.5 bg-[#4A4A4A] text-gray-200 text-sm rounded-md hover:bg-[#5A5A5A] border border-gray-900/50 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Exporting...' : t('export')}
        </button>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;