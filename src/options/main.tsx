import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useSettings } from '../newtab/hooks/useSettings';
import type { ColumnSetting, Density } from '../newtab/lib/settings';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import '../newtab/styles/tokens.css';
import './options.css';

// The Splay fan mark, reproduced from the canonical geometry in
// scripts/gen-icons.mjs: five 11×40 full-pill bars sharing one bottom-center
// pivot in a 60×52 box, fanned -34° → +34° and listed left→right so each blade
// stacks above the one to its left.
const FAN_BLADES = [
  { angle: -34, color: '#8e9fe0' }, // indigo
  { angle: -17, color: '#5fc8c4' }, // teal
  { angle: 0, color: '#e090b4' }, // plum
  { angle: 17, color: '#e0b06f' }, // clay
  { angle: 34, color: '#b39ae0' }, // violet
];

function FanMark() {
  return (
    <svg viewBox="0 0 60 52" role="img" aria-label="Splay logo">
      <defs>
        <filter id="fan-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.6" floodColor="#2e2a33" floodOpacity="0.16" />
        </filter>
      </defs>
      <g filter="url(#fan-shadow)">
        {FAN_BLADES.map((blade) => (
          <rect
            key={blade.angle}
            x={24.5}
            y={6}
            width={11}
            height={40}
            rx={5.5}
            fill={blade.color}
            transform={`rotate(${blade.angle} 30 46)`}
          />
        ))}
      </g>
    </svg>
  );
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented" role="group">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={opt.value === value ? 'segment segment--active' : 'segment'}
          aria-pressed={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="toggle-row">
      <span className="toggle-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={checked ? 'switch switch--on' : 'switch'}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-knob" />
      </button>
    </label>
  );
}

function Options() {
  const { settings, update } = useSettings();

  return (
    <div className="opt-page">
      <div className="opt-card">
        <div className="opt-head">
          <div className="opt-logo">
            <FanMark />
          </div>
          <div>
            <h1 className="opt-title">Splay</h1>
            <p className="opt-tagline">Your bookmarks, splayed into a full-screen directory.</p>
          </div>
        </div>

        <section className="opt-section">
          <h2 className="opt-section-title">Layout</h2>

          <div className="opt-control">
            <div className="opt-control-label">
              <span>Page columns</span>
              <span className="opt-control-hint">Category cards across the page. Auto adapts to width.</span>
            </div>
            <Segmented<ColumnSetting>
              value={settings.columns}
              onChange={(columns) => update({ columns })}
              options={[
                { label: 'Auto', value: 0 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
                { label: '4', value: 4 },
              ]}
            />
          </div>

          <div className="opt-control">
            <div className="opt-control-label">
              <span>Links per card</span>
              <span className="opt-control-hint">Link columns inside each card. Auto fills the width.</span>
            </div>
            <Segmented<ColumnSetting>
              value={settings.cardColumns}
              onChange={(cardColumns) => update({ cardColumns })}
              options={[
                { label: 'Auto', value: 0 },
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
              ]}
            />
          </div>

          <div className="opt-control">
            <div className="opt-control-label">
              <span>Density</span>
              <span className="opt-control-hint">Text size across the directory.</span>
            </div>
            <Segmented<Density>
              value={settings.density}
              onChange={(density) => update({ density })}
              options={[
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ]}
            />
          </div>
        </section>

        <section className="opt-section">
          <h2 className="opt-section-title">Sections</h2>
          <Toggle
            label="Show Bookmarks Bar (pinned strip)"
            checked={settings.showPinned}
            onChange={(showPinned) => update({ showPinned })}
          />
          <Toggle
            label="Show Other Bookmarks"
            checked={settings.showOther}
            onChange={(showOther) => update({ showOther })}
          />
          <Toggle
            label="Show Mobile Bookmarks"
            checked={settings.showMobile}
            onChange={(showMobile) => update({ showMobile })}
          />
        </section>

        <p className="opt-note">
          Changes save automatically and apply to every new tab. Splay keeps everything local — no
          accounts, no network requests, no analytics.
        </p>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('Splay options: #root element not found');

createRoot(container).render(
  <StrictMode>
    <Options />
  </StrictMode>,
);
