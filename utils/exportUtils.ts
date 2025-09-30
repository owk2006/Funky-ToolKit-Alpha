import { FileSystemNode } from '../types';
import { PackedItem } from './packer';

export function generateXML(
  packedItems: PackedItem[],
  spriteNode: FileSystemNode
): string {
    const imagePath = `${spriteNode.textureName || spriteNode.name}.png`;
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xml += `<TextureAtlas imagePath="${imagePath}">\n`;

    // A sanitizer for XML attribute values.
    const sanitize = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    for (const item of packedItems) {
        // The frame name is typically the filename without the extension.
        const frameName = item.node.name.replace(/\.[^/.]+$/, ""); 
        xml += `\t<SubTexture name="${sanitize(frameName)}" x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}"/>\n`;
    }

    xml += `</TextureAtlas>`;
    return xml;
}


export async function generateSpritesheet(
  packedItems: PackedItem[],
  sheetWidth: number,
  sheetHeight: number
): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = sheetWidth;
    canvas.height = sheetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not create canvas context for spritesheet generation.');
    }

    ctx.clearRect(0, 0, sheetWidth, sheetHeight);

    for (const item of packedItems) {
        ctx.drawImage(item.image, item.x, item.y, item.width, item.height);
    }

    return canvas.toDataURL('image/png');
}

export function downloadFile(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // For blob URLs, revoke the object URL to free up memory.
    if (dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(dataUrl);
    }
}
