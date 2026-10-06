import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Bookmark,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Code2,
  Coffee,
  Database,
  Download,
  Flame,
  Layers,
  LayoutDashboard,
  ListChecks,
  Network,
  Play,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Upload,
  X,
  Activity,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import {
  shuffle,
  grade,
  prepare,
  validateProgress,
  mergeProgress,
  recordResult,
} from "./engine.mjs";
import "./style.css";

type Category = {
  id: number;
  name: string;
  label: string;
  description: string;
};
type Source = {
  id: string;
  title: string;
  body: string;
  category: number;
  year: number;
  line: number;
  section: string;
  supplement: boolean;
  priority: boolean;
  caution: string;
  years: number[];
  searchTitles: string;
  references: Source[];
};
type Question = {
  id: string;
  type: "single" | "multi" | "order" | "match";
  category: number;
  sourceIds: string[];
  track: string;
  prompt: string;
  options: any[];
  answer: number[];
  explanation: string;
  passage?: string;
};
type RecordData = {
  attempts: number;
  correct: number;
  lastCorrect: boolean;
  lastAt: string;
};
type Progress = {
  version: number;
  records: Record<string, RecordData>;
  bookmarks: string[];
};
type Item = {
  id: string;
  order: number[];
  right: number[];
  response: number[];
  result: boolean | null;
};
type Session = { items: Item[]; index: number; done: boolean; title: string };
type Library = {
  categories: Category[];
  sources: Source[];
  recognition: Question[];
  legacyRecognition: Question[];
  aliases: Record<string, string>;
  revision: number;
};
const STORE = "mockbook-v1";
const EMPTY: Progress = { version: 1, records: {}, bookmarks: [] };
const typeNames = {
  single: "Single choice",
  multi: "Multiple choice",
  order: "Ordering",
  match: "Matching",
};
const icons = [Code2, Coffee, Database, Network, Server, Activity];
const cleanTitle = (s: string) =>
  s
    .replace(/[★🟠🟤]/gu, "")
    .replace(/`/g, "")
    .trim();
function Markdown({ text }: { text: string }) {
  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(
          marked.parse(text, { async: false }) as string,
        ),
      }}
    />
  );
}
function App({
  library,
  questions,
}: {
  library: Library;
  questions: Question[];
}) {
  const allQuestions = [...questions, ...library.recognition];
  const knownQuestions = [...allQuestions, ...library.legacyRecognition];
  const qmap = new Map(knownQuestions.map((q) => [q.id, q]));
  const smap = new Map(library.sources.map((s) => [s.id, s]));
  const validIds = new Set([...qmap.keys(), ...smap.keys()]);
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return { progress: EMPTY, session: null, warning: "" };
      const data = JSON.parse(raw);
      const progress = validateProgress(
        data.progress,
        validIds,
        library.aliases,
      ) as Progress;
      const s = data.bankRevision === library.revision ? data.session : null;
      const validSession =
        s &&
        Array.isArray(s.items) &&
        s.items.length > 0 &&
        Number.isInteger(s.index) &&
        s.index >= 0 &&
        s.index < s.items.length &&
        typeof s.done === "boolean" &&
        typeof s.title === "string" &&
        s.items.every((i: Item) => {
          const q = qmap.get(i.id);
          if (!q) return false;
          const perm = (a: number[]) =>
            Array.isArray(a) &&
            a.length === q.options.length &&
            new Set(a).size === a.length &&
            a.every(
              (v) => Number.isInteger(v) && v >= 0 && v < q.options.length,
            );
          return (
            perm(i.order) &&
            perm(i.right) &&
            Array.isArray(i.response) &&
            i.response.every(
              (v) => Number.isInteger(v) && v >= -1 && v < q.options.length,
            ) &&
            (i.result === null || typeof i.result === "boolean")
          );
        });
      return {
        progress,
        session: validSession ? (s as Session) : null,
        warning:
          data.session && data.bankRevision !== library.revision
            ? "Your library has been consolidated. History and bookmarks were preserved; start a new session to use the updated questions."
            : "",
      };
    } catch {
      return {
        progress: EMPTY,
        session: null,
        warning:
          "Saved data could not be read. You can import a backup from Settings.",
      };
    }
  });
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [session, setSession] = useState<Session | null>(initial.session);
  const [warning, setWarning] = useState(initial.warning);
  const [page, setPage] = useState("dashboard");
  const [cat, setCat] = useState(0);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [track, setTrack] = useState("concept");
  const [count, setCount] = useState("10");
  const [focus, setFocus] = useState<Source | null>(null);
  const [notice, setNotice] = useState("");
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [dragged, setDragged] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem(
        STORE,
        JSON.stringify({ progress, session, bankRevision: library.revision }),
      );
    } catch {
      setWarning(
        "Browser storage is unavailable or full. Export a backup to keep your progress.",
      );
    }
  }, [progress, session]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 4000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => {
    if (focus) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [focus]);
  function navigate(p: string) {
    setPage(p);
    setQuery("");
    setCat(0);
    setYear("all");
    setSelectedLeft(null);
    window.scrollTo(0, 0);
  }
  const records = Object.values(progress.records);
  const attempts = records.reduce((a, r) => a + r.attempts, 0),
    correct = records.reduce((a, r) => a + r.correct, 0);
  const wrong = knownQuestions.filter(
    (q) => progress.records[q.id]?.lastCorrect === false,
  );
  const completed = allQuestions.filter(
    (q) => progress.records[q.id]?.lastCorrect === true,
  ).length;
  function bookmark(id: string) {
    setProgress((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(id)
        ? p.bookmarks.filter((x) => x !== id)
        : [...p.bookmarks, id],
    }));
  }
  function start(pool: Question[], title = "Practice session") {
    if (!pool.length) {
      setNotice("No questions match these filters. Try another selection.");
      return;
    }
    setSession({
      items: pool.map((q) => prepare(q) as Item),
      index: 0,
      done: false,
      title,
    });
    setPage("session");
    setSelectedLeft(null);
    window.scrollTo(0, 0);
  }
  function startFiltered(category = cat) {
    const pool = (track === "concept" ? questions : library.recognition).filter(
      (q) => !category || q.category === category,
    );
    start(
      shuffle(pool).slice(0, count === "all" ? pool.length : Number(count)),
      category ? library.categories[category - 1].label : "Mixed practice",
    );
  }
  function updateItem(change: Partial<Item>) {
    setSession((s) =>
      s
        ? {
            ...s,
            items: s.items.map((v, i) =>
              i === s.index ? { ...v, ...change } : v,
            ),
          }
        : s,
    );
  }
  function submit(response?: number[]) {
    if (!session) return;
    const i = session.items[session.index];
    if (i.result !== null) return;
    const q = qmap.get(i.id)!;
    const r = response ?? i.response;
    const ok = grade(q, r);
    updateItem({ response: r, result: ok });
    setProgress((p) => recordResult(p, q.id, ok) as Progress);
    setSelectedLeft(null);
  }
  function next() {
    if (!session) return;
    if (session.index === session.items.length - 1)
      setSession({ ...session, done: true });
    else setSession({ ...session, index: session.index + 1 });
    setSelectedLeft(null);
    window.scrollTo(0, 0);
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mockbook-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function importData(file?: File) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error("Backup file is too large.");
      const incoming = validateProgress(
        JSON.parse(await file.text()),
        validIds,
        library.aliases,
      ) as Progress;
      setProgress((p) => mergeProgress(p, incoming) as Progress);
      setNotice(
        "Backup imported. Newer records and bookmarks have been merged.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to read this backup.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  const learnedSources = new Set(
    knownQuestions
      .filter((q) => progress.records[q.id]?.lastCorrect)
      .flatMap((q) => q.sourceIds),
  );
  const sourceCount = library.sources.length;
  const navItems = [
    ["dashboard", "Overview", LayoutDashboard],
    ["practice", "Practice", ListChecks],
    ["library", "Question library", BookOpen],
    ["mistakes", "Review mistakes", RotateCcw],
    ["saved", "Bookmarks", Bookmark],
  ] as const;
  const sourceCard = (s: Source) => (
    <button className="source-row" key={s.id} onClick={() => setFocus(s)}>
      <span className={`category-dot c${s.category}`} />
      <div>
        <span className="eyebrow">
          {s.years.join(" + ")} ·{" "}
          {s.references.length > 1
            ? `${s.references.length} sources combined`
            : "Single source"}{" "}
          · {s.section} {s.priority ? " · PRIORITY" : ""}
        </span>
        <h3>{cleanTitle(s.title)}</h3>
        <span className="muted small">
          {library.categories[s.category - 1].label}
        </span>
      </div>
      {progress.bookmarks.includes(s.id) && (
        <Bookmark size={16} fill="currentColor" />
      )}
      <ChevronRight size={18} />
    </button>
  );
  const questionCard = (q: Question) => (
    <div className="review-row" key={q.id}>
      <div>
        <span className="eyebrow">
          {q.track === "source"
            ? "SOURCE RECALL"
            : typeNames[q.type].toUpperCase()}{" "}
          · {library.categories[q.category - 1].label}
        </span>
        <h3>
          {q.track === "source"
            ? cleanTitle(smap.get(q.sourceIds[0])!.title)
            : q.prompt}
        </h3>
        {progress.records[q.id] && (
          <span className="muted small">
            {progress.records[q.id].attempts} attempts · Last practiced{" "}
            {new Date(progress.records[q.id].lastAt).toLocaleDateString(
              "en-US",
            )}
          </span>
        )}
      </div>
      <button
        className="icon-button"
        aria-label="Toggle bookmark"
        aria-pressed={progress.bookmarks.includes(q.id)}
        onClick={() => bookmark(q.id)}
      >
        <Bookmark
          size={18}
          fill={progress.bookmarks.includes(q.id) ? "currentColor" : "none"}
        />
      </button>
      <button
        className="button secondary small-button"
        onClick={() => start([q], "Focused review")}
      >
        Practice <ArrowRight size={16} />
      </button>
    </div>
  );
  function filters() {
    return (
      <div className="filterbar">
        <div className="searchbox">
          <Search size={17} />
          <input
            aria-label="Search questions"
            placeholder="Search a topic, keyword, or question…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by category"
          value={cat}
          onChange={(e) => setCat(Number(e.target.value))}
        >
          <option value={0}>All categories</option>
          {library.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {page === "library" && (
          <select
            aria-label="Filter by source year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="all">Both years</option>
            <option>2026</option>
            <option>2025</option>
          </select>
        )}
      </div>
    );
  }
  const filteredSources = library.sources.filter(
    (s) =>
      (!cat || s.category === cat) &&
      (year === "all" || s.years.includes(Number(year))) &&
      `${s.title} ${s.searchTitles} ${s.body}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const filteredQuestions = (
    page === "mistakes"
      ? wrong
      : knownQuestions.filter((q) => progress.bookmarks.includes(q.id))
  ).filter(
    (q) =>
      (!cat || q.category === cat) &&
      `${q.prompt} ${smap.get(q.sourceIds[0])?.title} ${q.options.flat().join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const savedSources = filteredSources.filter((s) =>
    progress.bookmarks.includes(s.id),
  );
  function empty(title: string, body: string) {
    return (
      <div className="empty">
        <CheckCheck size={38} />
        <h3>{title}</h3>
        <p>{body}</p>
        <button
          className="button secondary"
          onClick={() => navigate("practice")}
        >
          Explore practice <ArrowRight size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-icon">
            <Layers size={23} />
          </span>
          mockbook<span className="brand-period">.</span>
        </a>
        <div className="workspace-label">
          <span className="avatar">J</span>
          <div>
            <strong>Java workspace</strong>
            <span>Personal study space</span>
          </div>
          <span className="local-dot" />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navItems.map(([id, label, Icon]) => (
            <button
              key={id}
              className={
                page === id || (id === "practice" && page === "session")
                  ? "active"
                  : ""
              }
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "mistakes" && wrong.length > 0 && (
                <b className="nav-count">{wrong.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="mini-label">
            <ShieldCheck size={15} /> JUST FOR YOU
          </span>
          <h4>
            A little progress,
            <br />
            every day.
          </h4>
          <p>
            Your notes. Your pace.
            <br />
            Everything saved on this browser.
          </p>
        </div>
        <button
          className={"settings-link " + (page === "settings" ? "active" : "")}
          onClick={() => navigate("settings")}
        >
          <Settings2 size={18} /> Settings & backup
        </button>
        <div className="sidebar-footer">
          <span className="local-dot" /> Local-first · No account needed
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="top-crumb">Workspace</span>
            <ChevronRight size={14} />
            <span>
              {page === "session"
                ? "Practice session"
                : page === "settings"
                  ? "Settings & backup"
                  : navItems.find((n) => n[0] === page)?.[1]}
            </span>
          </div>
          <div className="top-right">
            <span className="edition">2025 + 2026 EDITION</span>
            <button
              className="profile profile-button"
              aria-label="Open settings and backup"
              onClick={() => navigate("settings")}
            >
              J
            </button>
          </div>
        </header>
        {warning && (
          <div className="warning" role="alert">
            {warning}
            <button aria-label="Dismiss warning" onClick={() => setWarning("")}>
              <X size={16} />
            </button>
          </div>
        )}
        <main>
          {page === "dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    YOUR PERSONAL INTERVIEW COMPANION
                  </span>
                  <h1>
                    Build confidence.
                    <br className="mobile-break" /> One question at a time.
                  </h1>
                  <p>
                    Make the concepts stick. Turn your Java notes into everyday
                    practice.
                  </p>
                </div>
                <span className="date-label">
                  JAVA FULL STACK
                  <br />
                  <strong>Study workspace</strong>
                </span>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-kicker">
                    <span /> SMALL SESSIONS. LASTING KNOWLEDGE.
                  </span>
                  <h2>
                    Understand it.
                    <br />
                    Practice it. <em>Own it.</em>
                  </h2>
                  <p>
                    Six focused paths, your consolidated question bank,
                    <br className="desktop-break" /> and a better way to prepare
                    for what comes next.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="button light"
                      onClick={() => {
                        setTrack("concept");
                        start(
                          shuffle(questions).slice(0, 10),
                          "Daily practice",
                        );
                      }}
                    >
                      Start a quick session <ArrowRight size={17} />
                    </button>
                    <span>10 questions · at your pace</span>
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orb orb-one" />
                  <div className="orb orb-two" />
                  <div className="paper paper-back" />
                  <div className="paper paper-front">
                    <div className="paper-header">
                      <span className="paper-symbol">{"{ }"}</span>
                      <span>JAVA FUNDAMENTALS</span>
                    </div>
                    <div className="paper-line long" />
                    <div className="paper-line medium" />
                    <div className="paper-option">
                      <span />
                      <i />
                    </div>
                    <div className="paper-option selected">
                      <Check size={15} />
                      <i />
                    </div>
                    <div className="paper-option">
                      <span />
                      <i />
                    </div>
                    <div className="paper-bottom">
                      <span>ONE STEP CLOSER</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                  <div className="floating-check">
                    <Check size={19} /> Concept unlocked
                  </div>
                  <div className="floating-code">&lt;/&gt;</div>
                  <span className="spark spark-one">✦</span>
                  <span className="spark spark-two">✧</span>
                </div>
              </section>
              <section className="stats">
                <div>
                  <span className="stat-icon">
                    <BookOpen size={19} />
                  </span>
                  <div>
                    <strong>{sourceCount}</strong>
                    <span>Consolidated topics</span>
                  </div>
                  <small>2026 core + 2025 additions</small>
                </div>
                <div>
                  <span className="stat-icon">
                    <Target size={19} />
                  </span>
                  <div>
                    <strong>
                      {completed}
                      <small> / {allQuestions.length}</small>
                    </strong>
                    <span>Exercises answered correctly</span>
                  </div>
                  <small>
                    {questions.length} concept + {library.recognition.length}{" "}
                    recall
                  </small>
                </div>
                <div>
                  <span className="stat-icon">
                    <Activity size={19} />
                  </span>
                  <div>
                    <strong>
                      {attempts
                        ? Math.round((correct / attempts) * 100) + "%"
                        : "—"}
                    </strong>
                    <span>Overall accuracy</span>
                  </div>
                  <small>
                    {attempts
                      ? `${attempts} total attempts`
                      : "Your first session starts the story"}
                  </small>
                </div>
                <div>
                  <span className="stat-icon warm">
                    <Flame size={19} />
                  </span>
                  <div>
                    <strong>{wrong.length}</strong>
                    <span>Questions to revisit</span>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("mistakes")}
                  >
                    Open your review list <ArrowRight size={13} />
                  </button>
                </div>
              </section>
              {session && !session.done && (
                <button
                  className="resume-banner"
                  onClick={() => setPage("session")}
                >
                  <Play size={19} />
                  <span>
                    <strong>Pick up where you left off</strong> {session.title}{" "}
                    · Question {session.index + 1} of {session.items.length}
                  </span>
                  <ArrowRight size={18} />
                </button>
              )}
              <div className="section-heading">
                <div>
                  <h2>
                    Your learning paths{" "}
                    <span className="soft-badge">6 CATEGORIES</span>
                  </h2>
                  <p>
                    Follow the 2026 question bank priorities, with 2025 topics
                    woven in.
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate("library")}
                >
                  View full library <ArrowRight size={16} />
                </button>
              </div>
              <section className="paths">
                {library.categories.map((c, i) => {
                  const Icon = icons[i];
                  const total = library.sources.filter(
                    (s) => s.category === c.id && !s.supplement,
                  ).length;
                  const done = library.sources.filter(
                    (s) =>
                      s.category === c.id &&
                      !s.supplement &&
                      learnedSources.has(s.id),
                  ).length;
                  return (
                    <button
                      key={c.id}
                      className={`path-card path-${c.id}`}
                      onClick={() => {
                        navigate("practice");
                        setCat(c.id);
                      }}
                    >
                      <div className="path-top">
                        <span className="path-icon">
                          <Icon size={23} />
                        </span>
                        <span className="priority">PRIORITY 0{c.id}</span>
                        <ArrowRight size={17} className="path-arrow" />
                      </div>
                      <h3>{c.label}</h3>
                      <p>{c.description}</p>
                      <div className="path-meta">
                        <span>{total} practice topics</span>
                        <span>
                          {Math.round((done / total) * 100)}% explored
                        </span>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                    </button>
                  );
                })}
              </section>
              <div className="bottom-note">
                <span>
                  <Sparkles size={16} /> Built from your notes. Designed for
                  active recall.
                </span>
                <span>
                  Single choice · Multiple choice · Ordering · Matching
                </span>
              </div>
            </>
          )}
          {page === "practice" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">ACTIVE RECALL</span>
                  <h1>Make it a practice.</h1>
                  <p>
                    Choose your focus. Get feedback the moment you check your
                    answer.
                  </p>
                </div>
              </div>
              <div className="practice-layout">
                <section className="panel setup">
                  <h2>Set up your session</h2>
                  <p className="muted">
                    A focused few minutes goes a long way.
                  </p>
                  <label className="field-label">Practice mode</label>
                  <div className="mode-grid">
                    <button
                      className={track === "concept" ? "mode selected" : "mode"}
                      onClick={() => setTrack("concept")}
                    >
                      <Sparkles size={22} />
                      <strong>Concept practice</strong>
                      <span>
                        {questions.length} authored questions · Four interactive
                        formats
                      </span>
                    </button>
                    <button
                      className={track === "source" ? "mode selected" : "mode"}
                      onClick={() => {
                        setTrack("source");
                      }}
                    >
                      <BookOpen size={22} />
                      <strong>Full-bank recall</strong>
                      <span>
                        {library.recognition.length} passage-to-topic questions
                        · Complete source coverage
                      </span>
                    </button>
                  </div>
                  <div className="form-grid">
                    <label>
                      Category
                      <select
                        aria-label="Category"
                        value={cat}
                        onChange={(e) => setCat(Number(e.target.value))}
                      >
                        <option value={0}>All six categories</option>
                        {library.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Session length
                      <select
                        aria-label="Session length"
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                      >
                        <option value="10">10 questions</option>
                        <option value="20">20 questions</option>
                        <option value="all">All matching questions</option>
                      </select>
                    </label>
                  </div>
                  <div className="setup-footer">
                    <span className="muted small">
                      {
                        (track === "concept"
                          ? questions
                          : library.recognition
                        ).filter((q) => !cat || q.category === cat).length
                      }{" "}
                      questions available · Shuffled each time
                    </span>
                    <button className="button" onClick={() => startFiltered()}>
                      Begin session <ArrowRight size={17} />
                    </button>
                  </div>
                </section>
                <aside className="practice-tip">
                  <div className="tip-icon">
                    <CircleHelp size={25} />
                  </div>
                  <h3>
                    Learn the why,
                    <br />
                    not just the answer.
                  </h3>
                  <p>
                    After every response, explore the explanation and the
                    original notes.
                  </p>
                  <ul>
                    <li>
                      <Check size={16} /> Single choice checks immediately
                    </li>
                    <li>
                      <Check size={16} /> Check other formats when ready
                    </li>
                    <li>
                      <Check size={16} /> Mistakes enter your review list
                    </li>
                    <li>
                      <Check size={16} /> Progress stays in this browser
                    </li>
                  </ul>
                  <div className="tip-foot">
                    Full-bank recall tests source recognition. Concept practice
                    tests understanding. Coding notes are references; code is
                    not executed.
                  </div>
                </aside>
              </div>
              {session && !session.done && (
                <button
                  className="resume-banner"
                  onClick={() => setPage("session")}
                >
                  <Play size={18} />
                  <span>
                    Resume your saved session ·{" "}
                    {session.items.filter((i) => i.result !== null).length}/
                    {session.items.length} answered
                  </span>
                  <ArrowRight size={18} />
                </button>
              )}
            </>
          )}
          {page === "session" &&
            session &&
            (() => {
              const item = session.items[session.index];
              const q = qmap.get(item.id)!;
              const locked = item.result !== null;
              const answered = session.items.filter(
                (i) => i.result !== null,
              ).length;
              const score = session.items.filter(
                (i) => i.result === true,
              ).length;
              if (session.done)
                return (
                  <div className="session-summary panel">
                    <div className="summary-icon">
                      <CheckCheck size={40} />
                    </div>
                    <span className="eyebrow">SESSION COMPLETE</span>
                    <h1>Another step forward.</h1>
                    <p>
                      You answered {score} of {session.items.length} questions
                      correctly.
                    </p>
                    <div className="summary-score">
                      {Math.round((score / session.items.length) * 100)}
                      <span>%</span>
                    </div>
                    <p className="muted">
                      {score === session.items.length
                        ? "A clean sweep. Try another category to keep growing."
                        : "Your missed questions are ready for a focused second pass."}
                    </p>
                    <div className="summary-actions">
                      {score < session.items.length && (
                        <button
                          className="button"
                          onClick={() =>
                            start(
                              session.items
                                .filter((i) => i.result === false)
                                .map((i) => qmap.get(i.id)!),
                              "Retry missed questions",
                            )
                          }
                        >
                          Retry missed questions <RotateCcw size={17} />
                        </button>
                      )}
                      <button
                        className="button secondary"
                        onClick={() => navigate("practice")}
                      >
                        New session
                      </button>
                      <button
                        className="text-button"
                        onClick={() => navigate("dashboard")}
                      >
                        Back to overview
                      </button>
                    </div>
                  </div>
                );
              const move = (from: number, to: number) => {
                if (locked || to < 0 || to >= item.response.length) return;
                const r = [...item.response];
                r.splice(to, 0, r.splice(from, 1)[0]);
                updateItem({ response: r });
              };
              const canCheck =
                q.type === "multi"
                  ? item.response.length > 0
                  : q.type === "match"
                    ? item.response.every((v) => v >= 0)
                    : true;
              return (
                <div className="session-wrap">
                  <div className="session-top">
                    <button
                      className="text-button"
                      onClick={() => navigate("practice")}
                    >
                      <ArrowLeft size={16} /> Save & exit
                    </button>
                    <span>{session.title}</span>
                    <span>
                      {score} correct / {answered} answered
                    </span>
                  </div>
                  <div className="session-progress">
                    <span
                      style={{
                        width: `${(answered / session.items.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="question-panel panel">
                    <div className="question-meta">
                      <span className="soft-badge">{typeNames[q.type]}</span>
                      <span>{library.categories[q.category - 1].label}</span>
                      <span className="question-number">
                        {String(session.index + 1).padStart(2, "0")} /{" "}
                        {session.items.length}
                      </span>
                      <button
                        className="icon-button"
                        aria-label="Bookmark question"
                        aria-pressed={progress.bookmarks.includes(q.id)}
                        onClick={() => bookmark(q.id)}
                      >
                        <Bookmark
                          size={20}
                          fill={
                            progress.bookmarks.includes(q.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>
                    <h1 className="question-title">{q.prompt}</h1>
                    <p className="question-instruction">
                      {q.type === "single"
                        ? "Choose one answer. Feedback appears immediately."
                        : q.type === "multi"
                          ? "Select all correct answers, then check your answer."
                          : q.type === "order"
                            ? "Drag to reorder, or use the arrow buttons. Then check your sequence."
                            : "Select a term on the left, then its definition on the right. Match every pair."}
                    </p>
                    {q.passage && (
                      <div className="passage">
                        <span className="eyebrow">
                          STUDY PASSAGE ·{" "}
                          {smap.get(q.sourceIds[0])!.years.join(" + ")}
                        </span>
                        <Markdown text={q.passage} />
                      </div>
                    )}
                    {(q.type === "single" || q.type === "multi") && (
                      <div className="choices">
                        {item.order.map((idx, pos) => {
                          const chosen = item.response.includes(idx);
                          const good = locked && q.answer.includes(idx);
                          const bad =
                            locked && chosen && !q.answer.includes(idx);
                          return (
                            <button
                              key={idx}
                              disabled={locked}
                              className={`choice ${chosen ? "chosen" : ""} ${good ? "correct" : ""} ${bad ? "incorrect" : ""}`}
                              onClick={() =>
                                q.type === "single"
                                  ? submit([idx])
                                  : updateItem({
                                      response: chosen
                                        ? item.response.filter((v) => v !== idx)
                                        : [...item.response, idx],
                                    })
                              }
                              aria-pressed={chosen}
                            >
                              <span
                                className={
                                  q.type === "multi"
                                    ? "option-checkbox"
                                    : "option-letter"
                                }
                              >
                                {good ? (
                                  <Check size={17} />
                                ) : bad ? (
                                  <X size={17} />
                                ) : q.type === "single" ? (
                                  String.fromCharCode(65 + pos)
                                ) : chosen ? (
                                  <Check size={14} />
                                ) : (
                                  ""
                                )}
                              </span>
                              <span>{cleanTitle(q.options[idx])}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {q.type === "order" && (
                      <ol className="sort-list">
                        {item.response.map((idx, pos) => (
                          <li
                            key={idx}
                            draggable={!locked}
                            onDragStart={() => setDragged(pos)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dragged !== null) move(dragged, pos);
                              setDragged(null);
                            }}
                            className={
                              locked
                                ? idx === pos
                                  ? "correct"
                                  : "incorrect"
                                : ""
                            }
                          >
                            <GripVertical size={17} />
                            <span className="sort-position">{pos + 1}</span>
                            <span className="sort-text">{q.options[idx]}</span>
                            <button
                              className="icon-button"
                              aria-label={`Move item ${pos + 1} up`}
                              disabled={locked || pos === 0}
                              onClick={() => move(pos, pos - 1)}
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`Move item ${pos + 1} down`}
                              disabled={
                                locked || pos === item.response.length - 1
                              }
                              onClick={() => move(pos, pos + 1)}
                            >
                              <ArrowDown size={16} />
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                    {q.type === "match" && (
                      <div className="matching">
                        <div>
                          <span className="eyebrow">TERM</span>
                          {q.options.map((pair, i) => (
                            <button
                              key={i}
                              disabled={locked}
                              aria-pressed={selectedLeft === i}
                              onClick={() => setSelectedLeft(i)}
                              className={`match-cell ${selectedLeft === i ? "chosen" : ""} ${item.response[i] >= 0 ? "paired" : ""} ${locked ? (item.response[i] === i ? "correct" : "incorrect") : ""}`}
                            >
                              <span className="pair-badge">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span>{pair[0]}</span>
                              {item.response[i] >= 0 && <Check size={15} />}
                            </button>
                          ))}
                        </div>
                        <div>
                          <span className="eyebrow">DEFINITION</span>
                          {item.right.map((idx) => {
                            const left = item.response.indexOf(idx);
                            return (
                              <button
                                key={idx}
                                disabled={locked}
                                onClick={() => {
                                  if (selectedLeft === null) {
                                    setNotice(
                                      "Select a term on the left first.",
                                    );
                                    return;
                                  }
                                  const r = item.response.map((v, i) =>
                                    i === selectedLeft
                                      ? idx
                                      : v === idx
                                        ? -1
                                        : v,
                                  );
                                  updateItem({ response: r });
                                  setSelectedLeft(null);
                                }}
                                className={`match-cell ${left >= 0 ? "paired" : ""} ${locked ? (left === idx ? "correct" : "incorrect") : ""}`}
                              >
                                <span className="pair-badge">
                                  {left >= 0
                                    ? String.fromCharCode(65 + left)
                                    : "·"}
                                </span>
                                <span>{q.options[idx][1]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {locked && (
                      <div
                        role="status"
                        className={`feedback ${item.result ? "success" : "failure"}`}
                      >
                        <div className="feedback-heading">
                          {item.result ? (
                            <CheckCheck size={22} />
                          ) : (
                            <CircleHelp size={22} />
                          )}
                          <h3>
                            {item.result
                              ? "That’s right."
                              : "Not quite. Let’s work through it."}
                          </h3>
                        </div>
                        <p>{q.explanation}</p>
                        {q.type === "order" && !item.result && (
                          <div className="correct-answer">
                            <strong>Correct sequence</strong>
                            <ol>
                              {q.options.map((v, i) => (
                                <li key={i}>{v}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {q.type === "match" && !item.result && (
                          <div className="correct-answer">
                            <strong>Correct matches</strong>
                            {q.options.map((p, i) => (
                              <p key={i}>
                                {p[0]} → {p[1]}
                              </p>
                            ))}
                          </div>
                        )}
                        <div className="source-links">
                          {q.sourceIds.map((id) => (
                            <button
                              className="text-button"
                              key={id}
                              onClick={() => setFocus(smap.get(id)!)}
                            >
                              <BookOpen size={16} /> Read source notes ·{" "}
                              {smap.get(id)?.section} <ArrowRight size={14} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="question-footer">
                      <span className="muted small">
                        {locked
                          ? "Progress saved in this browser."
                          : q.track === "source"
                            ? "Full-bank source recognition"
                            : "Understand the concept, then choose."}
                      </span>
                      {locked ? (
                        <button className="button" onClick={next}>
                          {session.index === session.items.length - 1
                            ? "Finish session"
                            : "Next question"}{" "}
                          <ArrowRight size={17} />
                        </button>
                      ) : (
                        q.type !== "single" && (
                          <button
                            className="button"
                            disabled={!canCheck}
                            onClick={() => submit()}
                          >
                            Check answer <Check size={17} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div className="session-bottom">
                    <ShieldCheck size={15} /> Your place is saved automatically.
                    Take a break whenever you need.
                  </div>
                </div>
              );
            })()}
          {(page === "library" || page === "mistakes" || page === "saved") && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {page === "library"
                      ? "YOUR COMPLETE KNOWLEDGE BASE"
                      : page === "mistakes"
                        ? "A SECOND LOOK MAKES IT STICK"
                        : "KEEP THE IMPORTANT THINGS CLOSE"}
                  </span>
                  <h1>
                    {page === "library"
                      ? "The question library."
                      : page === "mistakes"
                        ? "Room to grow."
                        : "Your bookmarks."}
                  </h1>
                  <p>
                    {page === "library"
                      ? `${sourceCount} consolidated topics from both years. 2026 leads; 2025 adds examples and unique topics.`
                      : page === "mistakes"
                        ? "Questions answered incorrectly stay here until you get them right."
                        : "Saved questions and source notes, ready whenever you are."}
                  </p>
                </div>
                {page === "mistakes" && wrong.length > 0 && (
                  <button
                    className="button"
                    onClick={() =>
                      start(shuffle(filteredQuestions), "Mistake review")
                    }
                  >
                    Review {filteredQuestions.length} questions{" "}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
              {filters()}
              <div className="list-heading">
                <span>
                  {page === "library"
                    ? filteredSources.length
                    : filteredQuestions.length +
                      (page === "saved" ? savedSources.length : 0)}{" "}
                  results
                </span>
                <span>
                  {page === "library"
                    ? "Unified topics · Sanitized references"
                    : "Practice makes progress"}
                </span>
              </div>
              <section className="panel list-panel">
                {page === "library" ? (
                  filteredSources.map(sourceCard)
                ) : (
                  <>
                    {filteredQuestions.map(questionCard)}
                    {page === "saved" && savedSources.map(sourceCard)}
                  </>
                )}
                {(page === "library"
                  ? filteredSources.length === 0
                  : filteredQuestions.length === 0 &&
                    (page !== "saved" || savedSources.length === 0)) &&
                  empty(
                    page === "mistakes"
                      ? "A fresh start."
                      : page === "saved"
                        ? "Nothing saved yet."
                        : "No matching questions.",
                    page === "mistakes"
                      ? "Missed questions from your practice sessions will appear here."
                      : page === "saved"
                        ? "Use the bookmark icon on a question or source note to save it."
                        : "Try a different keyword or reset your filters.",
                  )}
              </section>
            </>
          )}
          {page === "settings" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">YOUR WORKSPACE, YOUR DATA</span>
                  <h1>Keep your progress safe.</h1>
                  <p>
                    No account, no server. Just your notes and the progress you
                    make.
                  </p>
                </div>
              </div>
              <div className="settings-grid">
                <section className="panel">
                  <ShieldCheck className="settings-icon" />
                  <h2>Local storage & backup</h2>
                  <p>
                    Your attempts, bookmarks, and current session are saved in
                    this browser. Other browsers and devices have separate
                    progress.
                  </p>
                  <p>
                    Export a backup before clearing browser data. Import merges
                    bookmarks and keeps the newer record for each question. It
                    does not sum overlapping attempts or replace your current
                    session.
                  </p>
                  <div className="settings-actions">
                    <button className="button" onClick={exportData}>
                      <Download size={17} /> Export progress
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={17} /> Import backup
                    </button>
                    <input
                      ref={fileRef}
                      hidden
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => importData(e.target.files?.[0])}
                    />
                  </div>
                </section>
                <section className="panel">
                  <BookOpen className="settings-icon" />
                  <h2>About this question bank</h2>
                  <dl>
                    <div>
                      <dt>2026 source questions</dt>
                      <dd>140</dd>
                    </div>
                    <div>
                      <dt>2025 source questions</dt>
                      <dd>164</dd>
                    </div>
                    <div>
                      <dt>Concept exercises</dt>
                      <dd>{questions.length}</dd>
                    </div>
                    <div>
                      <dt>Source-recognition exercises</dt>
                      <dd>{library.recognition.length}</dd>
                    </div>
                    <div>
                      <dt>Consolidated topics</dt>
                      <dd>{library.sources.length}</dd>
                    </div>
                  </dl>
                  <p>
                    Categories and primary questions follow the June 2026
                    Question Bank. Duplicate questions are combined, with unique
                    2025 topics retained. Every practice topic has concept
                    exercises, and sanitized passages remain expandable. Recall
                    exercises associate passages with topics; concept exercises
                    test understanding.
                  </p>
                  <p>
                    Legacy examples and project claims are preserved as
                    reference material with caveats. Code is not executed or
                    automatically graded. The original source files remain
                    unchanged.
                  </p>
                </section>
              </div>
            </>
          )}
        </main>
        <footer className="main-footer">
          <span>
            mockbook. <span>Made for steady progress.</span>
          </span>
          <span>Java Full Stack · Personal edition</span>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={dialogRef}
        onCancel={() => setFocus(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setFocus(null);
        }}
        className="source-dialog"
      >
        {focus && (
          <>
            <div className="dialog-top">
              <span className="eyebrow">
                STUDY NOTES · {focus.years.join(" + ")} · {focus.section}
              </span>
              <button
                className="icon-button"
                aria-label="Bookmark source"
                aria-pressed={progress.bookmarks.includes(focus.id)}
                onClick={() => bookmark(focus.id)}
              >
                <Bookmark
                  size={19}
                  fill={
                    progress.bookmarks.includes(focus.id)
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
              <button
                className="icon-button"
                aria-label="Close source notes"
                onClick={() => setFocus(null)}
              >
                <X size={21} />
              </button>
            </div>
            <div className="dialog-body">
              <span className="soft-badge">
                {library.categories[focus.category - 1].label}
              </span>
              <h2>{cleanTitle(focus.title)}</h2>
              <p className="source-provenance">
                Primary: {focus.year}mock.md · line {focus.line} ·{" "}
                {focus.references.length} original source
                {focus.references.length === 1 ? "" : "s"}
              </p>
              {focus.caution && (
                <div className="source-caution">
                  <CircleHelp size={17} />
                  <p>{focus.caution}</p>
                </div>
              )}
              {questions.some((q) => q.sourceIds.includes(focus.id)) && (
                <button
                  className="button topic-practice"
                  onClick={() => {
                    const pool = questions.filter((q) =>
                      q.sourceIds.includes(focus.id),
                    );
                    setFocus(null);
                    start(shuffle(pool), cleanTitle(focus.title));
                  }}
                >
                  Practice this topic ·{" "}
                  {
                    questions.filter((q) => q.sourceIds.includes(focus.id))
                      .length
                  }{" "}
                  exercises <ArrowRight size={16} />
                </button>
              )}
              <Markdown text={focus.body} />
              <section className="source-excerpts">
                <h3>Sanitized source excerpts</h3>
                <p className="muted small">
                  The integrated answer above is the study version. These
                  historical excerpts preserve the original wording and may
                  include legacy inaccuracies.
                </p>
                {focus.references.map((ref) => (
                  <details key={ref.id}>
                    <summary>
                      {ref.year}mock.md · line {ref.line} —{" "}
                      {cleanTitle(ref.title)}
                    </summary>
                    {ref.caution && (
                      <p className="source-caution">{ref.caution}</p>
                    )}
                    <Markdown text={ref.body} />
                  </details>
                ))}
              </section>
              <div className="related">
                <h3>Related topics</h3>
                {library.sources
                  .filter(
                    (s) =>
                      s.id !== focus.id &&
                      s.category === focus.category &&
                      cleanTitle(s.title)
                        .toLowerCase()
                        .split(/\W+/)
                        .filter((t) => t.length > 5)
                        .some((t) => focus.title.toLowerCase().includes(t)),
                  )
                  .slice(0, 4)
                  .map((s) => (
                    <button
                      key={s.id}
                      className="text-button"
                      onClick={() => {
                        setFocus(s);
                        dialogRef.current
                          ?.querySelector(".dialog-body")
                          ?.scrollTo(0, 0);
                      }}
                    >
                      {s.year} · {cleanTitle(s.title)} <ArrowRight size={14} />
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
async function boot() {
  try {
    const [library, questions] = await Promise.all(
      ["data/library.json", "data/questions.json"].map(async (path) => {
        const res = await fetch(import.meta.env.BASE_URL + path);
        if (!res.ok) throw new Error("Unable to load question data");
        return res.json();
      }),
    );
    createRoot(document.getElementById("root")!).render(
      <App library={library} questions={questions} />,
    );
  } catch {
    document.getElementById("root")!.innerHTML =
      '<div style="padding:48px;font-family:system-ui"><h1>Unable to load Mockbook</h1><p>Please reload the page. When running locally, start the development server instead of opening index.html directly.</p><button onclick="location.reload()">Try again</button></div>';
  }
}
boot();
