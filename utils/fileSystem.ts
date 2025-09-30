import { FileSystemNode } from '../types';

export const findNode = (nodes: FileSystemNode[], id: string): FileSystemNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const findParent = (nodes: FileSystemNode[], childId: string): FileSystemNode | null => {
    for (const node of nodes) {
        if (node.children?.some(child => child.id === childId)) {
            return node;
        }
        if (node.children) {
            const parent = findParent(node.children, childId);
            if (parent) return parent;
        }
    }
    return null;
};
