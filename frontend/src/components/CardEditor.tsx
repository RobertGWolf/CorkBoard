import { useEffect, useRef } from 'react';

interface CardEditorProps {
  content: string;
  onSave: (content: string) => void;
}

export function CardEditor({ content, onSave }: CardEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.selectionStart = el.value.length;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onSave(textareaRef.current?.value ?? content);
    }
  };

  const handleBlur = () => {
    onSave(textareaRef.current?.value ?? content);
  };

  return (
    <textarea
      ref={textareaRef}
      defaultValue={content}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="w-full h-full resize-none border-none outline-none bg-transparent p-2 text-sm text-gray-800"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}
