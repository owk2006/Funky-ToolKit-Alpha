import React from 'react';

export interface FileSystemNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FileSystemNode[];
  dataUrl?: string; // For image files
  isPlaceholder?: boolean;

  // For individual image frames
  position?: { x: number; y: number };
  scale?: number;

  // For root sprite folders (export settings)
  dataFormat?: 'xml' | 'json';
  textureName?: string;
  dataFileName?: string;
  exportScale?: number;
  allowTrim?: boolean;
  allowRotation?: boolean;
  padding?: number;
  maxWidth?: number;
  maxHeight?: number;
  powerOfTwo?: boolean;
  
  // For animation folders
  frameRate?: number;
  algorithm?: 'Loop' | 'Once' | 'Ping-Pong';
}

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelSize {
  width: number;
  height: number;
}

export interface PanelState {
  position: PanelPosition;
  size: PanelSize;
  isVisible: boolean;
  zIndex: number;
  isMinimized: boolean;
}

export interface PanelDefinition {
  id:string;
  title: string;
  component: React.FC<any>;
  initialState: PanelState;
}

export interface CanvasView {
  pan: { x: number; y: number };
  zoom: number;
}
