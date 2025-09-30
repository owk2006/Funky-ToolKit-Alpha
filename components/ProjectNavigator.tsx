import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FileSystemNode } from '../types';
import { FolderIcon, FileIcon, ChevronRightIcon, UpTriangleIcon, DownTriangleIcon, StarIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { findNode, findParent } from '../utils/fileSystem';

declare global {
  namespace React {
      interface InputHTMLAttributes<T> {
          webkitdirectory?: string;
          directory?: string;
      }
  }
}

// --- Start of Helpers ---

const recursiveUpdate = (nodes: FileSystemNode[], updateFn: (node: FileSystemNode) => FileSystemNode): FileSystemNode[] => {
    return nodes.map(node => {
        let newNode = updateFn(node);
        if (newNode.children) {
            newNode = { ...newNode, children: recursiveUpdate(newNode.children, updateFn) };
        }
        return newNode;
    });
};

const recursiveDelete = (nodes: FileSystemNode[], targetId: string): FileSystemNode[] => {
    const newNodes = [];
    for (const node of nodes) {
        if (node.id === targetId) {
            continue;
        }
        const newNode = { ...node };
        if (newNode.children) {
            newNode.children = recursiveDelete(newNode.children, targetId);
        }
        newNodes.push(newNode);
    }
    return newNodes;
}

// --- End of Helpers ---

const FileSystemTree: React.FC<{ 
    nodes: FileSystemNode[]; 
    level: number; 
    selected: string | null; 
    onSelect: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onPlaceholderClick: (id: string) => void;
    onReorder: (nodeId: string, direction: 'up' | 'down') => void;
    onToggleExpand: (id: string) => void;
    expanded: Record<string, boolean>;
}> = ({ nodes, level, selected, onSelect, onRename, onPlaceholderClick, onReorder, onToggleExpand, expanded }) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { t } = useLanguage();

  const handleRenameStart = (node: FileSystemNode) => {
    if (node.isPlaceholder) return;
    setRenamingId(node.id);
    setRenameValue(node.name);
  };

  const handleRenameConfirm = () => {
      if (renamingId) {
          onRename(renamingId, renameValue);
          setRenamingId(null);
      }
  };
  
  const handleNodeClick = (node: FileSystemNode) => {
      if (node.isPlaceholder) {
          onPlaceholderClick(node.id);
      } else {
          if (node.type === 'folder' && selected === node.id) {
            onToggleExpand(node.id);
          }
          onSelect(node.id);
      }
  };

  return (
    <div>
      {nodes.map(node => {
        const isImageFile = node.type === 'file' && node.dataUrl;
        return (
            <div key={node.id}>
            <div
                className={`flex items-center p-1 rounded-md cursor-pointer ${selected === node.id ? 'bg-[#00AEEF] text-white' : 'hover:bg-[#4A4A4A]'}`}
                style={{ paddingLeft: `${level * 16 + 4}px` }}
                onClick={() => handleNodeClick(node)}
                onDoubleClick={() => handleRenameStart(node)}
            >
                {node.type === 'folder' && !node.isPlaceholder && (
                  <ChevronRightIcon
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(node.id);
                    }}
                    className={`w-4 h-4 mr-1 transition-transform flex-shrink-0 ${expanded[node.id] ? 'rotate-90' : ''}`} />
                )}
                <div className="flex-shrink-0">
                    {level === 0 ? <StarIcon className="w-5 h-5 mr-2 text-yellow-400" /> :
                     node.type === 'folder' ? <FolderIcon className="w-5 h-5 mr-2" /> : 
                     <FileIcon className={`w-5 h-5 mr-2 ${level > 0 && (node.children ? '' : 'ml-5')}`} />}
                </div>
                <div className="flex-1 min-w-0">
                    {renamingId === node.id ? (
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleRenameConfirm}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameConfirm(); if(e.key === 'Escape') setRenamingId(null); }}
                            className="bg-[#555] text-white text-sm w-full outline-none"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className={`text-sm truncate ${node.isPlaceholder ? 'text-red-500 animate-pulse-red-text' : ''}`}>{node.isPlaceholder ? t('noFileSelect') : node.name}</span>
                    )}
                </div>
                 {selected === node.id && isImageFile && (
                    <div className="flex flex-col ml-1">
                        <button onClick={(e) => { e.stopPropagation(); onReorder(node.id, 'up'); }} className="text-gray-300 hover:text-white h-2 w-3 flex items-center justify-center"><UpTriangleIcon className="w-2 h-2" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onReorder(node.id, 'down'); }} className="text-gray-300 hover:text-white h-2 w-3 flex items-center justify-center"><DownTriangleIcon className="w-2 h-2" /></button>
                    </div>
                )}
            </div>
            {node.type === 'folder' && expanded[node.id] && node.children && (
                <FileSystemTree nodes={node.children} level={level + 1} selected={selected} onSelect={onSelect} onRename={onRename} onPlaceholderClick={onPlaceholderClick} onReorder={onReorder} onToggleExpand={onToggleExpand} expanded={expanded}/>
            )}
            </div>
        )
      })}
    </div>
  );
};

