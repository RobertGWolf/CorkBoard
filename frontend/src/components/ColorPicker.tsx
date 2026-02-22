import { useCallback, useEffect, useRef, useState } from 'react';

const PRESET_COLORS = [
  { hex: '#FEF3C7', name: 'Yellow' },
  { hex: '#DBEAFE', name: 'Blue' },
  { hex: '#D1FAE5', name: 'Green' },
  { hex: '#FCE7F3', name: 'Pink' },
  { hex: '#EDE9FE', name: 'Purple' },
  { hex: '#FFEDD5', name: 'Orange' },
  { hex: '#FEE2E2', name: 'Red' },
  { hex: '#FFFFFF', name: 'White' },
];

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
}

export function ColorPicker({ currentColor, onColorChange, onClose }: ColorPickerProps) {
  const [customHex, setCustomHex] = useState(currentColor);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePresetClick = useCallback(
    (hex: string) => {
      onColorChange(hex);
      onClose();
    },
    [onColorChange, onClose]
  );

  const handleCustomSubmit = useCallback(() => {
    const hex = customHex.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onColorChange(hex);
      onClose();
    }
  }, [customHex, onColorChange, onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {PRESET_COLORS.map(({ hex, name }) => (
          <button
            key={hex}
            onClick={() => handlePresetClick(hex)}
            title={name}
            className={`w-7 h-7 rounded border-2 transition-transform hover:scale-110 ${
              currentColor.toUpperCase() === hex.toUpperCase()
                ? 'border-amber-500 ring-1 ring-amber-300'
                : 'border-gray-300'
            }`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
      <div className="flex gap-1">
        <input
          ref={inputRef}
          type="text"
          value={customHex}
          onChange={(e) => setCustomHex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCustomSubmit();
          }}
          placeholder="#RRGGBB"
          className="w-20 px-1.5 py-0.5 text-xs border border-gray-300 rounded font-mono"
          maxLength={7}
        />
        <button
          onClick={handleCustomSubmit}
          className="px-2 py-0.5 text-xs bg-amber-100 hover:bg-amber-200 rounded border border-amber-300"
        >
          OK
        </button>
      </div>
    </div>
  );
}
