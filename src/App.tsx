import { useEffect, useRef, useState } from "react";
import {
  Aperture,
  ArrowUpRight,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Crosshair,
  Expand,
  Layers3,
  Maximize,
  MoveUpRight,
  Play,
  Plus,
  RotateCcw,
  ScanLine,
  Search,
  Settings2,
  X,
  Camera,
  Pause,
} from "lucide-react";
import { CameraViewer, type ViewerAPI } from "./components/CameraViewer";
import type { Part } from "./models/camera";
type Info = Omit<Part, "group" | "home" | "offset">;
const categories = [
  "All components",
  "Body",
  "Optics",
  "Image capture",
  "Electronics",
  "Mechanical",
  "Power",
];
const guide = [
  {
    name: "Remove the lens",
    id: "barrel",
    text: "The bayonet mount releases the complete lens assembly. Optical groups are shown separated here to reveal the light path.",
    value: 24,
  },
  {
    name: "Open the housing",
    id: "front",
    text: "The protective shells separate from the magnesium chassis, exposing the optical and electronic systems.",
    value: 45,
  },
  {
    name: "Follow the light",
    id: "mirror",
    text: "The reflex mirror sends light upward to the focusing screen and pentaprism before an exposure.",
    value: 62,
  },
  {
    name: "Meet the shutter",
    id: "shutter",
    text: "The mirror lifts and the shutter curtains travel across the sensor to control exposure time.",
    value: 78,
  },
  {
    name: "Capture the image",
    id: "sensor",
    text: "The CMOS sensor turns light into signals. The processor then transforms that readout into a digital photograph.",
    value: 100,
  },
];
export default function App() {
  const viewer = useRef<ViewerAPI>(null);
  const [parts, setParts] = useState<Info[]>([]),
    [explosion, setExplosion] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [auto, setAuto] = useState(false),
    [xray, setXray] = useState(0),
    [labels, setLabels] = useState(false),
    [connections, setConnections] = useState(false),
    [simple, setSimple] = useState(false),
    [panel, setPanel] = useState(false),
    [about, setAbout] = useState(false),
    [settings, setSettings] = useState(false),
    [help, setHelp] = useState(false),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All components"),
    [view, setView] = useState("Three-quarter"),
    [step, setStep] = useState<number | null>(null),
    [error, setError] = useState(""),
    [presentation, setPresentation] = useState(false);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbout(false);
        setHelp(false);
        setSettings(false);
        setPanel(false);
        setPresentation(false);
        setAuto(false);
        setStep(null);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  useEffect(() => {
    if (!about && !help) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button,a,input,select,[tabindex="0"]',
    );
    focusable?.[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [about, help]);
  const current = parts.find((p) => p.id === selected),
    filtered = parts.filter(
      (p) =>
        (category === "All components" || p.category === category) &&
        p.name.toLowerCase().includes(query.toLowerCase()),
    );
  const choose = (id: string, focus = false) => {
    setSelected(id);
    setPanel(true);
    const part = parts.find((p) => p.id === id);
    if (
      focus &&
      part &&
      ["Electronics", "Image capture", "Power"].includes(part.category) &&
      explosion < 30
    )
      setXray(0.8);
    if (focus) viewer.current?.focus(id);
  };
  const preset = (v: string) => {
    setView(v);
    viewer.current?.view(v);
    if (v === "Internal") {
      setExplosion(75);
      setXray(0.75);
    }
  };
  const reset = () => {
    setExplosion(0);
    setXray(0);
    setSelected(null);
    setAuto(false);
    setLabels(false);
    setConnections(false);
    setStep(null);
    preset("Three-quarter");
  };
  const tour = (n: number) => {
    setStep(n);
    setExplosion(guide[n].value);
    setSelected(guide[n].id);
    setPanel(true);
    viewer.current?.view("Internal");
  };
  const sibling = (delta: number) => {
    const i = parts.findIndex((p) => p.id === selected);
    choose(parts[(i + delta + parts.length) % parts.length].id, true);
  };
  return (
    <main className={presentation ? "app presentation" : "app"}>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            reset();
          }}
        >
          <Aperture size={29} strokeWidth={1.4} />
          <span>
            CAMERA<span className="brand-light">LAB</span>
            <small>AN INTERACTIVE EXPLORATION</small>
          </span>
        </a>
        <nav>
          <button
            className={!panel ? "nav-active" : ""}
            onClick={() => {
              setPanel(false);
              setAbout(false);
            }}
          >
            Explore
          </button>
          <button
            className={panel ? "nav-active" : ""}
            onClick={() => setPanel(!panel)}
          >
            Components <span className="nav-count">{parts.length || "—"}</span>
          </button>
          <button onClick={() => setAbout(true)}>
            About <ArrowUpRight size={12} />
          </button>
        </nav>
        <div className="header-end">
          <span className="online">
            <i /> SYSTEM ONLINE
          </span>
          <button
            className="icon-button"
            aria-label="Open settings"
            onClick={() => setSettings(!settings)}
          >
            <Settings2 size={17} />
          </button>
        </div>
      </header>
      <section className="experience">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="small-line" /> EXPLORE THE EXTRAORDINARY
          </div>
          <h1>
            Inside the
            <br />
            <span>camera.</span>
          </h1>
          <p>
            A closer look at the engineering
            <br />
            behind every photograph.
          </p>
          <div className="hero-meta">
            <span>01 — THE DSLR</span>
            <span>PRECISION, REVEALED.</span>
          </div>
        </div>
        <CameraViewer
          ref={viewer}
          explosion={explosion}
          autoRotate={auto}
          xray={xray}
          selected={selected}
          labels={labels}
          connections={connections}
          simplified={simple}
          onSelect={(id) => choose(id)}
          onReady={setParts}
          onError={setError}
        />
        {parts.length === 0 && !error && (
          <div className="loading">
            <Aperture className="spin" />
            <span>BUILDING THE OPTICAL SYSTEM</span>
          </div>
        )}
        {error && (
          <div className="render-error">
            <ScanLine />
            <h2>Unable to start the 3D view</h2>
            <p>{error}</p>
            <button onClick={() => location.reload()}>Reload experience</button>
          </div>
        )}
        <div className="model-tag">
          <span className="gold-dot" /> DSLR / FULL FRAME{" "}
          <span className="tag-line" />
          <span className="model-sub">24–105 mm · f/4</span>
        </div>
        <div className="right-tools">
          <button
            className="tool"
            aria-label="Reset view"
            title="Reset view"
            onClick={() => preset("Three-quarter")}
          >
            <RotateCcw size={18} />
          </button>
          <button
            className={`tool ${xray ? "active" : ""}`}
            aria-label="Toggle X-ray"
            title="X-ray"
            onClick={() => setXray(xray ? 0 : 0.75)}
          >
            <ScanLine size={19} />
          </button>
          <button
            className={`tool ${labels ? "active" : ""}`}
            aria-label="Toggle labels"
            title="Component labels"
            onClick={() => setLabels(!labels)}
          >
            <Layers3 size={18} />
          </button>
          <span />
          <button
            className="tool"
            aria-label="Capture screenshot"
            title="Capture screenshot"
            onClick={() => viewer.current?.screenshot()}
          >
            <Camera size={18} />
          </button>
          <button
            className={`tool ${presentation ? "active" : ""}`}
            aria-label={
              presentation ? "Exit presentation" : "Presentation mode"
            }
            title="Presentation mode"
            onClick={() => {
              setPresentation(!presentation);
              setAuto(!presentation);
            }}
          >
            <Maximize size={18} />
          </button>
        </div>
        <div className="view-select">
          <span>VIEWPOINT</span>
          <div>
            <Box size={14} />
            <select
              aria-label="Viewing angle"
              value={view}
              onChange={(e) => preset(e.target.value)}
            >
              {[
                "Three-quarter",
                "Front",
                "Back",
                "Left",
                "Right",
                "Top",
                "Bottom",
                "Internal",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <ChevronDown size={12} />
          </div>
        </div>
        <div className="coordinates">
          <span>
            X <b>—</b>
          </span>
          <span>
            Y <b>↑</b>
          </span>
          <span>
            Z <b>↗</b>
          </span>
        </div>
        <div className="scene-caption">
          <span className="caption-number">01 / 03</span>
          <div>
            <strong>A study in precision.</strong>
            <span>{parts.length} components. One remarkable instrument.</span>
          </div>
          <button onClick={() => tour(0)} aria-label="Start guided disassembly">
            <ArrowUpRight size={21} />
          </button>
        </div>
        <div className="interact-hint">
          <span>
            <MoveUpRight size={13} /> DRAG TO ROTATE
          </span>
          <i />
          <span>
            <Plus size={13} /> SCROLL TO ZOOM
          </span>
          <i />
          <span>DOUBLE-CLICK TO FOCUS</span>
        </div>
        {panel && (
          <aside className="inspector">
            <div className="panel-heading">
              <span>THE ANATOMY OF A CAMERA</span>
              <button
                className="icon-button"
                aria-label="Close components"
                onClick={() => setPanel(false)}
              >
                <X size={17} />
              </button>
            </div>
            <h2>
              {current ? "Component insight" : "Explore the components"}
              <span>
                {String(
                  current ? parts.indexOf(current) + 1 : parts.length,
                ).padStart(2, "0")}
              </span>
            </h2>
            <div className="search">
              <Search size={15} />
              <input
                aria-label="Search components"
                placeholder="Find a component…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="category-select"
              aria-label="Component category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {current && (
              <article className="component-detail">
                <div className="detail-symbol">
                  <Aperture size={40} strokeWidth={1} />
                  <span>{current.category.toUpperCase()}</span>
                </div>
                <h3>{current.name}</h3>
                <p>{current.description}</p>
                <h4>HOW IT WORKS</h4>
                <p>{current.detail}</p>
                <h4>CONNECTED TO</h4>
                <p className="connected">{current.connection}</p>
                <div className="detail-actions">
                  <button onClick={() => viewer.current?.focus(current.id)}>
                    <Crosshair size={14} /> Focus component
                  </button>
                  <button
                    aria-label="Previous component"
                    onClick={() => sibling(-1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    aria-label="Next component"
                    onClick={() => sibling(1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setSelected(null);
                    preset("Three-quarter");
                  }}
                >
                  Return to complete camera <ArrowUpRight size={12} />
                </button>
              </article>
            )}
            <div className="component-list">
              {filtered.map((p, i) => (
                <button
                  className={selected === p.id ? "selected" : ""}
                  key={p.id}
                  onClick={() => choose(p.id, true)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    {p.name}
                    <small>{p.category}</small>
                  </div>
                  <ArrowUpRight size={13} />
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="empty">No components match your search.</p>
              )}
            </div>
            <div className="panel-note">
              Illustrative engineering model.
              <br />
              Internal arrangement is not a manufacturer blueprint.
            </div>
          </aside>
        )}
        {step !== null && (
          <div className="guide">
            <div className="guide-title">
              <span>
                GUIDED DISASSEMBLY / {String(step + 1).padStart(2, "0")} OF 05
              </span>
              <button
                aria-label="Close guided disassembly"
                onClick={() => setStep(null)}
              >
                <X size={14} />
              </button>
            </div>
            <h3>{guide[step].name}</h3>
            <p>{guide[step].text}</p>
            <div className="guide-footer">
              <button disabled={step === 0} onClick={() => tour(step - 1)}>
                <ChevronLeft size={14} /> Back
              </button>
              <div>
                {guide.map((_, i) => (
                  <button
                    aria-label={`Go to step ${i + 1}`}
                    className={i === step ? "current" : ""}
                    key={i}
                    onClick={() => tour(i)}
                  />
                ))}
              </div>
              <button
                onClick={() =>
                  step === 4 ? (setStep(null), setExplosion(0)) : tour(step + 1)
                }
              >
                {step === 4 ? "Assemble" : "Next"}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="control-area">
        <div className="control-dock">
          <div className="assembly-status">
            <i className={explosion ? "disassembled" : ""} />
            <div>
              <span>
                {explosion === 0
                  ? "ASSEMBLED"
                  : explosion === 100
                    ? "EXPLODED"
                    : "DISASSEMBLING"}
              </span>
              <small>
                {explosion === 0
                  ? "All systems in place"
                  : `${Math.round(explosion)}% separation`}
              </small>
            </div>
          </div>
          <div className="dock-divider" />
          <button
            className={`explode-button ${explosion ? "engaged" : ""}`}
            onClick={() => setExplosion(explosion === 100 ? 0 : 100)}
          >
            <Expand size={16} /> Explode <span>↗</span>
          </button>
          <button
            className="dock-button"
            onClick={() => {
              setExplosion(0);
              setStep(null);
            }}
          >
            <Box size={16} /> Assemble
          </button>
          <div className="dock-divider" />
          <div className="intensity">
            <div>
              <label htmlFor="intensity">EXPLOSION INTENSITY</label>
              <span>
                {Math.round(explosion)}
                <small>%</small>
              </span>
            </div>
            <input
              id="intensity"
              type="range"
              min="0"
              max="100"
              value={explosion}
              onChange={(e) => setExplosion(+e.target.value)}
              style={{ "--progress": `${explosion}%` } as React.CSSProperties}
            />
            <div className="range-ticks">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
          <div className="dock-divider" />
          <button
            className={`dock-button auto ${auto ? "active" : ""}`}
            onClick={() => setAuto(!auto)}
          >
            {auto ? <Pause size={15} /> : <RotateCcw size={15} />}
            <span>Auto rotate</span>
          </button>
          <button
            className="reset-button"
            aria-label="Reset camera and assembly"
            title="Reset everything"
            onClick={reset}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </section>
      <footer>
        <span>DESIGNED TO BE DISCOVERED.</span>
        <button onClick={() => tour(0)}>
          <Play size={11} /> Take a guided tour <ArrowUpRight size={12} />
        </button>
        <button onClick={() => setHelp(true)}>
          <CircleHelp size={14} /> Controls & shortcuts
        </button>
        <span className="footer-end">
          BUILT FOR THE CURIOUS <span>✳</span>
        </span>
      </footer>
      {settings && (
        <div className="settings-popover">
          <div className="panel-heading">
            VIEW SETTINGS
            <button
              aria-label="Close settings"
              onClick={() => setSettings(false)}
            >
              <X size={15} />
            </button>
          </div>
          <label>
            <span>Engineering labels</span>
            <input
              type="checkbox"
              checked={labels}
              onChange={(e) => setLabels(e.target.checked)}
            />
          </label>
          <label>
            <span>Optical connections</span>
            <input
              type="checkbox"
              checked={connections}
              onChange={(e) => setConnections(e.target.checked)}
            />
          </label>
          <label>
            <span>Simplified rendering</span>
            <input
              type="checkbox"
              checked={simple}
              onChange={(e) => setSimple(e.target.checked)}
            />
          </label>
          <label className="xray-setting">
            <span>Exterior transparency</span>
            <input
              aria-label="Exterior transparency"
              type="range"
              min="0"
              max="1"
              step=".01"
              value={xray}
              onChange={(e) => setXray(+e.target.value)}
            />
          </label>
          <p>
            Labels appear when the camera is separated. Reduced-motion
            preferences are respected.
          </p>
        </div>
      )}
      {(about || help) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setAbout(false);
            setHelp(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={about ? "About Camera Lab" : "Interaction controls"}
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Close dialog"
              onClick={() => {
                setAbout(false);
                setHelp(false);
              }}
            >
              <X size={20} />
            </button>
            <Aperture size={30} strokeWidth={1} />
            <div className="eyebrow">CAMERA LAB / FIELD NOTES</div>
            <h2>
              {about
                ? "Extraordinary, inside out."
                : "Make it your perspective."}
            </h2>
            {about ? (
              <>
                <p>
                  Every photograph begins with an extraordinary collaboration of
                  optics, mechanics and electronics. CAMERA LAB makes that
                  hidden engineering visible.
                </p>
                <p>
                  This is an interactive procedural DSLR inspired by
                  professional full-frame cameras. Its internal arrangement and
                  component shapes are educational representations, not exact
                  Canon specifications or a repair guide.
                </p>
                <div className="modal-stats">
                  <span>
                    <b>{parts.length}</b>SELECTABLE ASSEMBLIES
                  </span>
                  <span>
                    <b>360°</b>EVERY PERSPECTIVE
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="help-row">
                  <span>Orbit</span>
                  <b>Drag / one finger</b>
                </div>
                <div className="help-row">
                  <span>Zoom</span>
                  <b>Scroll / pinch</b>
                </div>
                <div className="help-row">
                  <span>Pan</span>
                  <b>Right-drag / two fingers</b>
                </div>
                <div className="help-row">
                  <span>Inspect</span>
                  <b>Click a part</b>
                </div>
                <div className="help-row">
                  <span>Focus</span>
                  <b>Double-click a part</b>
                </div>
                <p>
                  Use the component browser for keyboard-accessible selection
                  and the viewpoint menu to explore every angle.
                </p>
              </>
            )}
            <button
              className="modal-cta"
              onClick={() => {
                setAbout(false);
                setHelp(false);
              }}
            >
              Back to exploring <ArrowUpRight size={15} />
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
