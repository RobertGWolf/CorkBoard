interface ResizeHandleProps {
  onResizeStart: (e: React.PointerEvent) => void;
}

export function ResizeHandle({ onResizeStart }: ResizeHandleProps) {
  return (
    <div
      className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10 group"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onResizeStart(e);
      }}
    >
      {/* Resize grip icon — three diagonal lines */}
      <svg
        className="w-3 h-3 absolute bottom-0.5 right-0.5 text-gray-400 group-hover:text-gray-600 transition-colors"
        viewBox="0 0 10 10"
        fill="none"
      >
        <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" />
        <line x1="9" y1="4" x2="4" y2="9" stroke="currentColor" strokeWidth="1.5" />
        <line x1="9" y1="7" x2="7" y2="9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
