import React, { useState, useEffect } from 'react';
import { FileSystemNode } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const useBufferedInput = (initialValue: string | number, onUpdate: (value: any) => void) => {
    const [buffer, setBuffer] = useState(String(initialValue));

    useEffect(() => {
        setBuffer(String(initialValue));
    }, [initialValue]);

    const handleBlur = () => {
        const numValue = Number(buffer);
        if (String(initialValue) !== buffer) {
            if (!isNaN(numValue)) {
                onUpdate(numValue);
            } else {
                onUpdate(buffer);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBuffer(e.target.value);
    };

    return { value: buffer, onChange: handleChange, onBlur: handleBlur };
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 border-b border-gray-500/50 pb-1">{title}</h3>
        {children}
    </div>
);

const InputField: React.FC<{ label: string, type?: string, value: string | number | boolean, onChange: (val: any) => void, onBlur?: () => void, options?: {value: string, label: string}[], disabled?: boolean }> = ({ label, type = "text", value, onChange, onBlur, options, disabled = false }) => (
    <div className="grid grid-cols-3 items-center gap-2 mb-2">
        <label className="text-xs text-gray-400 col-span-1 truncate">{label}</label>
        {options ? (
             <select value={String(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="col-span-2 bg-[#2A2A2A] border border-gray-900/50 rounded-md p-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#00AEEF] disabled:opacity-50">
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
             </select>
        ) : type === 'checkbox' ? (
             <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="col-span-2 justify-self-start bg-[#2A2A2A] border-gray-900/50 rounded-sm disabled:opacity-50" />
        ) : (
            <input type={type} value={value as string | number} onChange={onChange} onBlur={onBlur} disabled={disabled} className="col-span-2 bg-[#2A2A2A] border border-gray-900/50 rounded-md p-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#00AEEF] disabled:opacity-50" />
        )}
    </div>
);


interface PropertiesPanelProps {
    selectedNode: FileSystemNode | null;
    activeSpriteNode: FileSystemNode | null;
    onUpdateNodeProperties: (id: string, properties: Partial<FileSystemNode>) => void;
    isAnimationFolderSelected: boolean;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedNode, activeSpriteNode, onUpdateNodeProperties, isAnimationFolderSelected }) => {
    const { t } = useLanguage();

    const textureNameInput = useBufferedInput(
        activeSpriteNode?.textureName ?? activeSpriteNode?.name ?? '',
        (val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { textureName: val })
    );
    const dataFileInput = useBufferedInput(
        activeSpriteNode?.dataFileName ?? activeSpriteNode?.name ?? '',
        (val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { dataFileName: val })
    );
    const scaleInput = useBufferedInput(
        activeSpriteNode?.exportScale ?? 1,
        (val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { exportScale: Math.max(0.1, val) })
    );
    const paddingInput = useBufferedInput(
        activeSpriteNode?.padding ?? 2,
        (val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { padding: Math.max(0, val) })
    );
    const maxWidthInput = useBufferedInput(
        activeSpriteNode?.maxWidth ?? 4096,
        (val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { maxWidth: Math.max(64, val) })
    );
    const maxHeightInput = useBufferedInput(
        activeSpriteNode?.maxHeight ?? 4096,
        (val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { maxHeight: Math.max(64, val) })
    );

    const animationNameInput = useBufferedInput(
        isAnimationFolderSelected && selectedNode ? selectedNode.name : '',
        (val) => isAnimationFolderSelected && selectedNode && onUpdateNodeProperties(selectedNode.id, { name: val })
    );
    const frameRateInput = useBufferedInput(
        isAnimationFolderSelected && selectedNode ? selectedNode.frameRate ?? 24 : 24,
        (val) => isAnimationFolderSelected && selectedNode && onUpdateNodeProperties(selectedNode.id, { frameRate: Math.max(1, val) })
    );
    
    return (
        <div className="p-3 text-gray-300 bg-[#333333] h-full overflow-y-auto">
            <Section title={t('texture')}>
                <InputField 
                    label={t('dataFormat')}
                    value={activeSpriteNode?.dataFormat ?? 'xml'}
                    onChange={(val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { dataFormat: val })}
                    options={[{value: 'xml', label: 'FNF (XML)'}, {value: 'json', label: 'JSON'}]}
                    disabled={!activeSpriteNode}
                />
                <InputField 
                    label={t('textureName')}
                    value={textureNameInput.value} 
                    onChange={textureNameInput.onChange}
                    onBlur={textureNameInput.onBlur}
                    disabled={!activeSpriteNode}
                />
                <InputField 
                    label={t('dataFile')} 
                    value={dataFileInput.value}
                    onChange={dataFileInput.onChange}
                    onBlur={dataFileInput.onBlur}
                    disabled={!activeSpriteNode}
                />
                <InputField 
                    label={t('scale')} 
                    type="number" 
                    value={scaleInput.value}
                    onChange={scaleInput.onChange}
                    onBlur={scaleInput.onBlur}
                    disabled={!activeSpriteNode} 
                />
            </Section>
            
            <Section title={t('packing')}>
                <InputField 
                    label={t('allowTrim')}
                    type="checkbox"
                    value={activeSpriteNode?.allowTrim ?? true}
                    onChange={(val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { allowTrim: val })}
                    disabled={!activeSpriteNode}
                />
                <InputField 
                    label={t('allowRotation')} 
                    type="checkbox"
                    value={activeSpriteNode?.allowRotation ?? true}
                    onChange={(val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { allowRotation: val })}
                    disabled={!activeSpriteNode}
                />
                <InputField 
                    label={t('padding')} 
                    type="number"
                    value={paddingInput.value}
                    onChange={paddingInput.onChange}
                    onBlur={paddingInput.onBlur}
                    disabled={!activeSpriteNode}
                />
                <InputField 
                    label={t('maxWidth')} 
                    type="number"
                    value={maxWidthInput.value}
                    onChange={maxWidthInput.onChange}
                    onBlur={maxWidthInput.onBlur}
                    disabled={!activeSpriteNode}
                />
                <InputField 
                    label={t('maxHeight')} 
                    type="number"
                    value={maxHeightInput.value}
                    onChange={maxHeightInput.onChange}
                    onBlur={maxHeightInput.onBlur}
                    disabled={!activeSpriteNode}
                />
                <InputField 
                    label={t('powerOfTwo')} 
                    type="checkbox"
                    value={activeSpriteNode?.powerOfTwo ?? true}
                    onChange={(val) => activeSpriteNode && onUpdateNodeProperties(activeSpriteNode.id, { powerOfTwo: val })}
                    disabled={!activeSpriteNode}
                />
            </Section>

            <Section title={t('animation')}>
                <InputField 
                    label={t('currentAnim')}
                    value={animationNameInput.value} 
                    onChange={animationNameInput.onChange}
                    onBlur={animationNameInput.onBlur}
                    disabled={!isAnimationFolderSelected}
                />
                <InputField 
                    label={t('frameRate')}
                    type="number"
                    value={frameRateInput.value}
                    onChange={frameRateInput.onChange}
                    onBlur={frameRateInput.onBlur}
                    disabled={!isAnimationFolderSelected}
                />
                <InputField 
                    label={t('algorithm')} 
                    value={isAnimationFolderSelected && selectedNode ? selectedNode.algorithm ?? 'Loop' : 'Loop'}
                    onChange={(val) => isAnimationFolderSelected && selectedNode && onUpdateNodeProperties(selectedNode.id, { algorithm: val })}
                    options={[{value: 'Loop', label: 'Loop'}, {value: 'Once', label: 'Once'}, {value: 'Ping-Pong', label: 'Ping-Pong'}]}
                    disabled={!isAnimationFolderSelected}
                />
            </Section>
        </div>
    );
};

export default PropertiesPanel;