interface ProjectNavigatorProps {
    fileSystem: FileSystemNode[];
    selectedNodeId: string | null;
    onSelectNode: (id: string | null) => void;
    onFileSystemUpdate: (nodes: FileSystemNode[]) => void;
    onReorderImages: (folderId: string, oldIndex: number, newIndex: number) => void;
    onAddRootSprite: (name: string) => void;
    onUpdateNodeProperties: (id: string, properties: Partial<FileSystemNode>) => void;
}

const ProjectNavigator: React.FC<ProjectNavigatorProps> = ({ fileSystem, selectedNodeId, onSelectNode, onFileSystemUpdate, onReorderImages, onAddRootSprite, onUpdateNodeProperties }) => {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const directoryInputRef = useRef<HTMLInputElement>(null);
    const [isAddMenuSticky, setIsAddMenuSticky] = useState(false);
    const [isAddMenuHovered, setIsAddMenuHovered] = useState(false);
    const addMenuRef = useRef<HTMLDivElement>(null);
    const [placeholderIdToUpdate, setPlaceholderIdToUpdate] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    const selectedNode = useMemo(() => selectedNodeId ? findNode(fileSystem, selectedNodeId) : null, [selectedNodeId, fileSystem]);
    const parentOfSelected = useMemo(() => selectedNodeId ? findParent(fileSystem, selectedNodeId) : null, [selectedNodeId, fileSystem]);
    
    const isSelectedNodeRoot = selectedNode && !parentOfSelected;
    const canAddAnimation = isSelectedNodeRoot;
    const canAddImage = selectedNode?.type === 'folder' && parentOfSelected && !findParent(fileSystem, parentOfSelected.id);

    const toggleFolderExpansion = (folderId: string) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    useEffect(() => {
        fileSystem.forEach(node => {
            if (node.type === 'folder' && expandedFolders[node.id] === undefined) {
                setExpandedFolders(prev => ({...prev, [node.id]: true}));
            }
        })
    }, [fileSystem]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setIsAddMenuSticky(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddImage = () => {
        if (!canAddImage) return;
        setIsAddMenuSticky(false);
        setIsAddMenuHovered(false);
        fileInputRef.current?.click();
    };
    
    const handleAddAnimation = () => {
        if (!canAddAnimation || !selectedNodeId) return;
        setIsAddMenuSticky(false);
        setIsAddMenuHovered(false);
        const newFolder: FileSystemNode = {
            id: `folder_${Date.now()}`,
            name: t('noFileSelect'),
            type: 'folder',
            children: [],
            isPlaceholder: true,
            frameRate: 24,
            algorithm: 'Loop',
        };
        const newFS = recursiveUpdate(fileSystem, node => {
            if (node.id === selectedNodeId) {
                return { ...node, children: [...(node.children ?? []), newFolder] };
            }
            return node;
        });
        onFileSystemUpdate(newFS);
    };
    
    const handleAddNewSprite = () => {
        setIsAddMenuSticky(false);
        setIsAddMenuHovered(false);
        onAddRootSprite(t('newSprite'));
    };
    
    const handlePlaceholderClick = (id: string) => {
        setPlaceholderIdToUpdate(id);
        directoryInputRef.current?.click();
    };

    const handleDelete = () => {
        if (!selectedNodeId) return;

        const isRoot = fileSystem.some(node => node.id === selectedNodeId);
        if (isRoot && fileSystem.length === 1) {
            alert("Cannot delete the last sprite.");
            return;
        }

        const newFS = recursiveDelete(fileSystem, selectedNodeId);
        onFileSystemUpdate(newFS);
        onSelectNode(null);
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, isDirectory: boolean) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
    
        const readFileAsDataURL = (file: File): Promise<string> => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    
        const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        
        if (isDirectory) {
            const placeholderToUpdateId = placeholderIdToUpdate;
            setPlaceholderIdToUpdate(null);
            if (!placeholderToUpdateId) return;

            const fileList = Array.from(files) as (File & { webkitRelativePath: string })[];
            const imageFiles = fileList.filter(f => f.type && allowedImageTypes.includes(f.type));

            if (imageFiles.length === 0) {
                alert('No valid images found in the selected folder(s).');
                if (event.currentTarget) event.currentTarget.value = '';
                return;
            }

            const folders = new Map<string, File[]>();
            const hasSubdirectories = imageFiles.some(file => file.webkitRelativePath.split('/').length > 2);

            if (hasSubdirectories) {
                for (const file of imageFiles) {
                    const pathParts = file.webkitRelativePath.split('/');
                    if (pathParts.length > 2) {
                        const subDirName = pathParts[pathParts.length - 2];
                        if (!folders.has(subDirName)) folders.set(subDirName, []);
                        folders.get(subDirName)!.push(file);
                    }
                }
            } else {
                const dirName = imageFiles[0].webkitRelativePath.split('/')[0];
                folders.set(dirName, imageFiles);
            }

            const newAnimationFolders: FileSystemNode[] = [];
            for (const [dirName, dirFiles] of folders.entries()) {
                const newFileNodesPromises = dirFiles.map(async (file, index) => {
                    const dataUrl = await readFileAsDataURL(file);
                    return {
                        id: `file_${file.name}_${Date.now() + index}`,
                        name: file.name,
                        type: 'file',
                        dataUrl,
                        position: { x: 0, y: 0 },
                        scale: 1,
                    } as FileSystemNode;
                });
                const newFileNodes = (await Promise.all(newFileNodesPromises)).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
                
                const newFolderId = `folder_${dirName}_${Date.now()}`;
                newAnimationFolders.push({
                    id: newFolderId,
                    name: dirName,
                    type: 'folder',
                    children: newFileNodes,
                    frameRate: 24,
                    algorithm: 'Loop',
                });
                setExpandedFolders(prev => ({...prev, [newFolderId]: true}));
            }
            
            const newFS = recursiveUpdate(fileSystem, node => {
                if (node.children) {
                    const placeholderIndex = node.children.findIndex(child => child.id === placeholderToUpdateId);
                    if (placeholderIndex !== -1) {
                        const newChildren = [...node.children];
                        newChildren.splice(placeholderIndex, 1, ...newAnimationFolders);
                        return { ...node, children: newChildren };
                    }
                }
                return node;
            });
            onFileSystemUpdate(newFS);
        } else { // Single file addition
            try {
                const newFileNodesPromises = (Array.from(files) as File[])
                    .filter(file => file.type && allowedImageTypes.includes(file.type))
                    .map(async (file, index) => {
                        const dataUrl = await readFileAsDataURL(file);
                        return {
                            id: `file_${file.name}_${Date.now() + index}`,
                            name: file.name,
                            type: 'file',
                            dataUrl,
                            position: { x: 0, y: 0 },
                            scale: 1,
                        } as FileSystemNode;
                });
                const newFileNodes = (await Promise.all(newFileNodesPromises)).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));

                if (newFileNodes.length > 0 && canAddImage && selectedNodeId) {
                    const newFS = recursiveUpdate(fileSystem, node => {
                        if (node.id === selectedNodeId) {
                            const existingChildren = node.children ?? [];
                            const combined = [...existingChildren, ...newFileNodes].sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
                            return { ...node, children: combined };
                        }
                        return node;
                    });
                    onFileSystemUpdate(newFS);
                }
            } catch (err) {
                console.error("Error reading files:", err);
            }
        }

        if (event.currentTarget) event.currentTarget.value = '';
    };

    const handleReorder = (nodeId: string, direction: 'up' | 'down') => {
        const parent = findParent(fileSystem, nodeId);
        if (!parent || !parent.children) return;
        const currentIndex = parent.children.findIndex(child => child.id === nodeId);
        if (currentIndex === -1) return;
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        onReorderImages(parent.id, currentIndex, newIndex);
    };

    const handleRenameNode = (id: string, newName: string) => {
      if(newName.trim()) {
        onUpdateNodeProperties(id, { name: newName });
      }
    }

  return (
    <div className="h-full flex flex-col bg-[#333333] text-gray-300">
      <div className="p-2 border-b border-gray-900/50">
        <div className="flex space-x-2">
           <div 
             className="relative flex-1" 
             ref={addMenuRef}
             onMouseEnter={() => setIsAddMenuHovered(true)}
             onMouseLeave={() => setIsAddMenuHovered(false)}
            >
             <button 
                onClick={() => setIsAddMenuSticky(p => !p)} 
                className="w-full text-sm bg-[#4A4A4A] hover:bg-[#5A5A5A] px-2 py-1 rounded-md transition-colors"
                style={{ color: (isAddMenuHovered || isAddMenuSticky) ? '#FFFFFF' : '#E0E0E0' }}
             >
                {t('add')}
             </button>
             {(isAddMenuHovered || isAddMenuSticky) && (
                <div className="absolute top-full left-0 w-full bg-[#2D2D2D] border border-gray-900/50 rounded-md shadow-lg z-10">
                    <button onClick={handleAddImage} disabled={!canAddImage} className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#00AEEF] hover:text-white disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed">{t('addImage')}</button>
                    <button onClick={handleAddAnimation} disabled={!canAddAnimation} className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#00AEEF] hover:text-white disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed">{t('addFile')}</button>
                    <button onClick={handleAddNewSprite} className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#00AEEF] hover:text-white">{t('newSprite')}</button>
                </div>
             )}
           </div>
          <button 
            onClick={handleDelete} 
            className="flex-1 text-sm bg-[#4A4A4A] hover:bg-[#5A5A5A] px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedNodeId}
          >
            {t('delete')}
          </button>
        </div>
      </div>
      <div className="p-2 flex-grow overflow-y-auto">
        {fileSystem.length > 0 ? (
          <FileSystemTree 
            nodes={fileSystem} 
            level={0} 
            selected={selectedNodeId} 
            onSelect={onSelectNode} 
            onRename={handleRenameNode} 
            onPlaceholderClick={handlePlaceholderClick} 
            onReorder={handleReorder}
            onToggleExpand={toggleFolderExpansion}
            expanded={expandedFolders}
          />
        ) : (
          <div className="text-center text-xs text-gray-500 pt-4">{t('projectEmpty')}</div>
        )}
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg, image/gif, image/webp" multiple onChange={(e) => handleFileChange(e, false)} />
      <input type="file" ref={directoryInputRef} className="hidden" webkitdirectory="" directory="" multiple onChange={(e) => handleFileChange(e, true)} />
    </div>
  );
};

export default ProjectNavigator;