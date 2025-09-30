import { FileSystemNode } from '../types';

export interface PackedItem {
  node: FileSystemNode;
  image: HTMLImageElement;
  width: number;
  height: number;
  x: number;
  y: number;
}

interface PackerOptions {
  padding: number;
  maxWidth: number;
  maxHeight: number;
  powerOfTwo: boolean;
}

const nextPowerOfTwo = (n: number): number => {
    if (n === 0) return 0;
    let p = 1;
    while (p < n) {
        p <<= 1;
    }
    return p;
};

export async function packImages(
  nodes: FileSystemNode[],
  options: PackerOptions
): Promise<{ packedItems: PackedItem[]; sheetWidth: number; sheetHeight: number; }> {
    if (nodes.length === 0) {
        return { packedItems: [], sheetWidth: 0, sheetHeight: 0 };
    }

    const imagePromises = nodes.map(node => new Promise<PackedItem>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({
            node,
            image: img,
            width: img.width,
            height: img.height,
            x: 0,
            y: 0,
        });
        img.onerror = () => reject(new Error(`Failed to load image: ${node.name}`));
        img.src = node.dataUrl!;
    }));

    const itemsToPack = await Promise.all(imagePromises);

    itemsToPack.sort((a, b) => b.height - a.height);

    let sheetWidth = 0;
    let sheetHeight = 0;
    let shelfX = 0;
    let shelfY = 0;
    let shelfHeight = 0;

    for (const item of itemsToPack) {
        const paddedWidth = item.width + options.padding;
        const paddedHeight = item.height + options.padding;

        if (shelfX + paddedWidth > options.maxWidth) {
            shelfY += shelfHeight;
            shelfX = 0;
            shelfHeight = 0;
        }

        item.x = shelfX + options.padding / 2;
        item.y = shelfY + options.padding / 2;

        shelfX += paddedWidth;
        shelfHeight = Math.max(shelfHeight, paddedHeight);
        sheetWidth = Math.max(sheetWidth, shelfX);
        sheetHeight = Math.max(sheetHeight, shelfY + shelfHeight);
    }

    if (options.powerOfTwo) {
        sheetWidth = nextPowerOfTwo(sheetWidth);
        sheetHeight = nextPowerOfTwo(sheetHeight);
    }

    return { packedItems: itemsToPack, sheetWidth, sheetHeight };
}