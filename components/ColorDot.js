'use client';

const OPTIONS = ['none', 'green', 'yellow', 'red'];
const DOT_CLASS = {
  none: 'bg-base-border',
  green: 'bg-tag-green',
  yellow: 'bg-tag-yellow',
  red: 'bg-tag-red',
};

export default function ColorDot({ color, onChange }) {
  function cycle() {
    const idx = OPTIONS.indexOf(color);
    onChange(OPTIONS[(idx + 1) % OPTIONS.length]);
  }

  return (
    <button
      onClick={cycle}
      title={`Tag: ${color} (click to cycle)`}
      className={`h-3 w-3 shrink-0 rounded-full ${DOT_CLASS[color] || DOT_CLASS.none} ring-1 ring-black/30`}
    />
  );
}
