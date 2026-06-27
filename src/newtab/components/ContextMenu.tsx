import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

// ─── Public API ────────────────────────────────────────────────────────────

export interface MenuItemSpec {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onSelect: () => void;
}
export type MenuEntry = MenuItemSpec | 'separator';

export interface FieldSpec {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  type?: string;
}

interface ConfirmOpts {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}
interface FormOpts {
  title: string;
  fields: FieldSpec[];
  submitLabel?: string;
}

interface OverlayApi {
  openMenu: (e: ReactMouseEvent, items: MenuEntry[]) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
  formDialog: (opts: FormOpts) => Promise<Record<string, string> | null>;
}

const OverlayContext = createContext<OverlayApi | null>(null);

export function useOverlay(): OverlayApi {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlay must be used within <OverlayProvider>');
  return ctx;
}

// ─── Provider ──────────────────────────────────────────────────────────────

interface MenuState {
  x: number;
  y: number;
  items: MenuEntry[];
}
type DialogState =
  | { kind: 'confirm'; opts: ConfirmOpts; resolve: (v: boolean) => void }
  | { kind: 'form'; opts: FormOpts; resolve: (v: Record<string, string> | null) => void };

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const openMenu = useCallback((e: ReactMouseEvent, items: MenuEntry[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOpts) =>
      new Promise<boolean>((resolve) => setDialog({ kind: 'confirm', opts, resolve })),
    [],
  );

  const formDialog = useCallback(
    (opts: FormOpts) =>
      new Promise<Record<string, string> | null>((resolve) =>
        setDialog({ kind: 'form', opts, resolve }),
      ),
    [],
  );

  const closeDialog = useCallback(
    (value: boolean | Record<string, string> | null) => {
      setDialog((d) => {
        if (d) (d.resolve as (v: unknown) => void)(value);
        return null;
      });
    },
    [],
  );

  return (
    <OverlayContext.Provider value={{ openMenu, confirm, formDialog }}>
      {children}
      {menu && <ContextMenu state={menu} onClose={() => setMenu(null)} />}
      {dialog?.kind === 'confirm' && (
        <ConfirmDialog opts={dialog.opts} onResult={closeDialog} />
      )}
      {dialog?.kind === 'form' && <FormDialog opts={dialog.opts} onResult={closeDialog} />}
    </OverlayContext.Provider>
  );
}

// ─── Context menu ──────────────────────────────────────────────────────────

function ContextMenu({ state, onClose }: { state: MenuState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: state.x, top: state.y });

  // Keep the menu inside the viewport.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = state.x;
    let top = state.y;
    if (left + r.width > window.innerWidth - 8) left = window.innerWidth - r.width - 8;
    if (top + r.height > window.innerHeight - 8) top = window.innerHeight - r.height - 8;
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [state.x, state.y]);

  // Close on outside interaction.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', onClose, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="ctx-menu" style={{ left: pos.left, top: pos.top }} role="menu">
      {state.items.map((item, i) =>
        item === 'separator' ? (
          <div key={i} className="ctx-sep" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            className={item.danger ? 'ctx-item ctx-item--danger' : 'ctx-item'}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ),
      )}
    </div>
  );
}

// ─── Dialogs ───────────────────────────────────────────────────────────────

function ConfirmDialog({
  opts,
  onResult,
}: {
  opts: ConfirmOpts;
  onResult: (v: boolean) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResult(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onResult]);

  return (
    <div className="modal-overlay" onMouseDown={() => onResult(false)}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{opts.title}</h2>
        <p className="modal-message">{opts.message}</p>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={() => onResult(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={opts.danger ? 'btn btn--danger' : 'btn btn--primary'}
            autoFocus
            onClick={() => onResult(true)}
          >
            {opts.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormDialog({
  opts,
  onResult,
}: {
  opts: FormOpts;
  onResult: (v: Record<string, string> | null) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(opts.fields.map((f) => [f.name, f.value ?? ''])),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResult(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onResult]);

  return (
    <div className="modal-overlay" onMouseDown={() => onResult(null)}>
      <form
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onResult(values);
        }}
      >
        <h2 className="modal-title">{opts.title}</h2>
        {opts.fields.map((f, i) => (
          <div key={f.name} className="modal-field">
            <label className="modal-label" htmlFor={`field-${f.name}`}>
              {f.label}
            </label>
            <input
              id={`field-${f.name}`}
              className="modal-input"
              type={f.type ?? 'text'}
              placeholder={f.placeholder}
              value={values[f.name]}
              autoFocus={i === 0}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
          </div>
        ))}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={() => onResult(null)}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            {opts.submitLabel ?? 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
