import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  FlaskConical,
  HeartHandshake,
  Home,
  LockKeyhole,
  Menu,
  MessageCircle,
  Pill,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Launch } from "./Launch";
import {
  ROUTES,
  PROFILE_TABS,
  GUIDE,
  SCENARIOS,
  resolveRoute,
  allowedPages,
} from "./app/routes";
import { FEATURES, featureVisible } from "./app/features";
import * as E from "./lib/engine";
import * as HC from "./lib/healthConnect";
import * as DS from "./lib/dataSources";
import { selfTests } from "./lib/selfTests";
import "./extended.css";
import "./mvp.css";
import { t } from "./content/i18n";
import { RxPreview } from "./RxPreview";
const KEY = "pulse-demo-v1";
const SESSION_KEY = "pulse-session-v1";
const C = createContext<any>(null);
const Embedded = createContext(false);
const useApp = () =>
  useContext(C) as {
    s: E.State;
    mutate: (f: (s: E.State) => void) => void;
    go: (path: string) => void;
    toast: (text: string) => void;
    login: (role: E.Role, id?: string) => void;
    route: string;
    askConfirm: (text: string) => Promise<boolean>;
    askText: (text: string, initial?: string) => Promise<string | null>;
  };
function Btn({
  children,
  onClick,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  const { s, askConfirm, askText } = useApp();
  const translated = typeof children === "string" ? t(children) : children;
  return (
    <button
      type="button"
      className={`m-btn ${secondary ? "secondary" : ""} ${danger ? "danger" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {translated}
    </button>
  );
}
function Card({
  children,
  title,
  privateCard = false,
}: {
  children: ReactNode;
  title?: string;
  privateCard?: boolean;
}) {
  const { s, askConfirm, askText } = useApp();
  return (
    <section className={`m-card ${privateCard ? "private-card" : ""}`}>
      {title && <h2>{t(title)}</h2>}
      {children}
    </section>
  );
}
function Empty({
  children = "Nothing here yet. Add an update to begin.",
}: {
  children?: ReactNode;
}) {
  return (
    <div className="m-empty">
      <FileText size={24} />
      <p>{children}</p>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  placeholder,
}: any) {
  const { s, askConfirm, askText } = useApp();
  return (
    <label className="m-field">
      {t(label)}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
      />
    </label>
  );
}
function Select({ label, value, onChange, options }: any) {
  const { s, askConfirm, askText } = useApp();
  return (
    <label className="m-field">
      {t(label)}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o: any) => (
          <option
            key={typeof o === "string" ? o : o[0]}
            value={typeof o === "string" ? o : o[0]}
          >
            {typeof o === "string" ? o : o[1]}
          </option>
        ))}
      </select>
    </label>
  );
}
function Toggle({ label, on, onChange, disabled = false }: any) {
  const { s, askConfirm, askText } = useApp();
  return (
    <label className="m-toggle">
      <span>{t(label)}</span>
      <input
        type="checkbox"
        checked={!!on}
        onChange={onChange}
        disabled={disabled}
      />
      <span>{on ? "On" : "Off"}</span>
    </label>
  );
}
function Badge({ children, tone = "" }: any) {
  return (
    <span className={`m-badge ${tone}`}>
      <ShieldCheck size={14} />
      {children}
    </span>
  );
}
function download(name: string, content: string, type = "application/json") {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([content], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function share(title: string, text: string) {
  if (navigator.share) navigator.share({ title, text }).catch(() => {});
  else download("pulse-share.txt", `${title}\n${text}`, "text/plain");
}
const roleNames: any = {
  "CG-0001": "Amit · Pune",
  "CG-0002": "Neha · Delhi",
  "DR-0001": "Dr. Verma",
  "DR-0002": "Dr. Saxena (pending)",
  TEAM: "Pooja",
  [E.P]: "Ramesh",
};
function Shell({ children, title }: { children: ReactNode; title: string }) {
  const { s, mutate, go, route } = useApp();
  const embedded = useContext(Embedded);
  const role = s.session.role!;
  const config = ROUTES[role];
  const [drawer, setDrawer] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const p = E.patient(s);
  const unread = s.notifications.filter(
    (n) =>
      n.audience === s.session.userId &&
      E.visible(n, s) &&
      n.status !== "queued" &&
      !n.read,
  ).length;
  const logout = () => {
    mutate((s) => {
      s.session.role = null;
      s.session.userId = "";
    });
    go("/");
  };
  const select = (item: { path: string; action?: string }) => {
    setDrawer(false);
    if (item.action === "switch") setSwitcher(true);
    else go(`/${role}/${item.path}`);
  };
  const closeSwitcher = () => {
    setSwitcher(false);
    if (route.includes("switch=1")) go("/caregiver/home");
  };
  if (embedded)
    return (
      <section className="embedded-view">
        <h2>{title}</h2>
        {children}
      </section>
    );
  const nav = (
    <>
      {config.nav.map((item, i) => (
        <button
          key={item.path}
          onClick={() => select(item)}
          className={
            route.split("?")[0] === `/${role}/${item.path}` ? "active" : ""
          }
        >
          {i === 0 ? (
            <Home size={20} />
          ) : i === 1 ? (
            <Activity size={20} />
          ) : i === 2 ? (
            <FileText size={20} />
          ) : (
            <MessageCircle size={20} />
          )}
          <span>{item.label}</span>
        </button>
      ))}
    </>
  );
  const groups = (
    <>
      {config.drawer.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          {group.items
            .filter(
              (item) =>
                featureVisible(item.path.split("?")[0]) &&
                (item.path !== "sugar-detective" ||
                  !!p?.sugarDetectivePrescribed),
            )
            .map((item) => (
              <button
                className="drawer-link"
                key={item.path}
                onClick={() => select(item)}
              >
                {item.label}
                <ChevronRight size={18} />
              </button>
            ))}
        </section>
      ))}
      <Btn secondary onClick={logout}>
        Log out
      </Btn>
    </>
  );
  return (
    <div
      className={`m-app ${role === "team" || role === "doctor" ? "desktop" : "mobile"} role-${role} ${s.settings.large ? "extra-large" : ""}`}
    >
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      {(role === "doctor" || role === "team") && (
        <aside className="m-sidebar">
          <div className="m-brand">Pulse</div>
          {nav}
          {groups}
        </aside>
      )}
      <div className="m-main">
        <header className="m-top">
          <button aria-label="Open menu" onClick={() => setDrawer(true)}>
            <Menu />
          </button>
          <div>
            <b>{title}</b>
            <small>
              {E.date(s.sim.day)} · {s.sim.time} · Day{" "}
              {p ? s.sim.day - p.start : 0}
            </small>
          </div>
          <button
            aria-label="Notifications"
            onClick={() => go(`/${role}/notifications`)}
          >
            <Bell size={20} />
            <span>{unread || ""}</span>
          </button>
        </header>
        {!s.sim.online && (
          <div className="offline-banner">
            Offline — readings are saved on this phone. Safety steps still work;
            messages to your contacts will send when you're back online.
          </div>
        )}
        <main id="main" tabIndex={-1} className="m-content">
          {children}
        </main>
        {config.floating && (
          <button
            className="log-fab"
            onClick={() => go(`/${role}/${config.floating!.path}`)}
          >
            {config.floating.label}
          </button>
        )}
        {role !== "team" && (
          <nav
            className={`m-bottom ${role === "doctor" ? "doctor-bottom" : ""}`}
            aria-label="Main navigation"
          >
            {nav}
          </nav>
        )}
      </div>
      {drawer && (
        <div className="m-overlay" onClick={() => setDrawer(false)}>
          <aside className="m-drawer" onClick={(e) => e.stopPropagation()}>
            <button
              className="close"
              aria-label="Close menu"
              onClick={() => setDrawer(false)}
            >
              <X />
            </button>
            <h2>
              Pulse ·{" "}
              {s.users?.[s.session.userId]?.name ||
                roleNames[s.session.userId] ||
                p?.name}
            </h2>
            {groups}
          </aside>
        </div>
      )}
      {role === "caregiver" && (switcher || route.includes("switch=1")) && (
        <div className="m-overlay" onClick={closeSwitcher}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Switch family member"
            className="m-confirm-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Switch family member</h2>
            {s.links
              .filter(
                (l) =>
                  l.viewer === s.session.userId &&
                  l.status === "approved" &&
                  E.patient(s, l.patientId) &&
                  !E.patient(s, l.patientId).deleted,
              )
              .map((l) => (
                <Btn
                  key={l.id}
                  onClick={() => {
                    mutate((s) => {
                      s.session.patientId = l.patientId;
                    });
                    closeSwitcher();
                  }}
                >
                  {E.patient(s, l.patientId).name}
                </Btn>
              ))}
            <Btn secondary onClick={closeSwitcher}>
              Close
            </Btn>
          </section>
        </div>
      )}
    </div>
  );
}
function EmbeddedViews({ children }: { children: ReactNode }) {
  return <Embedded.Provider value={true}>{children}</Embedded.Provider>;
}
function PatientFamily() {
  return (
    <Shell title="Family & privacy">
      <EmbeddedViews>
        <Privacy />
        <MyData />
      </EmbeddedViews>
    </Shell>
  );
}
function Settings() {
  const { s } = useApp();
  return (
    <Shell title="Settings">
      <EmbeddedViews>
        <Utility kind="settings" />
        {FEATURES.wellnessBand && s.session.role === "patient" && (
          <ConnectedDevices />
        )}
      </EmbeddedViews>
    </Shell>
  );
}
function PatientDoctor() {
  const { route, go } = useApp();
  const tab = new URLSearchParams(route.split("?")[1]).get("tab") || "messages";
  return (
    <Shell title="Doctor">
      <div className="m-tabs" role="tablist" aria-label="Doctor sections">
        {["messages", "appointments", "tests"].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            key={t}
            onClick={() => go(`/patient/doctor?tab=${t}`)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <EmbeddedViews>
        {tab === "appointments" ? (
          <Appointments />
        ) : tab === "tests" ? (
          <PatientTests />
        ) : (
          <Messages />
        )}
      </EmbeddedViews>
    </Shell>
  );
}
function CaregiverNotes() {
  const [report, setReport] = useState(false);
  return (
    <Shell title="Notes">
      <Btn secondary onClick={() => setReport(!report)}>
        {report ? "Close reports" : "Add a report"}
      </Btn>
      <EmbeddedViews>
        {report && <Records initialUpload />}
        <Notes />
      </EmbeddedViews>
    </Shell>
  );
}
function CaregiverAlerts() {
  return (
    <Shell title="Alerts">
      <EmbeddedViews>
        <Caregiver alertsOnly />
        <Notifications />
      </EmbeddedViews>
    </Shell>
  );
}
function CareDesk() {
  const { route } = useApp();
  if (FEATURES.teamOutboundLog && route.includes("tab=sent"))
    return (
      <Shell title="Care desk">
        <EmbeddedViews>
          <Utility kind="outbound" />
        </EmbeddedViews>
      </Shell>
    );
  return (
    <Shell title="Care desk">
      <EmbeddedViews>
        <Desk />
      </EmbeddedViews>
    </Shell>
  );
}

function Safety({ rule, onBack }: { rule?: string; onBack?: () => void }) {
  const { s, mutate, go, askConfirm, askText } = useApp();
  const alerts = s.alerts.filter(
    (a) =>
      a.patientId === s.session.patientId &&
      E.visible(a, s) &&
      a.status !== "resolved",
  );
  const a = alerts.find((a) => a.rule === rule) || alerts.at(-1);
  const code = rule || a?.rule || "S0";
  const crisis = code === "S7";
  const low = ["S1", "S2", "S3"].includes(code);
  const emergency = ["S6"].includes(code) || (code === "S5" && a?.severe);
  const elapsed = a ? E.now(s) - E.minutes(a.day, a.time) : 0;
  return (
    <Card
      privateCard={crisis}
      title={
        crisis
          ? "Help is available right now"
          : emergency
            ? "Get help nearby now"
            : low
              ? "Your sugar is low — check again"
              : "Check once more"
      }
    >
      <Badge tone={low || emergency ? "urgent" : ""}>
        {code} · {a?.value ?? ""} {a?.value ? "mg/dL" : ""}
      </Badge>
      {a?.value && (
        <SourceBadge row={s.readings.find((r) => r.id === a.source)} />
      )}
      {crisis ? (
        <>
          <p>
            Are you safe right now? Please stay with someone you trust. Your
            family is never sent mood information.
          </p>
          <Toggle
            label="I'm not safe — tell my local safety contact"
            on={a?.contactNotified}
            onChange={() => {
              if (!E.patient(s).consents.crisisContact) {
                go("/patient/privacy");
                return;
              }
              mutate((s) => {
                const target = s.alerts.find((x) => x.id === a?.id);
                if (target && !target.contactNotified) {
                  target.contactNotified = true;
                  s.outbound.push({
                    id: E.uid("SMS"),
                    patientId: E.patient(s).id,
                    ...E.stamp(s),
                    recipient: E.safetyContact(s).name,
                    body: "Patient requested immediate support",
                    status: s.sim.online ? "sent" : "queued",
                  });
                }
              });
            }}
          />
          <a className="m-btn" href="tel:14416">
            Call Tele-MANAS 14416
          </a>
          <a className="m-btn secondary" href="tel:18008914416">
            1-800-891-4416
          </a>
          {!a && (
            <Btn
              onClick={() =>
                mutate((s) =>
                  E.alert(s, E.patient(s).id, "S7", {
                    id: E.uid("CALL"),
                    patientId: E.patient(s).id,
                    ...E.stamp(s),
                  }),
                )
              }
            >
              Request care-team callback
            </Btn>
          )}
        </>
      ) : low ? (
        <>
          <p>Doctor-approved steps (demo)</p>
          <ol>
            <li>Take 3 teaspoons of sugar in water or 150 ml of juice now.</li>
            <li>Sit down.</li>
            <li>Check again in 15 minutes.</li>
          </ol>
          <strong>
            {Math.max(0, 15 - elapsed)} simulated minutes until recheck
          </strong>
          <p>Alert resolves after a fresh recheck of at least 70 mg/dL.</p>
        </>
      ) : code === "S0" ? (
        <p>This reading is old. How are you feeling now? Please check again.</p>
      ) : code === "S4" ? (
        <p>
          Two low fasting readings this week. We've let Dr. Verma's clinic know.
        </p>
      ) : (
        <p>
          {emergency
            ? "1. Call someone nearby. 2. Call 112."
            : "If you have no serious symptoms, check again in 2 hours. If you are vomiting, very drowsy, confused or breathless, call 112."}
        </p>
      )}
      <div className="m-actions">
        <Btn onClick={() => go("/patient/log/glucose")}>Log recheck</Btn>
        <a className="m-btn secondary" href={`tel:${E.safetyContact(s).phone}`}>
          Call {E.safetyContact(s).name}
        </a>
        <a className="m-btn danger" href="tel:112">
          Call 112
        </a>
      </div>
      {a && (
        <>
          <p>
            {a.status} · {a.owner} ·{" "}
            {s.sim.online
              ? "Demo notifications recorded"
              : "Contact messages waiting for connection"}
          </p>
          <ul className="timeline">
            {a.timeline.map((t: any, i: number) => (
              <li key={i}>
                {E.date(t.day)} {t.time} · {t.text}
              </li>
            ))}
          </ul>
        </>
      )}
      {onBack && (
        <Btn secondary onClick={onBack}>
          Back
        </Btn>
      )}
    </Card>
  );
}
function DoseList({
  pid,
  caregiver = false,
}: {
  pid: string;
  caregiver?: boolean;
}) {
  const { s, mutate, askConfirm, askText } = useApp();
  const latest = E.activeRx(s, pid);
  const reminders = caregiver
    ? latest
    : s.prescriptions
        .filter(
          (r) =>
            r.patientId === pid &&
            E.visible(r, s) &&
            r.signed &&
            r.remindersConfirmed !== false,
        )
        .at(-1);
  const meds = reminders?.medicines || [];
  if (!meds.length)
    return (
      <Card title={"Medicines today"}>
        <Empty>
          No confirmed doctor prescription yet. Medicines are added only after a
          verified doctor signs.
        </Empty>
      </Card>
    );
  return (
    <Card title={"Medicines today"}>
      {meds.flatMap((m: any) =>
        (m.times || E.patternTimes(m.pattern)).map((time: string) => {
          const id = `DOSE-${pid}-${s.sim.day}-${m.generic}-${time}`;
          const dose = s.doses.find((d) => d.id === id);
          const status =
            dose?.status || (s.sim.time > time ? "due" : "upcoming");
          return (
            <div className="m-row" key={id}>
              <Pill size={20} />
              <div>
                <b>
                  {m.generic} · {m.strength}
                </b>
                <small>
                  {time} · {m.instruction}
                </small>
              </div>
              <Badge>{status}</Badge>
              {!caregiver && (
                <Btn
                  secondary
                  disabled={status === "taken"}
                  onClick={() =>
                    mutate((s) => {
                      const r = s.doses.find((d) => d.id === id);
                      if (r) r.status = "taken";
                      else
                        s.doses.push({
                          id,
                          patientId: pid,
                          ...E.stamp(s),
                          generic: m.generic,
                          status: "taken",
                          scheduledTime: time,
                        });
                    })
                  }
                >
                  {status === "taken" ? "Taken ✓" : "Mark taken"}
                </Btn>
              )}
            </div>
          );
        }),
      )}
    </Card>
  );
}
function PatientHome() {
  const { s, mutate, go, askConfirm, askText } = useApp();
  const p = E.patient(s);
  const readings = s.readings
    .filter((r) => r.patientId === p.id && E.visible(r, s))
    .sort((a, b) => E.minutes(a.day, a.time) - E.minutes(b.day, b.time));
  const pr = E.proof(s, p.id);
  const w3 = s.alerts.find(
    (a) =>
      a.patientId === p.id &&
      a.rule === "W3" &&
      E.visible(a, s) &&
      s.sim.day - a.day < 7,
  );
  const active = s.alerts.filter(
    (a) =>
      a.patientId === p.id &&
      E.visible(a, s) &&
      a.status !== "resolved" &&
      ["S1", "S2", "S3", "S5", "S6", "S7"].includes(a.rule),
  );
  return (
    <Shell title={"Today"}>
      <div className="m-hero">
        <span>Your meter. Your proof.</span>
        <h1>{`Hello, ${p.name.split(" ")[0]}`}</h1>
        <p>Care Cycle · Day {Math.max(0, s.sim.day - p.start)} / 90</p>
        <Badge>Synthetic demo patient</Badge>
      </div>
      {active.map((a) => (
        <Safety key={a.id} rule={a.rule} />
      ))}
      {s.links
        .filter(
          (l) =>
            l.patientId === p.id && l.status === "pending" && E.visible(l, s),
        )
        .map((l) => (
          <Card key={l.id} title="Family access request">
            <p>
              {l.name || l.viewer} would like to connect. Nothing is shared
              until you approve.
            </p>
            <div className="m-actions">
              <Btn onClick={() => useApproval(l.id, true)}>
                Approve recommended categories
              </Btn>
              <Btn secondary onClick={() => useApproval(l.id, false)}>
                Decline
              </Btn>
            </div>
          </Card>
        ))}
      {w3 && (
        <Card title="A lighter week">
          <p>
            Just one small step: {E.habitLabel(p.habitId)}. The Pulse care team
            will call to help.
          </p>
        </Card>
      )}
      {E.activeRx(s, p.id)?.remindersConfirmed === false && (
        <Card title="New prescription received">
          <p>
            The doctor updated your medicines. Confirm before reminder times
            change.
          </p>
          <Btn
            onClick={() =>
              mutate((s) => {
                s.prescriptions.find(
                  (r) => r.id === E.activeRx(s, p.id)!.id,
                )!.remindersConfirmed = true;
              })
            }
          >
            Confirm new medicine reminders
          </Btn>
        </Card>
      )}
      <DoseList pid={p.id} />
      {FEATURES.wellnessBand && <YourDay />}
      <Card title={pr.ready ? "Your effort, in numbers" : "Your next step"}>
        {pr.ready ? (
          <p>
            <SourceBadge row={pr.latest!} source="lab" /> HbA1c{" "}
            {pr.baseline!.value}% → {pr.latest!.value}% · measured change{" "}
            {pr.delta} points
          </p>
        ) : (
          <p>Find out what your habit does in six evenings.</p>
        )}
        {(pr.ready ||
          (FEATURES.sugarDetective && p.sugarDetectivePrescribed)) && (
          <Btn
            onClick={() => go(pr.ready ? "/patient/proof" : "/patient/jasoos")}
          >
            {pr.ready ? "View Proof Card" : "Open Sugar Detective"}{" "}
            <ChevronRight size={18} />
          </Btn>
        )}
      </Card>
      <div className="m-grid">
        <Card title="Latest reading">
          <strong className="big-number">
            {DS.value(s, "glucose")?.value ?? "—"}
          </strong>
          <p>mg/dL</p>
          <SourceBadge row={DS.value(s, "glucose")} />
          <Btn secondary onClick={() => go("/patient/log/glucose")}>
            Log glucose
          </Btn>
        </Card>
        {FEATURES.weeklyQuestionnaire && (
          <Card title="Sunday check">
            <p>One small update about your week.</p>
            <Btn secondary onClick={() => go("/patient/weekly")}>
              Weekly check
            </Btn>
          </Card>
        )}
      </div>
      <div className="m-actions">
        <Btn secondary onClick={() => go("/patient/doctor")}>
          <MessageCircle size={18} />
          Doctor
        </Btn>
        {FEATURES.mythBuster && (
          <Btn secondary onClick={() => go("/patient/myth")}>
            <ShieldCheck size={18} />
            True or false?
          </Btn>
        )}
        <Btn secondary onClick={() => go("/patient/privacy")}>
          <Users size={18} />
          Consent & family
        </Btn>
      </div>
    </Shell>
  );
  function useApproval(id: string, approved: boolean) {
    mutate((s) => {
      const l = s.links.find((l) => l.id === id)!;
      l.status = approved ? "approved" : "declined";
      l.permissions = Object.fromEntries(
        E.categories.map((c) => [
          c,
          [
            "summary",
            "alerts",
            "medicines",
            "tests",
            "sprint",
            "proof",
          ].includes(c),
        ]),
      );
    });
  }
}
function Log() {
  const { s, mutate, go, toast, route, askConfirm, askText } = useApp();
  const [kind, setKind] = useState(
    route.includes("glucose") ? "glucose" : "menu",
  );
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("mg/dL");
  const [readingSource, setReadingSource] = useState<E.DataSource>("typed");
  const [context, setContext] = useState("fasting");
  const [measured, setMeasured] = useState(s.sim.time);
  const [measuredDay, setMeasuredDay] = useState(s.sim.day);
  const [symptoms, setSymptoms] = useState("");
  const [own, setOwn] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(true);
  const numeric =
    value === "LO"
      ? 30
      : value === "HI"
        ? 601
        : Number(value) * (unit === "mmol/L" ? 18 : 1);
  const valid =
    (["LO", "HI"].includes(value) || (numeric >= 20 && numeric <= 600)) &&
    E.minutes(measuredDay, measured) <= E.now(s);
  const save = async () => {
    if (!own) {
      toast("Someone else's reading was not saved");
      go("/patient/home");
      return;
    }
    const duplicate = s.readings.some(
      (r) =>
        r.patientId === E.patient(s).id &&
        r.value === numeric &&
        E.now(s) - E.minutes(r.day, r.time) < 5,
    );
    if (
      duplicate &&
      !(await askConfirm("Already recorded within 5 minutes. Add again?"))
    )
      return;
    mutate((s) => {
      const r = E.recordReading(s, {
        value: Math.round(numeric),
        flag: ["LO", "HI"].includes(value) ? value : undefined,
        context,
        source: readingSource,
        measuredAt: E.minutes(measuredDay, measured),
        symptoms,
        // @allow-devanagari
        severe: /vomit|drowsy|confus|breath|उल्टी/.test(symptoms),
        // @end-allow-devanagari
      });
      setResult(r.rule || "normal");
    });
  };
  if (result)
    return (
      <Shell title="Reading saved">
        {result === "normal" ? (
          <Card title="Reading saved">
            <p>
              {Math.round(numeric)} mg/dL ·{" "}
              {s.sim.online ? "Synced" : "Waiting to send"}
            </p>
            <SourceBadge
              row={s.readings
                .filter(
                  (r) =>
                    r.patientId === E.patient(s).id &&
                    r.value === Math.round(numeric),
                )
                .at(-1)}
              source={readingSource}
            />
            <Btn onClick={() => go("/patient/home")}>Today</Btn>
            <Btn
              secondary
              onClick={() => {
                setResult(null);
                setValue("");
              }}
            >
              Another reading
            </Btn>
          </Card>
        ) : (
          <Safety
            rule={result}
            onBack={() => {
              setResult(null);
              setValue("");
            }}
          />
        )}
      </Shell>
    );
  return (
    <Shell title={"Log an update"}>
      {kind === "menu" ? (
        <>
          <div className="m-grid">
            {[
              ["glucose", "Sugar"],
              ["medicine", "Medicine taken"],
              ["water", "Water"],
              ["weight", "Weight & BP"],
              ["symptom", "Symptoms"],
              ["meal", "Meal photo"],
              ["note", "Private note"],
              ["report", "Lab report"],
            ]
              .filter(
                ([k]) =>
                  k !== "weight" &&
                  (k !== "meal" || FEATURES.mealPhotos) &&
                  (k !== "water" || FEATURES.manualWater) &&
                  (k !== "note" || FEATURES.privateNotes),
              )
              .map(([k, t]) => (
                <Btn
                  secondary
                  key={k}
                  onClick={() => {
                    if (k === "note") go("/patient/notes");
                    else if (k === "report") go("/patient/records/upload");
                    else if (k === "medicine") go("/patient/medicines");
                    else setKind(k);
                  }}
                >
                  {t}
                </Btn>
              ))}
          </div>
          {FEATURES.manualWeightBp && (
            <details>
              <summary>More</summary>
              <Btn secondary onClick={() => setKind("weight")}>
                Weight & BP
              </Btn>
            </details>
          )}
        </>
      ) : kind === "glucose" ? (
        <Card title="Sugar reading · seen by you and the doctors you allow">
          <div className="meter-display">
            {value || "—"} <small>{unit}</small>
          </div>
          <Field
            label="Meter value (or LO / HI)"
            value={value}
            onChange={(v: string) => {
              setValue(v);
              setReadingSource("typed");
              setConfirmed(true);
            }}
          />
          <Select
            label="Unit"
            value={unit}
            onChange={setUnit}
            options={["mg/dL", "mmol/L"]}
          />
          <div className="keypad">
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "LO",
              "0",
              "HI",
              ".",
              "⌫",
            ].map((k) => (
              <button
                key={k}
                onClick={() => {
                  setReadingSource("typed");
                  setValue((v) =>
                    k === "⌫"
                      ? v.slice(0, -1)
                      : k === "LO" || k === "HI"
                        ? k
                        : v.replace(/LO|HI/, "") + k,
                  );
                  setConfirmed(true);
                }}
              >
                {k}
              </button>
            ))}
          </div>
          <Select
            label="Context"
            value={context}
            onChange={setContext}
            options={[
              ["fasting", "Fasting"],
              ["before", "Before meal"],
              ["after", "2 hours after meal"],
              ["bedtime", "Bedtime"],
              ["any", "Other time"],
            ]}
          />
          <Field
            label="Measured on simulated day"
            type="number"
            min={0}
            max={s.sim.day}
            value={measuredDay}
            onChange={(v: string) => setMeasuredDay(Number(v))}
          />
          <Field
            label="Measured time"
            type="time"
            value={measured}
            onChange={setMeasured}
          />
          <Field
            label="Symptoms (shaking, sweating, vomiting, breathless…)"
            value={symptoms}
            onChange={setSymptoms}
          />
          <Toggle
            label="Is this your reading?"
            on={own}
            onChange={() => setOwn(!own)}
          />
          <Select
            label="Demo meter photo (simulated OCR)"
            value=""
            onChange={(v: string) => {
              if (v === "unclear") {
                toast("Unclear — enter value manually");
                return;
              }
              setValue(
                v === "meter_LO"
                  ? "LO"
                  : v === "meter_5_2_mmol"
                    ? "5.2"
                    : "142",
              );
              setUnit(v === "meter_5_2_mmol" ? "mmol/L" : "mg/dL");
              setReadingSource("meter-photo");
              setConfirmed(false);
            }}
            options={[
              ["", "Choose sample"],
              ["meter_142", "142 mg/dL"],
              ["meter_LO", "LO"],
              ["meter_5_2_mmol", "5.2 mmol/L"],
              ["unclear", "Unclear"],
            ]}
          />
          {!confirmed && (
            <Toggle
              label="I confirm the extracted reading"
              on={confirmed}
              onChange={() => setConfirmed(true)}
            />
          )}
          <p className="m-hint">
            No future measurement time. Older than 30 minutes follows the
            stale-reading path.
          </p>
          <Btn disabled={!valid || !confirmed} onClick={save}>
            Save reading
          </Btn>
        </Card>
      ) : kind === "water" ? (
        <Water />
      ) : kind === "symptom" ? (
        <Card title="Symptoms">
          <Field
            label="What are you feeling?"
            value={symptoms}
            onChange={setSymptoms}
          />
          <Btn
            disabled={!symptoms.trim()}
            onClick={() => {
              mutate((s) => {
                const code = E.textEvent(s, symptoms);
                setResult(code || "normal");
              });
            }}
          >
            Save & check safety
          </Btn>
        </Card>
      ) : kind === "meal" ? (
        <Card title="Meal photos">
          <p>Optional meal-photo consent is required.</p>
          {!E.patient(s).consents.meal ? (
            <Btn onClick={() => go("/patient/privacy")}>Manage consent</Btn>
          ) : (
            <input
              aria-label="Upload synthetic meal photo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  toast("Demo meal photo logged");
                  mutate((s) =>
                    s.documents.push({
                      id: E.uid("DOC"),
                      patientId: E.patient(s).id,
                      ...E.stamp(s),
                      title: e.target.files![0].name,
                      type: "meal",
                      sensitive: false,
                      verified: false,
                      status: s.sim.online ? "synced" : "queued",
                    }),
                  );
                }
              }}
            />
          )}
        </Card>
      ) : (
        <Card title="Weight or BP">
          <Field
            label="Weight kg (25–250)"
            value={value}
            onChange={setValue}
            type="number"
          />
          <Btn
            disabled={Number(value) < 25 || Number(value) > 250}
            onClick={() => {
              mutate((s) =>
                s.notes.push({
                  id: E.uid("WEIGHT"),
                  patientId: E.patient(s).id,
                  ...E.stamp(s),
                  source: "typed",
                  measuredAt: E.now(s),
                  value: Number(value),
                  metric: "weight",
                  text: `Weight ${value} kg`,
                  owner: E.patient(s).id,
                  shared: false,
                }),
              );
              toast("Weight saved");
              setKind("menu");
            }}
          >
            Save weight
          </Btn>
        </Card>
      )}
    </Shell>
  );
}
function Water() {
  const { s, mutate, askConfirm, askText } = useApp();
  const pid = E.patient(s).id;
  const rows = s.water.filter(
    (r) => r.patientId === pid && r.day === s.sim.day && E.visible(r, s),
  );
  const count = rows.reduce((sum, r) => sum + r.amount, 0);
  if (!FEATURES.manualWater) return null;
  return (
    <Card title="Water · logged by you">
      <strong className="big-number">{count}</strong>
      <p>glasses today</p>
      <div className="m-actions">
        <Btn
          onClick={() =>
            mutate((s) =>
              s.water.push({
                id: E.uid("WATER"),
                patientId: pid,
                ...E.stamp(s),
                amount: 1,
                status: s.sim.online ? "synced" : "queued",
              }),
            )
          }
        >
          +1 glass
        </Btn>
        <Btn
          secondary
          disabled={count === 0}
          onClick={() =>
            mutate((s) =>
              s.water.push({
                id: E.uid("WATER"),
                patientId: pid,
                ...E.stamp(s),
                amount: -1,
              }),
            )
          }
        >
          −1 glass
        </Btn>
      </div>
    </Card>
  );
}
const habits = Object.entries(E.HABITS);
function Sprint() {
  const { s, mutate, go, toast, askConfirm, askText } = useApp();
  const pid = E.patient(s).id;
  const list = s.sprints.filter((r) => r.patientId === pid && E.visible(r, s));
  const [selected, setSelected] = useState(list.at(-1)?.id || "");
  const [habitId, setHabitId] = useState<string>(habits[0][0]);
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [fasting, setFasting] = useState("");
  const [arm, setArm] = useState("A");
  const sp = list.find((r) => r.id === selected) || list.at(-1);
  const evenings =
    sp?.evenings.filter(
      (e: any) =>
        e.day < s.sim.day || (e.day === s.sim.day && s.sim.time >= "22:00"),
    ) || [];
  const result = E.sprintResult(evenings);
  const p = E.patient(s);
  return (
    <Shell title="Sugar Detective">
      <div className="m-hero">
        <FlaskConical size={32} />
        <h1>Your meter. Your proof.</h1>
        <p>6 evenings · A / B / A / B / A / B · about 12 strips</p>
      </div>
      {!p.consents.sprint || p.insulin ? (
        <Card title="Sprint unavailable">
          <p>
            {p.insulin
              ? "Doctor-supervised mode: experiments are disabled. Safety remains available."
              : "Turn on optional sprint consent first."}
          </p>
          <Btn onClick={() => go("/patient/privacy")}>Consent</Btn>
        </Card>
      ) : (
        <>
          <Card title="Your experiments">
            <Select
              label="History"
              value={sp?.id || ""}
              onChange={setSelected}
              options={list.map((r) => [
                r.id,
                `${E.habitLabel(r.habitId)} · Day ${r.day}`,
              ])}
            />
            <Select
              label="Doctor-approved habit"
              value={habitId}
              onChange={setHabitId}
              options={habits}
            />
            <Btn
              disabled={
                !FEATURES.sugarDetective ||
                !E.patient(s).sugarDetectivePrescribed
              }
              onClick={() => {
                mutate((s) => {
                  const id = E.uid("SPRINT");
                  s.sprints.push({
                    id,
                    patientId: pid,
                    ...E.stamp(s),
                    habitId,
                    start: s.sim.day,
                    status: "active",
                    evenings: [],
                    extensions: 0,
                    plan: Array.from({ length: 6 }, (_, i) => ({
                      day: s.sim.day + i,
                      arm: i % 2 ? "B" : "A",
                    })),
                  });
                  setSelected(id);
                });
              }}
            >
              Plan six evenings
            </Btn>
          </Card>
          {sp && (
            <>
              <Card title={E.habitLabel(sp.habitId)}>
                <Badge>
                  {result.status === "result"
                    ? "Early result"
                    : result.status === "need_more_evenings"
                      ? "More evenings needed"
                      : "No clear difference"}
                </Badge>
                {result.status === "result" ? (
                  <>
                    <h1>{result.effect} mg/dL smaller rise</h1>
                    <p>
                      With habit {result.meanA} · without habit {result.meanB} ·{" "}
                      {result.consistent ? "Same every time" : "Early signal"}
                    </p>
                    <div className="sprint-bars">
                      <div style={{ width: `${Math.max(10, result.meanA!)}%` }}>
                        A {result.meanA}
                      </div>
                      <div style={{ width: `${Math.max(10, result.meanB!)}%` }}>
                        B {result.meanB}
                      </div>
                    </div>
                    <div className="m-actions">
                      <Btn
                        onClick={() => {
                          mutate((s) => {
                            E.patient(s).habitId = sp.habitId;
                            s.sprints.find((r) => r.id === sp.id)!.accepted =
                              true;
                          });
                          toast("Habit adopted for weekly checks");
                        }}
                      >
                        Make it my habit
                      </Btn>
                      <Btn
                        secondary
                        onClick={() => {
                          const allowed = s.links.some(
                            (l) =>
                              l.patientId === pid &&
                              E.allow(s, l.viewer, pid, "sprint"),
                          );
                          if (!allowed) {
                            toast(
                              "No caregiver currently has sprint permission",
                            );
                            return;
                          }
                          share(
                            "Pulse: my own experiment",
                            `${E.habitLabel(sp.habitId)}: post-dinner rise ${result.effect} mg/dL lower · early signal`,
                          );
                        }}
                      >
                        Tell family
                      </Btn>
                    </div>
                  </>
                ) : (
                  <p>
                    {result.status === "need_more_evenings"
                      ? `Valid evenings: A ${result.a}/3 · B ${result.b}/3. Add missing evenings or stop at any time.`
                      : "Try another doctor-approved habit. No change to medicines."}
                  </p>
                )}
                <div className="evening-grid">
                  {evenings.map((e: any, i: number) => (
                    <div className={e.arm === "A" ? "with-habit" : ""} key={i}>
                      <span>
                        {e.arm} · day {e.day}
                      </span>
                      <b>+{e.after - e.before}</b>
                      <small>
                        {e.before} → {e.after}
                      </small>
                    </div>
                  ))}
                </div>
              </Card>
              {sp.status === "active" && (
                <Card title="Tonight’s evening">
                  <p>
                    Tonight’s scheduled arm:{" "}
                    {sp.plan?.find((e: any) => e.day === s.sim.day)?.arm || arm}
                    . A = with habit; B = without.
                  </p>
                  <Select
                    label="Arm (A = with habit)"
                    value={arm}
                    onChange={setArm}
                    options={["A", "B"]}
                  />
                  <Field
                    label="Before dinner mg/dL"
                    type="number"
                    value={before}
                    onChange={setBefore}
                  />
                  <Field
                    label="2-hour after dinner mg/dL"
                    type="number"
                    value={after}
                    onChange={setAfter}
                  />
                  <Field
                    label="Next-morning fasting after A (optional until tomorrow)"
                    type="number"
                    value={fasting}
                    onChange={setFasting}
                  />
                  <Btn
                    secondary
                    onClick={() =>
                      mutate((s) => {
                        s.sprints.find((r) => r.id === sp.id)!.dinnerAt =
                          E.now(s);
                      })
                    }
                  >
                    Dinner finished — start 2-hour timer
                  </Btn>
                  {sp.dinnerAt != null && (
                    <p>
                      {Math.max(0, 120 - (E.now(s) - sp.dinnerAt))} simulated
                      minutes until the after-dinner check
                    </p>
                  )}
                  <p>
                    Check again 2 hours after dinner. After an A evening,
                    sulfonylurea users also log next-morning fasting.
                  </p>
                  <Btn
                    disabled={
                      Number(before) < 20 ||
                      Number(before) > 600 ||
                      Number(after) < 20 ||
                      Number(after) > 600 ||
                      sp.dinnerAt == null ||
                      E.now(s) - sp.dinnerAt < 120
                    }
                    onClick={() => {
                      mutate((s) => {
                        const target = s.sprints.find((r) => r.id === sp.id)!;
                        if (
                          target.evenings.some((e: any) => e.day === s.sim.day)
                        ) {
                          toast("An evening is already recorded today");
                          return;
                        }
                        target.evenings.push({
                          day: s.sim.day,
                          arm:
                            sp.plan?.find((e: any) => e.day === s.sim.day)
                              ?.arm || arm,
                          before: Number(before),
                          after: Number(after),
                          fasting: fasting ? Number(fasting) : null,
                        });
                        E.recordReading(s, {
                          value: Number(before),
                          context: "before",
                        });
                        E.recordReading(s, {
                          value: Number(after),
                          context: "after",
                        });
                      });
                      setBefore("");
                      setAfter("");
                      toast(
                        "Evening saved. Result becomes visible after 22:00.",
                      );
                    }}
                  >
                    Save evening (runs safety)
                  </Btn>
                  <p>
                    Missed evenings stay empty. The plan extends by up to two
                    evenings of the same arm. Extensions used:{" "}
                    {sp.extensions || 0}/2.
                  </p>
                  <Btn
                    secondary
                    onClick={async () => {
                      if (
                        await askConfirm(
                          "Stop this experiment? Your readings will be kept.",
                        )
                      )
                        mutate((s) => {
                          s.sprints.find((r) => r.id === sp.id)!.status =
                            "stopped";
                        });
                    }}
                  >
                    Stop experiment
                  </Btn>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </Shell>
  );
}
function Weekly() {
  const { s, mutate, go, toast, askConfirm, askText } = useApp();
  const [days, setDays] = useState(5);
  const [missed, setMissed] = useState("0");
  const [feeling, setFeeling] = useState("okay");
  const existing = s.weeklyChecks.find(
    (w) =>
      w.patientId === E.patient(s).id &&
      w.window === Math.floor((s.sim.day - 1) / 7) &&
      E.visible(w, s),
  );
  return (
    <Shell title="Sunday check">
      <Card title="One update for this week">
        <p>
          Shared: habit and medicine summary only with permitted family. Mood
          details stay private.
        </p>
        {existing ? (
          <>
            <Badge>Already answered this week</Badge>
            <p>
              Habit {existing.habitDays}/7 days · {E.date(existing.day)}
            </p>
            <Btn onClick={() => go("/patient/home")}>Today</Btn>
          </>
        ) : (
          <>
            <Field
              label="Habit days (0–7)"
              type="number"
              min={0}
              max={7}
              value={days}
              onChange={(v: string) => setDays(Number(v))}
            />
            <Select
              label="Missed tablets"
              value={missed}
              onChange={setMissed}
              options={[
                ["0", "No"],
                ["2", "1–2 times"],
                ["3", "3 or more"],
              ]}
            />
            <Select
              label="How are you feeling?"
              value={feeling}
              onChange={setFeeling}
              options={[
                ["okay", "Fine"],
                ["tired", "Tired"],
                ["unwell", "Unwell"],
                ["low", "Low mood"],
              ]}
            />
            <Btn
              disabled={days < 0 || days > 7}
              onClick={() => {
                mutate((s) =>
                  E.weekly(s, {
                    habitDays: days,
                    missed: Number(missed),
                    feeling,
                    status: s.sim.online ? "synced" : "queued",
                  }),
                );
                toast("Thank you — weekly check saved");
                go(
                  feeling === "low"
                    ? "/patient/mood"
                    : feeling === "unwell"
                      ? "/patient/log"
                      : "/patient/home",
                );
              }}
            >
              Send this week's update
            </Btn>
          </>
        )}
      </Card>
    </Shell>
  );
}
const phq = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];
function Mood() {
  const { s, mutate, go, askConfirm, askText } = useApp();
  const [full, setFull] = useState(false);
  const [answers, setAnswers] = useState<number[]>(Array(9).fill(-1));
  const [saved, setSaved] = useState(false);
  const p = E.patient(s);
  return (
    <Shell title="Private mood check">
      <Card title="Only you · care team with your consent" privateCard>
        {!p.consents.mood ? (
          <>
            <p>Mood consent is off. No answers are collected.</p>
            <Btn onClick={() => go("/patient/privacy")}>Manage consent</Btn>
            <a className="m-btn secondary" href="tel:14416">
              Tele-MANAS 14416
            </a>
          </>
        ) : saved ? (
          <>
            <p>Thank you. Family is never notified about mood.</p>
            {E.phqRule(answers.slice(0, full ? 9 : 2)) === "PHQ9" ? (
              <Btn
                onClick={() => {
                  setFull(true);
                  setSaved(false);
                }}
              >
                Continue with PHQ-9
              </Btn>
            ) : (
              <Btn onClick={() => go("/patient/home")}>Today</Btn>
            )}
          </>
        ) : (
          <>
            <p>
              Over the last two weeks, how often have you been bothered by these
              problems?
            </p>
            {phq.slice(0, full ? 9 : 2).map((question, i) => (
              <Select
                key={question}
                label={`${i + 1}. ${question}`}
                value={answers[i]}
                onChange={(v: string) =>
                  setAnswers((a) => a.map((x, j) => (i === j ? Number(v) : x)))
                }
                options={[
                  ["-1", "Select answer"],
                  ["0", "Not at all"],
                  ["1", "Several days"],
                  ["2", "More than half the days"],
                  ["3", "Nearly every day"],
                ]}
              />
            ))}
            <Toggle
              label="Share mood separately with my doctor"
              on={p.consents.doctorMood}
              onChange={() =>
                mutate((s) => {
                  E.patient(s).consents.doctorMood = !p.consents.doctorMood;
                })
              }
            />
            <Btn
              disabled={answers.slice(0, full ? 9 : 2).some((a) => a < 0)}
              onClick={() => {
                const a = answers.slice(0, full ? 9 : 2);
                const rule = E.phqRule(a);
                mutate((s) => {
                  const r = {
                    id: E.uid("MOOD"),
                    patientId: p.id,
                    ...E.stamp(s),
                    instrument: full ? "PHQ-9" : "PHQ-2",
                    answers: a,
                    score: a.reduce((a, b) => a + b, 0),
                    status: s.sim.online ? "synced" : "queued",
                  };
                  s.moodChecks.push(r);
                  if (rule === "S7" || rule === "P1") E.alert(s, p.id, rule, r);
                });
                if (rule === "S7") go("/patient/crisis");
                else setSaved(true);
              }}
            >
              Save answers privately
            </Btn>
            <p>
              PHQ-9 10–19 requests a care-team contact within 72 hours. This
              prototype does not diagnose.
            </p>
          </>
        )}
      </Card>
    </Shell>
  );
}
function Progress() {
  const { s, go, askConfirm, askText } = useApp();
  const pid = E.patient(s).id,
    pr = E.proof(s, pid);
  const readings = s.readings.filter(
    (r) => r.patientId === pid && r.context === "fasting" && E.visible(r, s),
  );
  return (
    <Shell title="Your progress">
      <Card title="Measured HbA1c change">
        {pr.baseline ? (
          <>
            <strong className="big-number">
              {pr.baseline.value}% →{" "}
              {pr.ready ? pr.latest!.value + "%" : "pending"}
            </strong>
            <SourceBadge row={pr.latest || pr.baseline} source="lab" />
            <p>
              Verified labs only · target set by doctor {E.patient(s).target}%
            </p>
            {pr.ready && <p>Measured change {pr.delta} points</p>}
          </>
        ) : (
          <Empty>Baseline test not yet available.</Empty>
        )}
      </Card>
      <Card title="Fasting readings">
        {readings.length ? (
          <>
            <svg viewBox="0 0 360 180" role="img" aria-label="Fasting readings">
              <polyline
                fill="none"
                stroke="#1F6F5C"
                strokeWidth="3"
                points={readings
                  .map(
                    (r, i) =>
                      `${15 + (i * 330) / Math.max(1, readings.length - 1)},${165 - Math.min(150, r.value / 2)}`,
                  )
                  .join(" ")}
              />
              {readings.map((r, i) => (
                <circle
                  key={r.id}
                  cx={15 + (i * 330) / Math.max(1, readings.length - 1)}
                  cy={165 - Math.min(150, r.value / 2)}
                  r="4"
                  fill="#1F6F5C"
                >
                  <title>
                    {E.date(r.day)}: {r.value} mg/dL
                  </title>
                </circle>
              ))}
            </svg>
            <p>n={readings.length} · mg/dL</p>
            <div className="source-legend">
              {[...new Set(readings.map((r) => r.source as E.DataSource))].map(
                (source) => (
                  <SourceBadge key={source} source={source} />
                ),
              )}
            </div>
          </>
        ) : (
          <Empty>Shows up after your first reading</Empty>
        )}
      </Card>
      <Card title="Experiments">
        {s.sprints
          .filter((r) => r.patientId === pid && E.visible(r, s))
          .map((r) => {
            const result = E.sprintResult(
              r.evenings.filter((e: any) => e.day < s.sim.day),
            );
            return (
              <div className="m-row" key={r.id}>
                <FlaskConical />
                <div>
                  {E.habitLabel(r.habitId)}
                  <small>
                    {result.status === "result"
                      ? `${result.effect} mg/dL · early signal`
                      : result.status}
                  </small>
                </div>
                <Btn secondary onClick={() => go("/patient/jasoos")}>
                  Open
                </Btn>
              </div>
            );
          })}
      </Card>
      <Water />
      <EmbeddedViews>
        <Billing proofOnly />
        {FEATURES.wellnessBand && <YourDay />}
      </EmbeddedViews>
    </Shell>
  );
}
function Records({ initialUpload = false }: { initialUpload?: boolean } = {}) {
  const { s, mutate, toast, route, askConfirm, askText } = useApp();
  const pid = s.session.patientId,
    user = s.session.userId;
  const [tab, setTab] = useState("labs");
  const [preview, setPreview] = useState<E.Row | null>(null);
  const [query, setQuery] = useState("");
  const [upload, setUpload] = useState(
    initialUpload || route.includes("upload"),
  );
  const [sample, setSample] = useState("lab_hba1c");
  const [value, setValue] = useState("8.1");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const caregiver = s.session.role === "caregiver";
  const labs = caregiver
    ? E.view(s, user, pid, "labs", s.labs)
    : s.labs.filter((r) => r.patientId === pid && E.visible(r, s));
  const docs = caregiver
    ? E.view(s, user, pid, "records", s.documents)
    : s.documents.filter((r) => r.patientId === pid && E.visible(r, s));
  const rx = caregiver
    ? E.view(s, user, pid, "medicines", s.prescriptions)
    : s.prescriptions.filter((r) => r.patientId === pid && E.visible(r, s));
  return (
    <Shell title="Records & prescriptions">
      {preview && (
        <RxPreview
          rx={preview}
          p={E.patient(s, pid)}
          doctor={s.doctors[preview.doctorId] || s.doctors["DR-0001"]}
          onClose={() => setPreview(null)}
        />
      )}
      <div className="m-tabs">
        {["labs", "documents", "prescriptions"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <Field label="Search records" value={query} onChange={setQuery} />
      {tab === "labs"
        ? labs.map((l) => (
            <Card key={l.id} title="HbA1c">
              <strong className="big-number">{l.value}%</strong>
              <SourceBadge row={l} />
              <p>
                {E.date(l.day)} ·{" "}
                {l.verified
                  ? "Lab verified"
                  : "Unverified — excluded from proof and metrics"}
              </p>
              <Btn
                secondary
                onClick={() =>
                  download(
                    `lab-${l.id}.txt`,
                    JSON.stringify(l, null, 2),
                    "text/plain",
                  )
                }
              >
                Download details
              </Btn>
            </Card>
          ))
        : tab === "documents"
          ? docs
              .filter((d) =>
                d.title.toLowerCase().includes(query.toLowerCase()),
              )
              .map((d) => (
                <Card key={d.id} title={d.title} privateCard={d.sensitive}>
                  <p>
                    {E.date(d.day)} ·{" "}
                    {d.verified ? "Verified" : "Doctor confirmation pending"} ·
                    uploaded by {roleNames[d.uploader] || d.uploader}
                  </p>
                  {d.sensitive && (
                    <Badge>Sensitive · never shared with family</Badge>
                  )}
                  <Btn
                    secondary
                    onClick={async () => {
                      if (
                        await askConfirm(
                          "Delete this record and its extracted lab values?",
                        )
                      )
                        mutate((s) => {
                          s.documents = s.documents.filter(
                            (r) => r.id !== d.id,
                          );
                          s.labs = s.labs.filter((r) => r.documentId !== d.id);
                        });
                    }}
                  >
                    Delete record
                  </Btn>
                </Card>
              ))
          : rx.map((r) => (
              <Card key={r.id} title={`Prescription v${r.version}`}>
                <p>Dr. Anjali Verma · MD (Medicine) · UPMC/DEMO/48213</p>
                {r.medicines.map((m: any) => (
                  <p key={m.generic}>
                    {m.generic} {m.strength} · {m.pattern} · {m.instruction}
                  </p>
                ))}
                <Btn
                  secondary
                  onClick={() => {
                    download(
                      `prescription-${r.id}.txt`,
                      JSON.stringify(r, null, 2),
                      "text/plain",
                    );
                  }}
                >
                  Download prescription
                </Btn>
                {!caregiver && (
                  <Toggle
                    label="Explicit consent to send this prescription to pharmacy"
                    on={r.pharmacyConsent}
                    onChange={() =>
                      mutate((s) => {
                        s.prescriptions.find(
                          (x) => x.id === r.id,
                        )!.pharmacyConsent = !r.pharmacyConsent;
                      })
                    }
                  />
                )}
              </Card>
            ))}
      {!(tab === "labs" ? labs : tab === "documents" ? docs : rx).length && (
        <Empty />
      )}
      <Btn onClick={() => setUpload(!upload)}>Upload synthetic record</Btn>
      {upload && (
        <Card title="Demo extraction · confirm before saving">
          <p>
            Images are simulated OCR. Unknown uploads are kept as unverified; no
            AI inference is made.
          </p>
          <Select
            label="Sample"
            value={sample}
            onChange={setSample}
            options={[
              ["lab_hba1c", "HbA1c lab"],
              ["rx_paper", "Paper prescription"],
              ["discharge_psychiatry_demo", "Sensitive psychiatry discharge"],
              ["blurry", "Unclear image"],
            ]}
          />
          <input
            aria-label="Choose synthetic record"
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (
                f.size > 10 * 1024 * 1024 ||
                !["image/png", "image/jpeg", "application/pdf"].includes(f.type)
              ) {
                setError("PNG, JPG or PDF only · maximum 10 MB");
                return;
              }
              setError("");
              setFile(f);
            }}
          />
          {sample === "lab_hba1c" && (
            <Field
              label="Confirm extracted HbA1c % (4–15)"
              type="number"
              value={value}
              onChange={setValue}
            />
          )}
          <p role="alert">{error}</p>
          <Btn
            disabled={
              !!error ||
              (sample === "lab_hba1c" &&
                (Number(value) < 4 || Number(value) > 15))
            }
            onClick={() => {
              if (sample === "blurry") {
                toast(
                  "Unclear image — use manual entry or choose a clearer sample",
                );
                return;
              }
              mutate((s) => {
                const id = E.uid("DOC");
                s.documents.push({
                  id,
                  patientId: pid,
                  ...E.stamp(s),
                  title: file?.name || sample,
                  type: sample,
                  sensitive: sample.includes("psychiatry"),
                  verified: false,
                  uploader: user,
                  status: s.sim.online ? "synced" : "queued",
                });
                if (sample === "lab_hba1c")
                  s.labs.push({
                    id: E.uid("LAB"),
                    patientId: pid,
                    ...E.stamp(s),
                    value: Number(value),
                    verified: false,
                    documentId: id,
                  });
              });
              setUpload(false);
              toast("Record saved — doctor confirmation pending");
            }}
          >
            Confirm extracted fields & save
          </Btn>
        </Card>
      )}
    </Shell>
  );
}
function Notes() {
  const { s, mutate, go, toast, askConfirm, askText } = useApp();
  const [text, setText] = useState("");
  const [shared, setShared] = useState(false);
  const [query, setQuery] = useState("");
  const user = s.session.userId,
    pid = s.session.patientId;
  const list = s.notes.filter(
    (n) =>
      n.patientId === pid &&
      E.visible(n, s) &&
      (n.owner === user || (s.session.role === "patient" && n.shared)),
  );
  return (
    <Shell title="My notes">
      <Card title="New note" privateCard={!shared}>
        <p>
          {shared
            ? "Patient and linked doctor will see this note."
            : "Only you can see this note. Private crisis text does not automatically notify others."}
        </p>
        <textarea
          aria-label="Note"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Toggle
          label="Share with doctor (also visible to patient)"
          on={shared}
          onChange={() => setShared(!shared)}
        />
        <Btn
          disabled={!text.trim()}
          onClick={() => {
            let code: string | null = null;
            mutate((s) => {
              code = E.textEvent(s, text, !shared);
              s.notes.push({
                id: E.uid("NOTE"),
                patientId: pid,
                ...E.stamp(s),
                text,
                shared,
                owner: user,
                status: s.sim.online ? "synced" : "queued",
              });
            });
            setText("");
            if (code) go(code === "S7" ? "/patient/crisis" : "/patient/safety");
            else toast("Note saved");
          }}
        >
          Save note
        </Btn>
      </Card>
      <Field label="Search notes" value={query} onChange={setQuery} />
      {list
        .filter((n) => n.text.toLowerCase().includes(query.toLowerCase()))
        .map((n) => (
          <Card key={n.id} privateCard={!n.shared}>
            <p>{n.text}</p>
            <small>
              {E.date(n.day)} · {roleNames[n.owner] || n.owner} ·{" "}
              {n.shared ? "Shared with doctor" : "Private"}
            </small>
            <div className="m-actions">
              <Btn
                secondary
                onClick={async () => {
                  const updated = await askText("Edit note", n.text);
                  if (updated?.trim())
                    mutate((s) => {
                      s.notes.find((r) => r.id === n.id)!.text = updated;
                      const code = E.textEvent(s, updated, !n.shared);
                      if (code)
                        go(
                          code === "S7" ? "/patient/crisis" : "/patient/safety",
                        );
                    });
                }}
              >
                Edit
              </Btn>
              <Btn
                secondary
                onClick={async () => {
                  if (await askConfirm("Delete this note?"))
                    mutate((s) => {
                      s.notes = s.notes.filter((r) => r.id !== n.id);
                    });
                }}
              >
                Delete
              </Btn>
            </div>
          </Card>
        ))}
      {!list.length && <Empty />}
    </Shell>
  );
}
function Privacy() {
  const { s, mutate, toast, askConfirm, askText } = useApp();
  const p = E.patient(s);
  const [person, setPerson] = useState("CG-0001");
  const link = s.links.find((l) => l.viewer === person && l.patientId === p.id);
  const changeConsent = async (key: string) => {
    const deleting = key === "mood" && p.consents.mood;
    mutate((s) => {
      const p = E.patient(s);
      p.consents[key] = !p.consents[key];
      s.consentLog.push({
        id: E.uid("CONSENT"),
        patientId: p.id,
        ...E.stamp(s),
        category: key,
        on: p.consents[key],
        method: "tap",
      });
    });
    if (deleting && (await askConfirm("Delete previous mood answers too?")))
      mutate((s) => {
        s.moodChecks = s.moodChecks.filter((m) => m.patientId !== p.id);
      });
  };
  return (
    <Shell title="Consent & Family sharing">
      <Card title="You decide what is collected">
        <p>
          Optional data can be withdrawn as easily as given. Family is never
          allowed mood, private notes or sensitive records.
        </p>
        {[
          ["readings", "Readings — safety & care (required)"],
          ["medicines", "Medicines — reminders (required)"],
          ["labs", "Lab reports — measured change"],
          ["sprint", "Sprint readings — personal experiments"],
          ["mood", "Mood — private care-team support"],
          ["doctorMood", "Separate mood sharing with doctor"],
          ["doctor", "Share records with linked doctor"],
          ["family", "Share selected categories with family"],
          [
            "crisisContact",
            "Notify local contact only when I choose “not safe”",
          ],
          ["band", "Band — wellness trends"],
          ["meal", "Meal photos — optional record"],
          ["research", "Research — optional synthetic aggregate"],
        ].map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            on={p.consents[key]}
            disabled={["readings", "medicines"].includes(key)}
            onChange={() => changeConsent(key)}
          />
        ))}
      </Card>
      <Card title="Family permissions">
        <Select
          label="Family member"
          value={person}
          onChange={setPerson}
          options={[
            ["CG-0001", "Amit (son · Pune)"],
            ["CG-0002", "Neha (daughter · Delhi)"],
          ]}
        />
        {link?.status === "approved" ? (
          <>
            {E.categories.map((category) => (
              <Toggle
                key={category}
                label={category}
                on={link.permissions[category]}
                onChange={() =>
                  mutate((s) => {
                    const l = s.links.find((l) => l.id === link.id)!;
                    l.permissions[category] = !l.permissions[category];
                    s.consentLog.push({
                      id: E.uid("DIAL"),
                      patientId: p.id,
                      ...E.stamp(s),
                      viewer: person,
                      category,
                      on: l.permissions[category],
                    });
                  })
                }
              />
            ))}
            <p className="private-text">
              🔒 Mood · private notes · sensitive documents: never available to
              family.
            </p>
            <Btn
              danger
              onClick={async () => {
                if (
                  await askConfirm(
                    `Remove ${roleNames[person]}? Access ends immediately.`,
                  )
                )
                  mutate((s) => {
                    s.links.find((l) => l.id === link.id)!.status = "revoked";
                  });
              }}
            >
              Remove access
            </Btn>
          </>
        ) : (
          <Empty>This family member has no active access.</Empty>
        )}
      </Card>
      <Card title="Access log">
        {s.accessLog
          .filter((l) => l.patientId === p.id)
          .slice(-20)
          .reverse()
          .map((l) => (
            <p key={l.id}>
              {roleNames[l.viewer] || l.viewer} · {l.category} · {E.date(l.day)}{" "}
              {l.time}
            </p>
          ))}
        {!s.accessLog.length && (
          <Empty>No cross-role views have been logged yet.</Empty>
        )}
      </Card>
    </Shell>
  );
}
function MyData() {
  const { s, mutate, go, toast, askConfirm, askText } = useApp();
  const [confirmText, setConfirmText] = useState("");
  const [nominee, setNominee] = useState("");
  const [complaint, setComplaint] = useState("");
  const pid = s.session.patientId;
  return (
    <Shell title="My data & rights">
      <Card title="Access and correction">
        <Btn
          onClick={() => {
            const result: any = { patient: E.patient(s) };
            for (const [key, value] of Object.entries(s))
              if (Array.isArray(value))
                result[key] = value.filter((r: any) => r.patientId === pid);
            download("pulse-my-data.json", JSON.stringify(result, null, 2));
          }}
        >
          Download my data
        </Btn>
        <p>Correct a glucose reading below. Clinical corrections are logged.</p>
        {s.readings
          .filter((r) => r.patientId === pid && E.visible(r, s))
          .slice(-5)
          .map((r) => (
            <div className="m-row" key={r.id}>
              <span>
                {r.value} mg/dL · {E.date(r.day)}
                <SourceBadge row={r} />
              </span>
              <Btn
                secondary
                onClick={async () => {
                  const value = await askText(
                    "Correct mg/dL (20–600)",
                    String(r.value),
                  );
                  if (value && Number(value) >= 20 && Number(value) <= 600)
                    mutate((s) => {
                      s.readings.find((x) => x.id === r.id)!.value =
                        Number(value);
                      s.consentLog.push({
                        id: E.uid("CORRECTION"),
                        patientId: pid,
                        ...E.stamp(s),
                        category: "clinical correction",
                        recordId: r.id,
                        value: Number(value),
                      });
                    });
                }}
              >
                Correct
              </Btn>
            </div>
          ))}
      </Card>
      <Card title="Nominee">
        <Field
          label="Nominee name & contact"
          value={nominee}
          onChange={setNominee}
        />
        <Btn
          disabled={nominee.trim().length < 2}
          onClick={() => {
            mutate((s) => {
              (E.patient(s) as any).nominee = nominee;
            });
            toast("Nominee saved");
          }}
        >
          Save nominee
        </Btn>
      </Card>
      <Card title="Grievance">
        <p>
          Reply aim: 7 days. Complaints may also be taken to the Data Protection
          Board of India. This is a demo ticket, not a live submission.
        </p>
        <textarea
          aria-label="Grievance"
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
        />
        <Btn
          disabled={!complaint.trim()}
          onClick={() => {
            const id = E.uid("TICKET");
            mutate((s) =>
              s.grievances.push({
                id,
                patientId: pid,
                ...E.stamp(s),
                text: complaint,
                status: "open",
              }),
            );
            toast(`Demo ticket ${id}`);
            setComplaint("");
          }}
        >
          Create demo ticket
        </Btn>
        {s.grievances
          .filter((g) => g.patientId === pid)
          .map((g) => (
            <p key={g.id}>
              {g.id} · {g.status}
            </p>
          ))}
      </Card>
      <Card title="Delete demo account">
        <p>
          Family and doctor views lose access. Signed prescriptions issued by a
          doctor remain as a restricted issuer record. Enter DELETE to confirm.
        </p>
        <Field
          label="Confirmation"
          value={confirmText}
          onChange={setConfirmText}
        />
        <Btn
          danger
          disabled={confirmText !== "DELETE"}
          onClick={async () => {
            if (
              !(await askConfirm(
                "Permanently erase this synthetic patient account?",
              ))
            )
              return;
            mutate((s) => {
              E.patient(s).deleted = true;
              for (const key of [
                "readings",
                "labs",
                "sprints",
                "weeklyChecks",
                "moodChecks",
                "notes",
                "documents",
                "messages",
                "alerts",
                "notifications",
                "band",
                "water",
                "payments",
                "appointments",
                "testOrders",
                "outbound",
              ] as const)
                s[key] = s[key].filter((r) => r.patientId !== pid);
              s.links = s.links.filter((r) => r.patientId !== pid);
              s.session.role = null;
              s.session.userId = "";
            });
            go("/");
            toast("Demo account erased. Receipt recorded.");
          }}
        >
          Delete account
        </Btn>
      </Card>
    </Shell>
  );
}
function Billing({ proofOnly = false }: { proofOnly?: boolean }) {
  const { s, mutate, toast, go, askConfirm, askText } = useApp();
  const pid = s.session.patientId,
    pr = E.proof(s, pid);
  const paid = s.payments.find(
    (p) => p.patientId === pid && E.visible(p, s) && p.status === "paid",
  );
  const failed = s.payments
    .filter(
      (p) => p.patientId === pid && p.status === "failed" && E.visible(p, s),
    )
    .at(-1);
  const [upi, setUpi] = useState("amit@demo");
  const [waiting, setWaiting] = useState(false);
  const price = pr.guarantee ? 0 : pr.maintenance ? 1499 : 1199;
  const pay = (success: boolean) => {
    mutate((s) => {
      if (
        success &&
        s.payments.some((p) => p.patientId === pid && p.status === "paid")
      )
        return;
      const payment = s.payments.find(
        (p) => p.patientId === pid && p.status === "pending",
      );
      if (payment) {
        payment.status = success ? "paid" : "failed";
        payment.invoice = success ? E.uid("INVOICE") : undefined;
      } else
        s.payments.push({
          id: E.uid("PAY"),
          patientId: pid,
          ...E.stamp(s),
          amount: price,
          status: success ? "paid" : "failed",
          invoice: success ? E.uid("INVOICE") : undefined,
        });
      E.notify(
        s,
        pid,
        pid,
        "proof",
        success ? "Renewal paid" : "Payment failed",
        success ? "Next cycle reserved" : "Safety alerts continue for 30 days",
      );
    });
    setWaiting(false);
    toast(
      success
        ? "Synthetic payment successful"
        : "Synthetic payment failed — retry available",
    );
  };
  return (
    <Shell title={proofOnly ? "Day-90 Proof Card" : "Payments & billing"}>
      <Card title="Measured change in HbA1c">
        {pr.ready ? (
          <>
            <Badge>Synthetic demo · verified lab values</Badge>
            <SourceBadge row={pr.latest!} source="lab" />
            <div className="a1c-values">
              <strong>{pr.baseline!.value}%</strong>
              <span>→</span>
              <strong>{pr.latest!.value}%</strong>
            </div>
            <p>
              Measured change: {pr.delta} points · {pr.checks}/13 weekly checks
            </p>
            <p>Not a treatment recommendation. Your doctor sets your target.</p>
            <Btn
              secondary
              onClick={() =>
                share(
                  "Pulse Proof Card",
                  `Measured HbA1c change ${pr.delta} points over 90 days · synthetic demo`,
                )
              }
            >
              Share permitted Proof Card
            </Btn>
          </>
        ) : (
          <Empty>
            Proof is available after the verified follow-up result. Baseline{" "}
            {pr.baseline?.value ?? "not recorded"} · current simulated day{" "}
            {s.sim.day}.
          </Empty>
        )}
      </Card>
      {!proofOnly && (
        <>
          {failed && (
            <Card title="Payment retry available">
              <p>
                Safety features continue.{" "}
                {Math.max(0, 30 - (s.sim.day - failed.day))} days of grace
                remain. Safety rules and crisis support stay accessible.
              </p>
            </Card>
          )}
          <Card
            title={
              pr.maintenance ? "Maintenance · 180 days" : "Care Cycle · 90 days"
            }
          >
            <strong className="big-number">
              ₹{price.toLocaleString("en-IN")}
            </strong>
            <p>
              {pr.guarantee
                ? "Eligible for a free next cycle: change less than 0.3 points and at least eight checks."
                : "Includes one home HbA1c test. Renewal requires an explicit payment."}
            </p>
            <p>Payer: Amit · synthetic UPI · no real money moves.</p>
            {paid ? (
              <>
                <Badge>Paid · {paid.invoice}</Badge>
                <Btn
                  secondary
                  onClick={() =>
                    download(
                      "pulse-invoice.txt",
                      `${paid.invoice}\n₹${paid.amount}\nSynthetic UPI payment\nGST as applicable — demo`,
                      "text/plain",
                    )
                  }
                >
                  Download invoice
                </Btn>
              </>
            ) : waiting ? (
              <>
                <Badge>Waiting for demo UPI approval</Badge>
                <div className="m-actions">
                  <Btn disabled={!s.sim.online} onClick={() => pay(true)}>
                    Simulate approval
                  </Btn>
                  <Btn secondary onClick={() => pay(false)}>
                    Simulate failure
                  </Btn>
                  <Btn secondary onClick={() => setWaiting(false)}>
                    Back
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <Field label="UPI ID" value={upi} onChange={setUpi} />
                <Btn
                  disabled={!/^[\w.-]+@[\w.-]+$/.test(upi) || !s.sim.online}
                  onClick={() => {
                    mutate((s) => {
                      if (
                        !s.payments.some(
                          (p) => p.patientId === pid && p.status === "pending",
                        )
                      )
                        s.payments.push({
                          id: E.uid("PAY"),
                          patientId: pid,
                          ...E.stamp(s),
                          amount: price,
                          status: "pending",
                        });
                    });
                    setWaiting(true);
                  }}
                >
                  Pay / renew in demo
                </Btn>
              </>
            )}
          </Card>
          <Btn secondary onClick={() => go(`/${s.session.role}/home`)}>
            Home
          </Btn>
        </>
      )}
    </Shell>
  );
}
function Myth() {
  const { s, mutate, go, toast, askConfirm, askText } = useApp();
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const pid = s.session.patientId;
  return (
    <Shell title="True or false? · Myth buster">
      <Card title="Check a health claim">
        <textarea
          aria-label="Claim to check"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a forward here"
        />
        <Btn
          disabled={!text.trim()}
          onClick={() => {
            let safety: string | null = null;
            const verdict = E.mythMatch(text);
            mutate((s) => {
              safety = E.textEvent(s, text);
              s.myths.push({
                id: E.uid("MYTH"),
                patientId: pid,
                ...E.stamp(s),
                claim: text,
                verdict,
                status: verdict === "unverified" ? "waiting" : "published",
                askedBy: s.session.userId,
              });
            });
            if (safety) {
              if (s.session.role === "patient")
                go(safety === "S7" ? "/patient/crisis" : "/patient/safety");
              else
                toast(
                  "Safety guidance: contact patient / local help. A care-team item was created.",
                );
            }
            setResult(verdict);
          }}
        >
          Check claim
        </Btn>
      </Card>
      {result && (
        <Card
          title={
            result === "true"
              ? "True"
              : result === "false"
                ? "False"
                : result === "misleading"
                  ? "Partly true"
                  : result === "not_health"
                    ? "Not a health claim"
                    : "Not checked yet"
          }
        >
          <p>{text}</p>
          <p>
            {result === "unverified"
              ? "Sent to a human demo reviewer. We’ll notify you after publishing."
              : result === "false"
                ? "Only change or stop medicines with your doctor."
                : result === "true"
                  ? "Doctor-reviewed fixed demo template. Personal meter results are early signals."
                  : "Ask your doctor about this claim."}
          </p>
          <Badge>Fixed demo knowledge base · no patient-facing AI</Badge>
          <Btn
            secondary
            onClick={() =>
              share(
                "Pulse myth card",
                `${result}: ${
                  result === "false"
                    ? "Only your doctor changes medicines."
                    : "Demo reviewer — health claim checked."
                }`,
              )
            }
          >
            Share card without patient details
          </Btn>
        </Card>
      )}
      <Card title="My checks">
        {s.myths
          .filter(
            (m) =>
              m.patientId === pid &&
              E.visible(m, s) &&
              (!m.askedBy || m.askedBy === s.session.userId),
          )
          .map((m) => (
            <p key={m.id}>
              {m.claim} · <b>{m.verdict}</b>
              {m.explanation && ` — ${m.explanation}`}
            </p>
          ))}
      </Card>
    </Shell>
  );
}
function Notifications() {
  const { s, mutate, go, askConfirm, askText } = useApp();
  const [filter, setFilter] = useState("all");
  const user = s.session.userId,
    pid = s.session.patientId;
  const list = s.notifications.filter(
    (n) =>
      n.audience === user &&
      E.visible(n, s) &&
      n.status !== "queued" &&
      (s.session.role !== "caregiver" ||
        E.allow(s, user, n.patientId, n.category)),
  );
  const filtered = list
    .filter((n) => filter === "all" || n.category === filter)
    .sort(
      (a, b) =>
        Number(b.category === "alerts") - Number(a.category === "alerts") ||
        E.minutes(b.day, b.time) - E.minutes(a.day, a.time),
    );
  return (
    <Shell title="Notifications">
      <div className="m-tabs">
        {["all", "alerts", "medicines", "tests", "message", "summary"].map(
          (t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={filter === t ? "active" : ""}
            >
              {t}
            </button>
          ),
        )}
      </div>
      <Btn
        secondary
        onClick={() =>
          mutate((s) => {
            s.notifications
              .filter((n) => n.audience === user && E.visible(n, s))
              .forEach((n) => (n.read = true));
          })
        }
      >
        Mark all read
      </Btn>
      {filtered.length ? (
        filtered.slice().map((n) => (
          <button
            key={n.id}
            className="notification-card"
            onClick={() => {
              mutate((s) => {
                s.notifications.find((r) => r.id === n.id)!.read = true;
                s.session.patientId = n.patientId;
              });
              go(`/${s.session.role}/${n.link || "home"}`);
            }}
          >
            <Bell size={20} />
            <div>
              <b>
                {n.title} {!n.read && "●"}
              </b>
              <p>{n.body}</p>
              <small>
                {E.date(n.day)} {n.time}
                {n.delayed ? " · delayed by offline connection" : ""}
              </small>
            </div>
          </button>
        ))
      ) : (
        <Empty>No permitted notifications here.</Empty>
      )}
    </Shell>
  );
}
function Caregiver({ alertsOnly = false }: { alertsOnly?: boolean } = {}) {
  const { s, mutate, go, askConfirm, askText } = useApp();
  const pid = s.session.patientId,
    user = s.session.userId;
  const p = E.patient(s);
  const members = s.links.filter(
    (l) =>
      l.viewer === user &&
      l.status === "approved" &&
      E.patient(s, l.patientId) &&
      !E.patient(s, l.patientId).deleted,
  );
  const permitted = !!p && E.connected(s, user, pid);
  const alerts = E.view(s, user, pid, "alerts", s.alerts).filter(
    (a) => !a.private && a.status !== "resolved",
  );
  const checks = E.view(s, user, pid, "summary", s.weeklyChecks);
  const sprints = E.view(s, user, pid, "sprint", s.sprints);
  const appointments = E.view(s, user, pid, "tests", s.appointments);
  const pr = E.allow(s, user, pid, "proof") ? E.proof(s, pid) : null;
  const encourage = checks.some(
    (w) =>
      w.day >= 22 && w.day < 29 && s.sim.day - w.day < 7 && w.habitDays < 4,
  );
  if (alertsOnly)
    return (
      <Shell title="Shared safety alerts">
        {alerts.map((a) => (
          <Card key={a.id} title={`Safety ${a.rule}`}>
            <SourceBadge row={s.readings.find((r) => r.id === a.source)} />
            <p>
              {a.value ?? ""} {a.value ? "mg/dL" : ""} · {a.status} · {a.owner}
            </p>
            <ul className="timeline">
              {a.timeline.map((t: any, i: number) => (
                <li key={i}>
                  {t.time} · {t.text}
                </li>
              ))}
            </ul>
            <div className="m-actions">
              <a className="m-btn" href={`tel:${p.mobile}`}>
                Call patient
              </a>
              <a
                className="m-btn secondary"
                href={`tel:${E.safetyContact(s, pid).phone}`}
              >
                Call local contact
              </a>
              <a className="m-btn secondary" href="tel:9876500002">
                Call clinic
              </a>
              <Btn
                secondary
                onClick={() =>
                  mutate((s) => {
                    const target = s.alerts.find((r) => r.id === a.id)!;
                    if (target.status === "open") {
                      target.status = "acknowledged";
                      target.owner =
                        s.users?.[user]?.name ||
                        roleNames[user]?.split(" · ")[0] ||
                        "Caregiver";
                      target.timeline.push({
                        ...E.stamp(s),
                        text: `${target.owner} is handling this`,
                      });
                    }
                  })
                }
              >
                I’ve spoken to them
              </Btn>
            </div>
            {s.users?.[user]?.city === "Kanpur" ? (
              <a className="m-btn danger" href="tel:112">
                Call 112
              </a>
            ) : (
              <p className="m-hint">
                You’re outside Kanpur. The person near them should call 112.
              </p>
            )}
          </Card>
        ))}
        {!alerts.length && <Empty>No active shared alerts.</Empty>}
      </Shell>
    );
  return (
    <Shell title="Family care">
      <div className="family-switch">
        {members.map((l) => (
          <button
            key={l.id}
            className={l.patientId === pid ? "active" : ""}
            onClick={() =>
              mutate((s) => {
                s.session.patientId = l.patientId;
              })
            }
          >
            <Users size={20} />
            {E.patient(s, l.patientId).name.split(" ")[0]}
          </button>
        ))}
        <button onClick={() => go("/caregiver/connect")}>+ Connect</button>
      </div>
      {!permitted ? (
        <Card title="Sharing paused or access withdrawn">
          <p>
            This family member controls access on their phone. No patient data
            is available.
          </p>
          <Btn onClick={() => go("/caregiver/choose")}>Family members</Btn>
        </Card>
      ) : (
        <>
          <div className="m-hero">
            <span>YOU’RE PART OF THEIR CIRCLE</span>
            <h1>{p.name.split(" ")[0]}’s week</h1>
            <Badge
              tone={alerts.some((a) => a.priority === "P0") ? "urgent" : ""}
            >
              {alerts.some((a) => a.priority === "P0") ? "Urgent" : "Steady"}
            </Badge>
            <p>
              Day {s.sim.day - p.start} · latest habit update{" "}
              {checks.at(-1)?.habitDays ?? "—"}/7 days
            </p>
          </div>
          {alerts.map((a) => (
            <Card key={a.id} title={`Safety ${a.rule}`}>
              <SourceBadge row={s.readings.find((r) => r.id === a.source)} />
              <p>
                {a.value ?? ""} {a.value ? "mg/dL" : ""} · {a.status} ·{" "}
                {a.owner}
              </p>
              <ul className="timeline">
                {a.timeline.map((t: any, i: number) => (
                  <li key={i}>
                    {t.time} · {t.text}
                  </li>
                ))}
              </ul>
              <div className="m-actions">
                <a className="m-btn" href={`tel:${p.mobile}`}>
                  Call patient
                </a>
                <a
                  className="m-btn secondary"
                  href={`tel:${E.safetyContact(s, pid).phone}`}
                >
                  Call local contact
                </a>
                <a className="m-btn secondary" href="tel:9876500002">
                  Call clinic
                </a>
                <Btn
                  secondary
                  onClick={() =>
                    mutate((s) => {
                      const target = s.alerts.find((r) => r.id === a.id)!;
                      if (target.status === "open") {
                        target.status = "acknowledged";
                        target.owner =
                          s.users?.[user]?.name ||
                          roleNames[user]?.split(" · ")[0] ||
                          "Caregiver";
                        target.timeline.push({
                          ...E.stamp(s),
                          text: `${target.owner} is handling this`,
                        });
                      }
                    })
                  }
                >
                  I’ve spoken to them
                </Btn>
              </div>
              {s.users?.[user]?.city === "Kanpur" ? (
                <a className="m-btn danger" href="tel:112">
                  Call 112
                </a>
              ) : (
                <p className="m-hint">
                  You’re outside Kanpur. The person near them should call 112.
                </p>
              )}
            </Card>
          ))}
          {E.allow(s, user, pid, "medicines") ? (
            <DoseList pid={pid} caregiver />
          ) : (
            <Card title="Medicines not shared">
              <p>Only categories the patient approved are shown.</p>
            </Card>
          )}
          {E.allow(s, user, pid, "wellness") && DS.summary(s, pid) && (
            <Card title="Weekly wellness">
              <p>From band · wellness only · Demo</p>
              <p>{DS.summary(s, pid)}</p>
            </Card>
          )}
          {encourage && (
            <Card title="Encourage">
              <p>
                “I noticed your walk evenings helped. A short call and one small
                step are enough this week.”
              </p>
              <a className="m-btn" href={`tel:${p.mobile}`}>
                Call patient
              </a>
            </Card>
          )}
          <Card title="Upcoming">
            {appointments.map((a) => (
              <p key={a.id}>
                {E.date(a.slotDay)} {a.slot} · {a.mode} · {a.status}
              </p>
            ))}
            {!appointments.length && <Empty />}
          </Card>
          {sprints.map((sp) => {
            const r = E.sprintResult(
              sp.evenings.filter((e: any) => e.day < s.sim.day),
            );
            return r.status === "result" ? (
              <Card
                key={sp.id}
                title={
                  sp.habitId === "veg_dal_first"
                    ? "Kitchen card"
                    : "What worked"
                }
              >
                <p>
                  {E.habitLabel(sp.habitId)} · post-dinner rise {r.effect} mg/dL
                  lower · early signal
                </p>
                <Btn
                  secondary
                  onClick={() =>
                    share("Family habit card", E.habitLabel(sp.habitId))
                  }
                >
                  Send habit to family cook
                </Btn>
              </Card>
            ) : null;
          })}
          {pr?.ready && (
            <Card title="Day-90 Proof">
              <p>
                <SourceBadge row={pr.latest!} source="lab" />{" "}
                {pr.baseline!.value}% → {pr.latest!.value}% · change {pr.delta}{" "}
                points
              </p>
              <Btn onClick={() => go("/caregiver/billing")}>Renew care</Btn>
            </Card>
          )}
        </>
      )}
    </Shell>
  );
}
function Connect() {
  const { s, mutate, toast, go, askConfirm, askText } = useApp();
  const [id, setId] = useState("");
  const [digits, setDigits] = useState("");
  const [name, setName] = useState("Vikas, nephew");
  const [sent, setSent] = useState(false);
  return (
    <Shell title="Connect family">
      <Card title="Request access">
        <p>
          The patient must approve on their own phone. Mood, private notes and
          sensitive documents are never included.
        </p>
        {sent ? (
          <>
            <Badge>Request submitted</Badge>
            <p>If the details match, they’ll get a request.</p>
            <Btn onClick={() => go("/caregiver/choose")}>Family members</Btn>
          </>
        ) : (
          <>
            <Field label="Patient Pulse ID" value={id} onChange={setId} />
            <Field
              label="Last four digits of patient mobile"
              value={digits}
              onChange={(v: string) =>
                setDigits(v.replace(/\D/g, "").slice(0, 4))
              }
            />
            <Field label="Relationship" value={name} onChange={setName} />
            <Btn
              disabled={
                !/^PUL-KNP-\d{4}$/.test(id) ||
                digits.length !== 4 ||
                !name.trim()
              }
              onClick={() => {
                mutate((s) => {
                  const p = E.patient(s, id);
                  if (
                    p &&
                    !p.deleted &&
                    p.mobile.endsWith(digits) &&
                    !s.links.some(
                      (l) =>
                        l.viewer === s.session.userId &&
                        l.patientId === id &&
                        ["pending", "approved"].includes(l.status!),
                    )
                  )
                    s.links.push({
                      id: E.uid("LINK"),
                      patientId: id,
                      ...E.stamp(s),
                      viewer: s.session.userId,
                      name,
                      status: "pending",
                      permissions: {},
                    });
                });
                setSent(true);
              }}
            >
              Send request
            </Btn>
          </>
        )}
      </Card>
    </Shell>
  );
}
function Messages() {
  const { s, mutate, go, toast, askConfirm, askText } = useApp();
  const [text, setText] = useState("");
  const pid = s.session.patientId;
  const doctor = s.session.role === "doctor";
  const permitted = doctor
    ? E.allow(s, s.session.userId, pid, "readings")
    : !!s.doctors[E.patient(s, pid).doctorId]?.verified &&
      E.patient(s, pid).consents.doctor;
  const messages = permitted
    ? s.messages.filter(
        (m) => m.patientId === pid && E.visible(m, s) && m.status !== "queued",
      )
    : [];
  return (
    <Shell title="Doctor messages">
      <Card title="Dr. Anjali Verma · MD (Medicine)">
        <Badge>Verified · UPMC/DEMO/48213</Badge>
        <p>
          Replies within {s.settings.replyHours} hours · doctor/clinic team
          replies, never AI. For emergencies call 112 or 14416.
        </p>
        {!permitted ? (
          <Empty>Access withdrawn or verification pending.</Empty>
        ) : (
          <>
            <div className="message-thread">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.from.startsWith("DR")
                      ? "doctor-message"
                      : "patient-message"
                  }
                >
                  <b>
                    {m.from.startsWith("DR")
                      ? "Dr. Verma"
                      : E.patient(s, pid).name}
                  </b>
                  <p>{m.text}</p>
                  <small>
                    {E.date(m.day)} {m.time}
                  </small>
                </div>
              ))}
            </div>
            <textarea
              aria-label="Message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message"
            />
            <Btn
              disabled={!text.trim()}
              onClick={() => {
                let code: string | null = null;
                mutate((s) => {
                  code = E.textEvent(s, text, false, pid);
                  s.messages.push({
                    id: E.uid("MSG"),
                    patientId: pid,
                    ...E.stamp(s),
                    from: s.session.userId,
                    text,
                    status: s.sim.online ? "sent" : "queued",
                  });
                  E.notify(
                    s,
                    pid,
                    doctor ? pid : E.patient(s, pid).doctorId,
                    "message",
                    doctor ? "Dr. Verma replied" : "Patient message",
                    "New message in your thread",
                    undefined,
                    "messages",
                  );
                });
                setText("");
                if (code && !doctor)
                  go(code === "S7" ? "/patient/crisis" : "/patient/safety");
                else toast("Message saved");
              }}
            >
              Send message
            </Btn>
            <Btn
              secondary
              onClick={() => go(`/${s.session.role}/appointments`)}
            >
              Appointments
            </Btn>
            {!doctor && (
              <Btn secondary onClick={() => go("/patient/tests")}>
                Recommended tests
              </Btn>
            )}
          </>
        )}
      </Card>
    </Shell>
  );
}
function Appointments() {
  const { s, mutate, toast, askConfirm, askText } = useApp();
  const doctor = s.session.role === "doctor";
  const [day, setDay] = useState(s.sim.day);
  const [slot, setSlot] = useState("11:30");
  const [mode, setMode] = useState("in-clinic");
  const [reason, setReason] = useState("Review");
  const pid = s.session.patientId;
  const list = s.appointments.filter(
    (a) =>
      E.visible(a, s) &&
      (doctor
        ? E.allow(s, s.session.userId, a.patientId, "tests")
        : a.patientId === pid),
  );
  const booked = s.appointments.some(
    (a) =>
      a.slotDay === day &&
      a.slot === slot &&
      !["cancelled", "no-show"].includes(a.status!),
  );
  const past = E.minutes(day, slot) < E.now(s);
  return (
    <Shell title="Appointments">
      <Card title="Book a clinic slot">
        <Field
          label="Simulated day"
          type="number"
          min={s.sim.day}
          max={120}
          value={day}
          onChange={(v: string) => setDay(Number(v))}
        />
        <Select
          label="Slot (demo clinic hours)"
          value={slot}
          onChange={setSlot}
          options={[
            "09:00",
            "09:30",
            "10:00",
            "10:30",
            "11:00",
            "11:30",
            "12:00",
            "16:00",
            "16:30",
            "17:00",
          ]}
        />
        <Select
          label="Consultation mode"
          value={mode}
          onChange={setMode}
          options={["in-clinic", "video", "audio"]}
        />
        <Field label="Reason" value={reason} onChange={setReason} />
        {booked && <p role="alert">This slot is already booked.</p>}
        <Btn
          disabled={booked || past || !reason.trim() || day > 120}
          onClick={() => {
            mutate((s) => {
              if (
                s.appointments.some(
                  (a) =>
                    a.slotDay === day &&
                    a.slot === slot &&
                    a.status !== "cancelled",
                )
              )
                return;
              s.appointments.push({
                id: E.uid("APT"),
                patientId: pid,
                ...E.stamp(s),
                slotDay: day,
                slot,
                mode,
                reason,
                status: doctor ? "confirmed" : "requested",
                identity: false,
              });
              E.notify(
                s,
                pid,
                pid,
                "tests",
                "Appointment requested",
                `${E.date(day)} ${slot}`,
                undefined,
                "appointments",
              );
            });
            toast("Appointment saved");
          }}
        >
          Book slot
        </Btn>
      </Card>
      {list.map((a) => (
        <Card
          key={a.id}
          title={`${E.patient(s, a.patientId).name} · ${E.date(a.slotDay)} ${a.slot}`}
        >
          <p>
            {a.mode} · {a.reason} · {a.status}
          </p>
          {doctor && a.mode === "video" && (
            <Toggle
              label="Patient identity confirmed"
              on={a.identity}
              onChange={() =>
                mutate((s) => {
                  s.appointments.find((r) => r.id === a.id)!.identity =
                    !a.identity;
                })
              }
            />
          )}
          <div className="m-actions">
            {doctor && ["requested", "confirmed"].includes(a.status!) && (
              <>
                <Btn
                  onClick={() =>
                    mutate((s) => {
                      s.appointments.find((r) => r.id === a.id)!.status =
                        "confirmed";
                      E.notify(
                        s,
                        a.patientId,
                        a.patientId,
                        "tests",
                        "Appointment confirmed",
                        a.slot,
                        undefined,
                        "appointments",
                      );
                    })
                  }
                >
                  Confirm
                </Btn>
                <Btn
                  secondary
                  disabled={a.mode === "video" && !a.identity}
                  onClick={() =>
                    mutate((s) => {
                      s.appointments.find((r) => r.id === a.id)!.status =
                        "completed";
                      if (a.mode === "in-clinic")
                        E.patient(s, a.patientId).inPerson = s.sim.day;
                    })
                  }
                >
                  Complete consultation
                </Btn>
                <Btn
                  secondary
                  onClick={() =>
                    mutate((s) => {
                      s.appointments.find((r) => r.id === a.id)!.status =
                        "no-show";
                    })
                  }
                >
                  No-show
                </Btn>
              </>
            )}
            {!["cancelled", "completed"].includes(a.status!) && (
              <>
                <Btn
                  secondary
                  onClick={async () => {
                    const newDay = await askText(
                      "New simulated day",
                      String(a.slotDay),
                    );
                    if (
                      newDay !== null &&
                      Number(newDay) >= s.sim.day &&
                      Number(newDay) <= 120
                    ) {
                      if (
                        s.appointments.some(
                          (r) =>
                            r.id !== a.id &&
                            r.slotDay === Number(newDay) &&
                            r.slot === a.slot &&
                            r.status !== "cancelled",
                        )
                      ) {
                        toast("Slot already booked");
                        return;
                      }
                      mutate((s) => {
                        s.appointments.find((r) => r.id === a.id)!.slotDay =
                          Number(newDay);
                        E.notify(
                          s,
                          a.patientId,
                          a.patientId,
                          "tests",
                          "Appointment rescheduled",
                          E.date(Number(newDay)),
                          undefined,
                          "appointments",
                        );
                      });
                    }
                  }}
                >
                  Reschedule
                </Btn>
                <Btn
                  secondary
                  onClick={async () => {
                    const why = await askText("Cancellation reason");
                    if (
                      why?.trim() &&
                      (await askConfirm("Cancel appointment?"))
                    )
                      mutate((s) => {
                        const target = s.appointments.find(
                          (r) => r.id === a.id,
                        )!;
                        target.status = "cancelled";
                        target.cancelReason = why;
                        E.notify(
                          s,
                          a.patientId,
                          a.patientId,
                          "tests",
                          "Appointment cancelled",
                          why,
                          undefined,
                          "appointments",
                        );
                      });
                  }}
                >
                  Cancel
                </Btn>
              </>
            )}
          </div>
        </Card>
      ))}
      {!list.length && <Empty />}
    </Shell>
  );
}
function DoctorHome() {
  const { s, go, mutate, askConfirm, askText } = useApp();
  const id = s.session.userId;
  const doctor = s.doctors[id];
  const patients = s.patients.filter((p) => E.allow(s, id, p.id, "readings"));
  const alerts = s.alerts.filter(
    (a) =>
      a.delivery !== "queued" &&
      E.visible(a, s) &&
      a.status !== "resolved" &&
      E.allow(s, id, a.patientId, a.private ? "mood" : "readings"),
  );
  return (
    <Shell title="Clinic overview">
      <div className="m-hero">
        <span>VERMA DIABETES & FAMILY CLINIC · KANPUR</span>
        <h1>{doctor.name}</h1>
        <p>MD (Medicine) · UPMC/DEMO/48213</p>
        <Badge>{doctor.verified ? "Verified" : "Verification pending"}</Badge>
      </div>
      {!doctor.verified ? (
        <Card title="Patient data and prescribing unlock after verification">
          <Btn
            onClick={() =>
              mutate((s) => {
                s.doctors[id].verified = true;
              })
            }
          >
            Simulate approval
          </Btn>
        </Card>
      ) : (
        <>
          <div className="m-grid">
            <Card title="Linked patients">
              <strong className="big-number">{patients.length}</strong>
              <Btn secondary onClick={() => go("/doctor/patients")}>
                Open registry
              </Btn>
            </Card>
            <Card title="Needs review">
              <strong className="big-number">{alerts.length}</strong>
              <p>Rule-based descriptive items</p>
            </Card>
          </div>
          <Card title="Needs your review">
            {alerts.map((a) => (
              <div className="m-row" key={a.id}>
                <div>
                  <b>{E.patient(s, a.patientId).name}</b>
                  <small>
                    {a.rule} · {E.date(a.day)} · for your review
                  </small>
                </div>
                <Btn
                  secondary
                  onClick={() => {
                    mutate((s) => {
                      s.session.patientId = a.patientId;
                    });
                    go(`/doctor/patient/${a.patientId}/overview`);
                  }}
                >
                  Open patient
                </Btn>
              </div>
            ))}
            {!alerts.length && <Empty>No current review items.</Empty>}
          </Card>
          <Btn
            onClick={() =>
              go(`/doctor/patient/${s.session.patientId}/prescriptions/new`)
            }
          >
            New prescription
          </Btn>
        </>
      )}
    </Shell>
  );
}
function Registry() {
  const { s, mutate, go, askConfirm, askText } = useApp();
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const [query, setQuery] = useState(params.get("q") || "");
  const [filter, setFilter] = useState(params.get("filter") || "all");
  const [sort, setSort] = useState("name");
  const [size, setSize] = useState(Number(params.get("size")) || 10);
  const [page, setPage] = useState(Number(params.get("page")) || 1);
  const normalize = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const list = s.patients
    .filter((p) => E.allow(s, s.session.userId, p.id, "readings"))
    .filter(
      (p) =>
        normalize(p.name).includes(normalize(query)) ||
        p.id.toLowerCase().includes(query.toLowerCase()),
    )
    .filter(
      (p) =>
        filter === "all" ||
        (filter === "day80" && s.sim.day - p.start >= 80) ||
        (filter === "review" &&
          s.alerts.some(
            (a) =>
              a.patientId === p.id &&
              E.visible(a, s) &&
              a.status !== "resolved",
          )) ||
        (filter === "hba1c" && (E.proof(s, p.id).latest?.value || 0) >= 9),
    )
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : a.start - b.start,
    );
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pages);
  useEffect(() => {
    history.replaceState(
      null,
      "",
      `#/doctor/patients?q=${encodeURIComponent(query)}&filter=${filter}&page=${current}&size=${size}`,
    );
  }, [query, filter, current, size]);
  return (
    <Shell title="Patient registry">
      <Card>
        <Field
          label="Search name or Pulse ID"
          value={query}
          onChange={(v: string) => {
            setQuery(v);
            setPage(1);
          }}
        />
        {query.toLowerCase() === "rmesh" && (
          <Btn
            secondary
            onClick={() => {
              setQuery("Ramesh");
              setPage(1);
            }}
          >
            Did you mean Ramesh?
          </Btn>
        )}
        <div className="m-grid">
          <Select
            label="Filter"
            value={filter}
            onChange={(v: string) => {
              setFilter(v);
              setPage(1);
            }}
            options={[
              ["all", "All linked patients"],
              ["review", "Needs review"],
              ["day80", "Day 80–90"],
              ["hba1c", "HbA1c ≥ 9"],
            ]}
          />
          <Select
            label="Sort"
            value={sort}
            onChange={setSort}
            options={["name", "cycle day"]}
          />
          <Select
            label="Rows per page"
            value={size}
            onChange={(v: string) => {
              setSize(Number(v));
              setPage(1);
            }}
            options={["10", "25"]}
          />
        </div>
      </Card>
      <Card
        title={`Showing ${list.length ? (current - 1) * size + 1 : 0}–${Math.min(current * size, list.length)} of ${list.length}`}
      >
        {list.slice((current - 1) * size, current * size).map((p) => (
          <button
            className="registry-row"
            key={p.id}
            onClick={() => {
              mutate((s) => {
                s.session.patientId = p.id;
              });
              go(`/doctor/patient/${p.id}/overview`);
            }}
          >
            <div>
              <b>{p.name}</b>
              <small>{p.id}</small>
            </div>
            <span>Day {s.sim.day - p.start}</span>
            <b>{E.proof(s, p.id).latest?.value ?? "—"}%</b>
            <SourceBadge
              row={E.proof(s, p.id).latest || undefined}
              source="lab"
            />
            <ChevronRight size={18} />
          </button>
        ))}
        {!list.length && (
          <Empty>
            No patients match. Patient consent and doctor verification are
            required.
          </Empty>
        )}
        <div className="m-actions">
          <Btn secondary disabled={current === 1} onClick={() => setPage(1)}>
            First
          </Btn>
          <Btn
            secondary
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </Btn>
          <span>
            {current}/{pages}
          </span>
          <Btn
            secondary
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Btn>
          <Btn
            secondary
            disabled={current === pages}
            onClick={() => setPage(pages)}
          >
            Last
          </Btn>
        </div>
      </Card>
    </Shell>
  );
}
function DoctorPatient() {
  const { s, mutate, go, route, askConfirm, askText } = useApp();
  const pid = route.split("/")[3] || s.session.patientId;
  const p = E.patient(s, pid);
  const tab =
    route.split("?")[0].split("/")[4] ||
    (FEATURES.healthMapDefault ? "map" : "overview");
  const [note, setNote] = useState("");
  const [node, setNode] = useState<E.Row | null>(null);
  const user = s.session.userId;
  const allowed = !!p && E.allow(s, user, pid, "readings");
  const readings = E.view(s, user, pid, "readings", s.readings),
    labs = E.view(s, user, pid, "labs", s.labs),
    sprints = E.view(s, user, pid, "sprint", s.sprints),
    mood = E.view(s, user, pid, "mood", s.moodChecks),
    docs = E.view(s, user, pid, "records", s.documents);
  const pr = allowed ? E.proof(s, pid) : null;
  const fasting = readings.filter((r) => r.context === "fasting");
  const avg = (a: E.Row[]) =>
    a.length ? Math.round(a.reduce((n, r) => n + r.value, 0) / a.length) : "—";
  const tabs = PROFILE_TABS;
  const reportsView = (
    <Card title="Reports verification">
      {[...labs, ...docs].map((r) => (
        <div className="m-row" key={r.id}>
          <div>
            <b>{r.title || `HbA1c ${r.value}%`}</b>
            <SourceBadge row={r} />
            <small>
              {E.date(r.day)} ·{" "}
              {r.verified ? "Verified" : "Unverified — excluded from proof"}
            </small>
          </div>
          {!r.verified && (
            <>
              <Btn
                onClick={() =>
                  mutate((s) => {
                    for (const x of [...s.labs, ...s.documents])
                      if (x.id === r.id || x.documentId === r.id)
                        x.verified = true;
                  })
                }
              >
                Verify
              </Btn>
              <Btn
                secondary
                onClick={() =>
                  mutate((s) => {
                    s.labs = s.labs.filter(
                      (x) => x.id !== r.id && x.documentId !== r.id,
                    );
                    s.documents = s.documents.filter((x) => x.id !== r.id);
                  })
                }
              >
                Reject
              </Btn>
            </>
          )}
        </div>
      ))}
    </Card>
  );
  const notesView = (
    <>
      <Card title="My private doctor notes" privateCard>
        <textarea
          aria-label="Doctor private note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Btn
          disabled={!note.trim()}
          onClick={() => {
            mutate((s) =>
              s.notes.push({
                id: E.uid("DN"),
                patientId: pid,
                ...E.stamp(s),
                text: note,
                owner: user,
                shared: false,
              }),
            );
            setNote("");
          }}
        >
          Save private note
        </Btn>
        {s.notes
          .filter(
            (n) => n.owner === user && n.patientId === pid && E.visible(n, s),
          )
          .map((n) => (
            <p key={n.id}>{n.text}</p>
          ))}
      </Card>
      <Card title="Shared with me">
        {s.notes
          .filter((n) => n.patientId === pid && n.shared && E.visible(n, s))
          .map((n) => (
            <p key={n.id}>
              {n.text} · {roleNames[n.owner] || n.owner}
            </p>
          ))}
      </Card>
    </>
  );
  const moodView = E.allow(s, user, pid, "mood") ? (
    <Card title="Mood (shared by patient)" privateCard>
      {E.allow(s, user, pid, "mood") ? (
        mood.map((m) => (
          <p key={m.id}>
            {m.instrument} · {m.score} · {E.date(m.day)}
          </p>
        ))
      ) : (
        <Empty>Not shared by patient.</Empty>
      )}
    </Card>
  ) : null;
  return (
    <Shell title="Patient profile">
      {!allowed ? (
        <Empty>
          Access withdrawn by the patient, or doctor verification pending.
        </Empty>
      ) : (
        <>
          <div className="m-hero">
            <h1>{p.name}</h1>
            <p>
              {p.id} · {p.age} · {p.sex} · Type 2 diabetes · Day{" "}
              {s.sim.day - p.start}
            </p>
            <Badge>Consent-controlled access</Badge>
            <div className="m-actions">
              <Btn
                onClick={() => go(`/doctor/patient/${pid}/prescriptions/new`)}
              >
                New prescription
              </Btn>
              <Btn secondary onClick={() => go(`/doctor/patient/${pid}/tests`)}>
                Recommend tests
              </Btn>
              <Btn secondary onClick={() => window.print()}>
                Print brief
              </Btn>
            </div>
          </div>
          <div className="m-tabs">
            {tabs.map(({ path: t, label }) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => go(`/doctor/patient/${pid}/${t}`)}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "overview" ? (
            <>
              {moodView}
              {E.allow(s, user, pid, "wellness") && DS.summary(s, pid) && (
                <Card title="Wellness brief">
                  <p>From band · wellness only · Demo</p>
                  <p>{DS.summary(s, pid)}</p>
                  <p>
                    Band adherence: {DS.week(s, pid).bandDays}/7 days with data
                  </p>
                </Card>
              )}
              <Card title="Since last in-person visit">
                <p>
                  {p.inPerson === null
                    ? "No prior in-person consultation recorded"
                    : `${E.date(p.inPerson)} → ${E.date(s.sim.day)} (${s.sim.day - p.inPerson} days)`}
                </p>
                <div className="m-grid">
                  <div>
                    <strong className="big-number">
                      {pr?.baseline?.value ?? "—"} →{" "}
                      {pr?.ready ? pr.latest!.value : "—"}%
                    </strong>
                    <SourceBadge
                      row={pr?.latest || pr?.baseline}
                      source="lab"
                    />
                    <p>
                      Verified HbA1c · change {pr?.ready ? pr.delta : "pending"}
                    </p>
                  </div>
                  <div>
                    <strong className="big-number">
                      {avg(fasting.filter((r) => r.day <= p.start + 14))} →{" "}
                      {avg(fasting.filter((r) => r.day >= s.sim.day - 14))}
                    </strong>
                    <p>
                      Fasting mean · first vs latest two weeks · n=
                      {fasting.length}
                    </p>
                  </div>
                </div>
                <p>
                  Descriptive auto-summary from computed patient and lab values.
                  Verify before acting. No dose advice.
                </p>
              </Card>
              <Card title="What worked">
                {sprints.map((sp) => {
                  const result = E.sprintResult(
                    sp.evenings.filter((e: any) => e.day < s.sim.day),
                  );
                  return (
                    <p key={sp.id}>
                      {E.habitLabel(sp.habitId)} ·{" "}
                      {result.status === "result"
                        ? `${result.effect} mg/dL lower rise · early signal`
                        : result.status}
                    </p>
                  );
                })}
              </Card>
              <Card title="Safety events">
                {s.alerts
                  .filter(
                    (a) =>
                      a.delivery !== "queued" &&
                      a.patientId === pid &&
                      E.visible(a, s) &&
                      (!a.private || E.allow(s, user, pid, "mood")),
                  )
                  .map((a) => (
                    <div className="m-row" key={a.id}>
                      <p>
                        {a.rule} · {E.date(a.day)} · {a.status} · for your
                        review
                      </p>
                      <Btn
                        secondary
                        onClick={() =>
                          mutate((s) => {
                            const r = s.alerts.find((r) => r.id === a.id)!;
                            r.reviewedBy = user;
                            r.reviewedAt = E.stamp(s);
                          })
                        }
                      >
                        {a.reviewedBy ? "Reviewed" : "Mark reviewed"}
                      </Btn>
                    </div>
                  ))}
              </Card>
            </>
          ) : tab === "map" ? (
            <Card title="Health Map · deterministic graph">
              <svg
                viewBox="0 0 640 400"
                role="img"
                aria-label="Health relationships map"
              >
                <circle cx="320" cy="200" r="48" fill="#E8F3EF" />
                <text x="320" y="205" textAnchor="middle">
                  {p.name.split(" ")[0]}
                </text>
                {[...labs, ...docs, ...sprints].slice(0, 8).map((r, i, a) => {
                  const angle = (i * Math.PI * 2) / a.length,
                    x = 320 + 230 * Math.cos(angle),
                    y = 200 + 150 * Math.sin(angle);
                  return (
                    <g
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${r.title || E.habitLabel(r.habitId) || "HbA1c " + r.value}`}
                      onClick={() => setNode(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setNode(r);
                      }}
                    >
                      <line x1="320" y1="200" x2={x} y2={y} stroke="#BCC8C2" />
                      <circle
                        cx={x}
                        cy={y}
                        r="44"
                        fill="white"
                        stroke="#1F6F5C"
                        strokeDasharray={
                          r.verified === false ? "4 4" : undefined
                        }
                      />
                      <text x={x} y={y} textAnchor="middle" fontSize="11">
                        {r.value
                          ? "HbA1c " + r.value
                          : r.habitId
                            ? "Habit"
                            : "Record"}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {node && (
                <div className="m-detail">
                  <h3>
                    {node.title ||
                      E.habitLabel(node.habitId) ||
                      `HbA1c ${node.value}%`}
                  </h3>
                  <p>
                    <SourceBadge row={node} /> {E.date(node.day)} ·{" "}
                    {node.verified ? "Verified" : "Unverified"}
                  </p>
                  {node.verified === false && (
                    <Btn
                      onClick={() => {
                        mutate((s) => {
                          for (const r of [...s.labs, ...s.documents])
                            if (r.id === node.id || r.documentId === node.id)
                              r.verified = true;
                        });
                        setNode({ ...node, verified: true });
                      }}
                    >
                      Verify extracted fact
                    </Btn>
                  )}
                </div>
              )}
              <h3>Accessible list</h3>
              {[...labs, ...docs, ...sprints].map((r) => (
                <button
                  className="drawer-link"
                  key={r.id}
                  onClick={() => setNode(r)}
                >
                  {r.title || E.habitLabel(r.habitId) || `HbA1c ${r.value}%`} ·{" "}
                  {r.verified === false ? "unverified" : "source record"}
                </button>
              ))}
            </Card>
          ) : tab === "charts" ? (
            <Card title="Lab and fasting trends">
              <p>
                Verified HbA1c:{" "}
                {labs
                  .filter((l) => l.verified)
                  .map((l) => `${E.date(l.day)}: ${l.value}%`)
                  .join(" → ") || "No verified labs"}
              </p>
              <svg viewBox="0 0 600 180" role="img" aria-label="Fasting trend">
                <polyline
                  fill="none"
                  stroke="#1F6F5C"
                  strokeWidth="3"
                  points={fasting
                    .map(
                      (r, i) =>
                        `${10 + (i * 570) / Math.max(1, fasting.length - 1)},${170 - r.value / 2}`,
                    )
                    .join(" ")}
                />
              </svg>
              <p>n={fasting.length} · mg/dL</p>
              <SourceBadge row={labs.at(-1)} source="lab" />
              <div className="source-legend">
                {[...new Set(fasting.map((r) => r.source as E.DataSource))].map(
                  (source) => (
                    <SourceBadge key={source} source={source} />
                  ),
                )}
              </div>
            </Card>
          ) : tab === "records" ? (
            <>
              {reportsView}
              <TestsOrders pid={pid} />
            </>
          ) : tab === "prescriptions" ? (
            <Card title="Signed prescriptions">
              {E.view(s, user, pid, "medicines", s.prescriptions).map((r) => (
                <p key={r.id}>
                  Version {r.version} · {E.date(r.day)} ·{" "}
                  {r.medicines.map((m: any) => m.generic).join(", ")}
                </p>
              ))}
              <Btn
                onClick={() => go(`/doctor/patient/${pid}/prescriptions/new`)}
              >
                Compose prescription
              </Btn>
            </Card>
          ) : (
            <>
              {notesView}
              <InlineMessages pid={pid} />
            </>
          )}
        </>
      )}
    </Shell>
  );
}
function InlineMessages({ pid }: { pid: string }) {
  const { s, mutate, askConfirm, askText } = useApp();
  const [text, setText] = useState("");
  return (
    <Card title="Patient thread">
      {s.messages
        .filter((m) => m.patientId === pid && E.visible(m, s))
        .map((m) => (
          <p key={m.id}>
            <b>{m.from.startsWith("DR") ? "Doctor" : "Patient"}:</b> {m.text}
          </p>
        ))}
      <Field label="Reply as Dr. Verma" value={text} onChange={setText} />
      <Btn
        disabled={!text.trim()}
        onClick={() => {
          mutate((s) => {
            E.textEvent(s, text, false, pid);
            s.messages.push({
              id: E.uid("MSG"),
              patientId: pid,
              ...E.stamp(s),
              from: s.session.userId,
              text,
              status: s.sim.online ? "sent" : "queued",
            });
            E.notify(
              s,
              pid,
              pid,
              "message",
              "Dr. Verma replied",
              "New doctor reply",
              undefined,
              "doctor",
            );
          });
          setText("");
        }}
      >
        Send reply
      </Btn>
    </Card>
  );
}
function Rx() {
  const { s, mutate, go, toast, askConfirm, askText } = useApp();
  const pid = s.session.patientId,
    p = E.patient(s),
    doctor = s.doctors[s.session.userId];
  const current = E.activeRx(s, pid);
  const [draft, setDraft] = useState<any>(() =>
    s.rxDraft?.patientId === pid
      ? s.rxDraft
      : {
          patientId: pid,
          mode: "in-clinic",
          diagnosis: "Type 2 diabetes — synthetic demo",
          followup: "2026-11-09",
          medicines: (current?.medicines || E.medicines).map((m: any) => ({
            ...m,
            duration: m.duration || 90,
          })),
          advice: "",
        },
  );
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [signed, setSigned] = useState(false);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    mutate((s) => {
      s.rxDraft = draft;
    });
  }, [draft]);
  const errors = E.validateRx(draft, doctor, p);
  const updateMed = (i: number, key: string, value: any) =>
    setDraft((d: any) => ({
      ...d,
      medicines: d.medicines.map((m: any, j: number) =>
        i === j ? { ...m, [key]: value } : m,
      ),
    }));
  return (
    <Shell title="Prescription composer">
      {preview && (
        <RxPreview
          rx={{
            ...draft,
            ...E.stamp(s),
            signed,
            version: current?.version || 1,
          }}
          p={p}
          doctor={doctor}
          onClose={() => setPreview(false)}
        />
      )}
      <Card title="Verified doctor prescription">
        <p>
          {doctor.name} · {doctor.qualification || "MD (Medicine)"} ·{" "}
          {doctor.registration || "UPMC/DEMO/48213"} · Kanpur
        </p>
        <p>
          {p.name} · {p.age} · {p.sex} · {p.id} · {E.date(s.sim.day)}
        </p>
        <Badge>Draft autosaved · demo signing PIN 246810</Badge>
        {signed ? (
          <>
            <Badge>Signed & delivered</Badge>
            <p>
              Patient active medicines and permitted caregiver views have been
              updated.
            </p>
            <Btn onClick={() => go(`/doctor/patient/${pid}/overview`)}>
              Patient overview
            </Btn>
          </>
        ) : (
          <>
            <Select
              label="Consultation mode"
              value={draft.mode}
              onChange={(v: string) => setDraft({ ...draft, mode: v })}
              options={["in-clinic", "video", "audio", "text"]}
            />
            <Field
              label="Provisional diagnosis"
              value={draft.diagnosis}
              onChange={(v: string) => setDraft({ ...draft, diagnosis: v })}
            />
            {draft.medicines.map((m: any, i: number) => (
              <div className="rx-edit" key={i}>
                <h3>Medicine {i + 1}</h3>
                <div className="m-grid">
                  <Select
                    label="Generic name"
                    value={m.generic}
                    onChange={(v: string) => updateMed(i, "generic", v)}
                    options={E.genericNames}
                  />
                  <Field
                    label="Strength"
                    value={m.strength}
                    onChange={(v: string) => updateMed(i, "strength", v)}
                  />
                  <Select
                    label="Dose pattern"
                    value={m.pattern}
                    onChange={(v: string) => updateMed(i, "pattern", v)}
                    options={["1-0-0", "0-1-0", "0-0-1", "1-0-1", "1-1-1"]}
                  />
                  <Field
                    label="Duration days"
                    type="number"
                    min={1}
                    max={180}
                    value={m.duration}
                    onChange={(v: string) =>
                      updateMed(i, "duration", Number(v))
                    }
                  />
                  <Select
                    label="Patient instruction"
                    value={m.instruction}
                    onChange={(v: string) => updateMed(i, "instruction", v)}
                    options={[
                      "After food",
                      "Before food",
                      "Morning, empty stomach",
                      "At bedtime",
                    ]}
                  />
                </div>
                <Btn
                  secondary
                  onClick={() =>
                    setDraft({
                      ...draft,
                      medicines: draft.medicines.filter(
                        (_: any, j: number) => i !== j,
                      ),
                    })
                  }
                >
                  Remove row
                </Btn>
              </div>
            ))}
            <Btn
              secondary
              onClick={() =>
                setDraft({
                  ...draft,
                  medicines: [
                    ...draft.medicines,
                    {
                      generic: "Metformin",
                      strength: "500 mg",
                      pattern: "1-0-1",
                      duration: 90,
                      instruction: "After food",
                    },
                  ],
                })
              }
            >
              Add medicine
            </Btn>
            <Field
              label="Follow-up date"
              type="date"
              value={draft.followup}
              onChange={(v: string) => setDraft({ ...draft, followup: v })}
            />
            <Field
              label="Doctor advice"
              value={draft.advice}
              onChange={(v: string) => setDraft({ ...draft, advice: v })}
            />
            <p className="m-hint">
              Info: Metformin also appears in an older Dr. Khan prescription.
              Verify the current list.
            </p>
            {errors.map((e) => (
              <p role="alert" className="m-error" key={e}>
                {e}
              </p>
            ))}
            <Btn
              secondary
              disabled={!!errors.length}
              onClick={() => setPreview(true)}
            >
              Preview / print prescription
            </Btn>
            <Field
              label="6-digit signing PIN"
              type="password"
              value={pin}
              onChange={(v: string) => setPin(v.replace(/\D/g, "").slice(0, 6))}
            />
            {(doctor.lockedUntil || lockedUntil) > E.now(s) && (
              <p role="alert">
                PIN locked for {(doctor.lockedUntil || lockedUntil) - E.now(s)}{" "}
                simulated minutes.
              </p>
            )}
            <Btn
              disabled={
                !!errors.length ||
                pin.length !== 6 ||
                (doctor.lockedUntil || lockedUntil) > E.now(s) ||
                !s.sim.online
              }
              onClick={() => {
                if (pin !== doctor.pin) {
                  const a = (doctor.failures || attempts) + 1;
                  mutate((s) => {
                    s.doctors[s.session.userId].failures = a;
                    if (a >= 3) {
                      s.doctors[s.session.userId].lockedUntil = E.now(s) + 5;
                      s.doctors[s.session.userId].failures = 0;
                    }
                  });
                  setAttempts(a);
                  if (a >= 3) {
                    setLockedUntil(E.now(s) + 5);
                    setAttempts(0);
                  }
                  toast("Incorrect signing PIN");
                  return;
                }
                mutate((s) => {
                  const version =
                    Math.max(
                      0,
                      ...s.prescriptions
                        .filter((r) => r.patientId === pid)
                        .map((r) => r.version),
                    ) + 1;
                  s.prescriptions.push({
                    id: E.uid("RX"),
                    patientId: pid,
                    ...E.stamp(s),
                    ...draft,
                    medicines: draft.medicines.map((m: any) => ({
                      ...m,
                      times: E.patternTimes(m.pattern),
                    })),
                    signed: true,
                    version,
                    doctorId: s.session.userId,
                    pharmacyConsent: false,
                    remindersConfirmed: false,
                    doctorName: doctor.name,
                    doctorRegistration:
                      doctor.registration || "UPMC/DEMO/48213",
                    doctorQualification:
                      doctor.qualification || "MD (Medicine)",
                  });
                  s.doctors[s.session.userId].failures = 0;
                  s.doctors[s.session.userId].lockedUntil = 0;
                  s.rxDraft = null;
                  E.notify(
                    s,
                    pid,
                    pid,
                    "medicines",
                    "New signed prescription",
                    "Confirm your new reminder schedule",
                    undefined,
                    "records",
                  );
                  for (const l of s.links.filter((l) => l.patientId === pid))
                    if (E.allow(s, l.viewer, pid, "medicines"))
                      E.notify(
                        s,
                        pid,
                        l.viewer,
                        "medicines",
                        "Medicines updated",
                        "New doctor-signed prescription",
                        undefined,
                        "care",
                      );
                });
                setSigned(true);
              }}
            >
              Sign & send to patient
            </Btn>
            <p>
              Pharmacy sharing requires the patient’s explicit consent for this
              prescription.
            </p>
          </>
        )}
      </Card>
    </Shell>
  );
}
function TestsOrders({ pid }: { pid: string }) {
  const { s, mutate, toast, askConfirm, askText } = useApp();
  const [test, setTest] = useState("HbA1c");
  const [due, setDue] = useState(s.sim.day + 2);
  const [reason, setReason] = useState("Day-90 follow-up");
  const list = s.testOrders.filter(
    (t) => t.patientId === pid && E.visible(t, s),
  );
  return (
    <Card title="Test recommendations">
      <Select
        label="Test"
        value={test}
        onChange={setTest}
        options={["HbA1c", "Lipid profile", "Kidney function", "Urine albumin"]}
      />
      <Field label="Reason" value={reason} onChange={setReason} />
      <Field
        label="Due simulated day"
        type="number"
        min={s.sim.day}
        max={120}
        value={due}
        onChange={(v: string) => setDue(Number(v))}
      />
      <Btn
        disabled={!reason.trim() || due < s.sim.day || due > 120}
        onClick={() => {
          mutate((s) => {
            s.testOrders.push({
              id: E.uid("TEST"),
              patientId: pid,
              ...E.stamp(s),
              test,
              due,
              reason,
              status: "Recommended",
            });
            E.notify(
              s,
              pid,
              pid,
              "tests",
              "Test recommended",
              test,
              undefined,
              "doctor",
            );
            for (const l of s.links.filter((l) => l.patientId === pid))
              if (E.allow(s, l.viewer, pid, "tests"))
                E.notify(
                  s,
                  pid,
                  l.viewer,
                  "tests",
                  "Upcoming test",
                  test,
                  undefined,
                  "care",
                );
          });
          toast("Test recommendation sent");
        }}
      >
        Send recommendation
      </Btn>
      {list.map((t) => (
        <div className="m-row" key={t.id}>
          <div>
            <b>{t.test}</b>
            <small>
              Due {E.date(t.due)}{" "}
              {t.due < s.sim.day && t.status !== "Verified" ? "· Overdue" : ""}
            </small>
          </div>
          <Select
            label="Status"
            value={t.status}
            onChange={(v: string) =>
              mutate((s) => {
                s.testOrders.find((r) => r.id === t.id)!.status = v;
              })
            }
            options={[
              "Recommended",
              "Booked",
              "Collected",
              "Result uploaded",
              "Verified",
            ]}
          />
        </div>
      ))}
    </Card>
  );
}
function Desk() {
  const { s, mutate, toast, route, askConfirm, askText } = useApp();
  const caseReview =
    new URLSearchParams(route.split("?")[1]).get("tab") === "review";
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const list = s.alerts
    .filter(
      (a) =>
        a.delivery !== "queued" &&
        E.visible(a, s) &&
        a.status !== "resolved" &&
        (!a.private ||
          a.rule === "S7" ||
          E.patient(s, a.patientId)?.consents.mood) &&
        (caseReview ? a.rule === "P1" : !["S0", "S2", "S4"].includes(a.rule)),
    )
    .sort((a, b) => a.priority.localeCompare(b.priority) || a.due - b.due);
  const a = list.find((r) => r.id === selected) || list[0];
  const staffed = s.sim.time >= "08:00" && s.sim.time < "22:00";
  return (
    <Shell title={caseReview ? "Case review" : "Care desk"}>
      <div className="m-hero">
        <h1>{caseReview ? "Dr. R. Menon · demo review" : "Care desk queue"}</h1>
        <p>
          {staffed
            ? "Staffed 08:00–22:00"
            : "Night protocol: helplines + local contact; callbacks start 08:00"}
        </p>
        <Badge>Synthetic patient support</Badge>
      </div>
      <div className="desk-grid">
        <Card title={`${list.length} open items`}>
          {list.map((r) => (
            <button
              className="drawer-link"
              key={r.id}
              onClick={() => {
                setSelected(r.id);
                mutate((s) =>
                  E.readLog(
                    s,
                    "TEAM",
                    r.patientId,
                    r.private ? "mood" : "alerts",
                  ),
                );
              }}
            >
              <b>
                {r.priority} · {r.rule}
              </b>
              <span>
                {E.patient(s, r.patientId).name}
                <small>
                  {r.due < E.now(s)
                    ? "Overdue"
                    : r.due - E.now(s) + " min remaining"}
                </small>
              </span>
            </button>
          ))}
          {!list.length && <Empty>Queue is clear.</Empty>}
        </Card>
        {a && (
          <Card
            title={`${a.priority} · ${a.rule} · ${E.patient(s, a.patientId).name}`}
            privateCard={a.private}
          >
            <Badge>
              {a.status} · {a.owner}
            </Badge>
            <p>
              {staffed
                ? `SLA ${a.due - E.now(s)} sim-minutes remaining`
                : "Callback at 08:00"}
            </p>
            <p>
              {a.rule === "S7"
                ? "Ask if the patient is safe now. Offer fixed helplines. Family must not receive mood details."
                : "Confirm the patient saw the safety instructions; ask about recheck and local support. Escalation is for clinician review."}
            </p>
            <p>
              Patient phone ••••••{E.patient(s, a.patientId).mobile.slice(-4)}
            </p>
            <Btn
              secondary
              onClick={() => {
                mutate((s) =>
                  E.readLog(s, "TEAM", a.patientId, "contact reveal"),
                );
                toast(`Demo phone ${E.patient(s, a.patientId).mobile}`);
              }}
            >
              Reveal contact (logged)
            </Btn>
            <textarea
              aria-label="Care desk note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="m-actions">
              {["Reached", "No answer", "Declined call"].map((outcome) => (
                <Btn
                  secondary
                  key={outcome}
                  onClick={() => {
                    mutate((s) => {
                      const target = s.alerts.find((r) => r.id === a.id)!;
                      target.owner = "Pooja";
                      target.outcome = outcome;
                      target.timeline.push({
                        ...E.stamp(s),
                        text: `Pooja · ${outcome} · ${note}`,
                      });
                      if (outcome === "No answer") target.due = E.now(s) + 30;
                      E.readLog(s, "TEAM", a.patientId, "care outcome");
                    });
                    setNote("");
                    toast("Outcome recorded");
                  }}
                >
                  {outcome}
                </Btn>
              ))}
              <Btn
                onClick={() => {
                  mutate((s) => {
                    const target = s.alerts.find((r) => r.id === a.id)!;
                    target.status = "resolved";
                    target.owner = "Pooja";
                    target.timeline.push({
                      ...E.stamp(s),
                      text: `Resolved by care desk · ${note}`,
                    });
                    E.readLog(s, "TEAM", a.patientId, "care resolution");
                  });
                  setNote("");
                }}
              >
                Resolve care item
              </Btn>
              <Btn
                secondary
                onClick={() =>
                  mutate((s) => {
                    s.alerts
                      .find((r) => r.id === a.id)!
                      .timeline.push({
                        ...E.stamp(s),
                        text: "Escalated to clinician for review",
                      });
                  })
                }
              >
                Escalate to clinician
              </Btn>
            </div>
            <ul className="timeline">
              {a.timeline.map((t: any, i: number) => (
                <li key={i}>
                  {t.time} · {t.text}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </Shell>
  );
}
function MythReview() {
  const { s, mutate, toast, askConfirm, askText } = useApp();
  const [verdict, setVerdict] = useState("false");
  const [reason, setReason] = useState(
    "Only your doctor will change your medicines.",
  );
  const [source, setSource] = useState("Demo human reviewer");
  const list = s.myths.filter((m) => m.status === "waiting" && E.visible(m, s));
  const [id, setId] = useState("");
  const m = list.find((r) => r.id === id) || list[0];
  return (
    <Shell title="Myth review">
      <Card title="Unverified claim queue">
        {list.map((r) => (
          <button
            className="drawer-link"
            key={r.id}
            onClick={() => setId(r.id)}
          >
            {r.claim}
            <ChevronRight size={18} />
          </button>
        ))}
        {!list.length && <Empty>No unverified claims waiting.</Empty>}
      </Card>
      {m && (
        <Card title={m.claim}>
          <Select
            label="Verdict"
            value={verdict}
            onChange={setVerdict}
            options={["false", "true", "misleading"]}
          />
          <Field
            label="Reviewed explanation"
            value={reason}
            onChange={setReason}
          />
          <Field
            label="Sources and reviewer"
            value={source}
            onChange={setSource}
          />
          <Btn
            disabled={!reason.trim() || !source.trim()}
            onClick={() => {
              mutate((s) => {
                s.myths
                  .filter((x) => x.claim === m.claim)
                  .forEach((x) => {
                    x.status = "published";
                    x.verdict = verdict;
                    x.explanation = reason;
                    x.sources = source;
                    E.notify(
                      s,
                      x.patientId,
                      x.askedBy || x.patientId,
                      "message",
                      "Myth reviewed",
                      reason,
                      `VERDICT-${x.id}`,
                      "myth",
                    );
                  });
              });
              toast("Verdict published — requesters notified");
            }}
          >
            Publish human-reviewed verdict
          </Btn>
        </Card>
      )}
    </Shell>
  );
}
function Impact() {
  const { s, askConfirm, askText } = useApp();
  const [tab, setTab] = useState("Metrics chain");
  const [clinic, setClinic] = useState("all");
  const [month, setMonth] = useState("all");
  const [members, setMembers] = useState(1000);
  const [claims, setClaims] = useState(12000);
  const rows = E.cohort().filter(
    (r) =>
      (s.session.role === "doctor"
        ? r.clinic === 1
        : clinic === "all" || r.clinic === Number(clinic)) &&
      (month === "all" || r.month === Number(month)),
  );
  const n = rows.length;
  const count = (key: string) => rows.filter((r: any) => r[key]).length;
  const pct = (num: number, den = n) =>
    den ? Math.round((num / den) * 100) : 0;
  const improved = count("improved"),
    kept = count("kept"),
    renewed = count("renewed");
  const delta = rows.reduce((sum, r) => sum + r.delta, 0) / Math.max(1, n);
  const doctor = s.session.role === "doctor";
  return (
    <Shell title={doctor ? "Practice outcomes" : "Impact console"}>
      <div className="m-hero">
        <h1>Measured change, sustainable care</h1>
        <p>Synthetic demo cohort — illustrative, not real results</p>
      </div>
      <div className="m-tabs">
        {[
          "Metrics chain",
          "Growth loops",
          "Safety counter-metrics",
          "Partner",
          "Proof plan",
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <Card>
        <Badge>Synthetic demo cohort — illustrative, not real results</Badge>
        <div className="m-grid">
          <Select
            label="Clinic"
            value={doctor ? "1" : clinic}
            onChange={setClinic}
            options={
              doctor
                ? [["1", "KNP-VERMA-01"]]
                : [
                    ["all", "All clinics"],
                    ...Array.from({ length: 12 }, (_, i) => [
                      String(i + 1),
                      `Clinic ${i + 1}`,
                    ]),
                  ]
            }
          />
          <Select
            label="Cohort month"
            value={month}
            onChange={setMonth}
            options={[
              ["all", "All cohorts"],
              ["1", "July"],
              ["2", "August"],
              ["3", "September"],
            ]}
          />
        </div>
        <p>
          Denominator: {n} enrolled · dropout counted as not improved (ITT).
        </p>
      </Card>
      {tab === "Metrics chain" ? (
        <>
          <div className="metric-chain">
            {[
              [
                "Leading",
                `${pct(kept)}%`,
                `${kept}/${n} kept habit in Week 3 · target 45%`,
              ],
              [
                "North Star",
                `${pct(improved)}%`,
                `${improved}/${n} HbA1c down ≥0.5 · target 35%`,
              ],
              [
                "Business",
                `${pct(renewed)}%`,
                `${renewed}/${n} renewed · target 50%`,
              ],
              ["Partner", `${delta.toFixed(2)}`, "Mean HbA1c reduction points"],
            ].map(([title, val, desc]) => (
              <Card key={title} title={title}>
                <strong className="big-number">{val}</strong>
                <p>{desc}</p>
              </Card>
            ))}
          </div>
          <Card title="Conditional rates">
            <p>
              Improved among kept-habit group:{" "}
              {pct(rows.filter((r) => r.kept && r.improved).length, kept)}%
            </p>
            <p>
              Improved among other patients:{" "}
              {pct(rows.filter((r) => !r.kept && r.improved).length, n - kept)}%
            </p>
            <p>
              Renewed among improvers:{" "}
              {pct(
                rows.filter((r) => r.improved && r.renewed).length,
                improved,
              )}
              %
            </p>
            <p>
              Simulated usual-care comparator:{" "}
              {E.comparator().filter((r) => r.improved).length}/120 (
              {pct(E.comparator().filter((r) => r.improved).length, 120)}%) ·
              associations in this synthetic model are illustrative.
            </p>
            <p>Not success metrics here: downloads, sign-ups, app opens.</p>
          </Card>
        </>
      ) : tab === "Growth loops" ? (
        <div className="m-grid">
          {[
            [
              "Clinic loop",
              `${(n / new Set(rows.map((r) => r.clinic)).size || 0).toFixed(1)} enrolled per clinic (selected cohort)`,
            ],
            ["Proof-card loop", `${count("shared")} shares → new families`],
            ["Sibling co-care", `${count("invite")} sibling invites`],
            ["Myth-card loop", `${count("forward")} forwards`],
          ].map(([title, text]) => (
            <Card key={title} title={title}>
              <p>{text}</p>
            </Card>
          ))}
          <Card title="Cohort funnel">
            <p>
              {n} enrolled → {kept} kept habit → {n - count("dropout")} tested →{" "}
              {improved} improved → {renewed} renewed
            </p>
          </Card>
        </div>
      ) : tab === "Safety counter-metrics" ? (
        <Card title="Safety counter-metrics">
          <p>
            {count("hypo")} simulated low events ·{" "}
            {((count("hypo") / Math.max(1, n * 3)) * 100).toFixed(1)} per 100
            patient-months
          </p>
          <p>{pct(count("callback"))}% callbacks within simulated SLA</p>
          <p>
            Sharing opt-outs and notification counts are monitored in the live
            demo access/notification logs.
          </p>
        </Card>
      ) : tab === "Partner" ? (
        <Card title="De-identified illustrative calculator">
          <Field
            label="Members"
            type="number"
            min={1}
            value={members}
            onChange={(v: string) => setMembers(Math.max(1, Number(v)))}
          />
          <Field
            label="Insurer annual complication claims per member ₹"
            type="number"
            min={0}
            value={claims}
            onChange={(v: string) => setClaims(Math.max(0, Number(v)))}
          />
          <p>
            Mean reduction {delta.toFixed(2)} points × 21% ={" "}
            {(delta * 0.21 * 100).toFixed(1)}% relative association.
          </p>
          <p>
            Illustrative claims amount: ₹
            {Math.round(members * claims * delta * 0.21).toLocaleString(
              "en-IN",
            )}
          </p>
          <p>
            Linear approximation of an observational association — illustrative,
            not a prediction. UKPDS 35 coefficient supplied in the design brief.
          </p>
          <table>
            <thead>
              <tr>
                <th>Anonymous ID</th>
                <th>Cohort</th>
                <th>Reduction</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td>DEMO-{r.id}</td>
                  <td>{r.month}</td>
                  <td>{r.delta.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card title="Proof plan">
          <p>
            Intention-to-treat; fresh baseline within 30 days; stepped-wedge
            clinic rollout comparator; pre-registered analysis; independent
            analysis partner; report at Day 90/180/360. Claims refer to measured
            HbA1c change.
          </p>
        </Card>
      )}
    </Shell>
  );
}
function Band({ settings = false }: { settings?: boolean } = {}) {
  const { s, mutate, askConfirm } = useApp();
  const p = E.patient(s),
    c = s.healthConnect?.[p.id];
  const [sheet, setSheet] = useState(
    settings && location.hash.includes("connect=1"),
  );
  const [permissions, setPermissions] = useState<E.HealthPermissions>(
    HC.connect(),
  );
  const rows = HC.wellness(s, p.id),
    latest = rows.at(-1);
  const permitted = c?.permissions || HC.emptyPermissions();
  const hasBand = HC.PERMISSIONS.some(
    ([key]) => key !== "bloodGlucose" && permitted[key],
  );
  const fresh = HC.freshness(s, c?.lastSync);
  if (!FEATURES.wellnessBand || (!settings && E.patient(s).bandOwned === false))
    return null;
  const open = () => {
    setPermissions(HC.connect());
    setSheet(true);
  };
  const line = (
    <p className="wellness-disclaimer">
      For wellness trends — not for diagnosis.
    </p>
  );
  return (
    <Shell title="Health Connect · Demo">
      {!p.consents.band || !hasBand || !latest ? (
        <div data-band-card>
          <Card title="Connect a band (optional) — Pulse works fully without one">
            <Badge>Demo</Badge>
            {line}
            <Btn secondary onClick={open}>
              Connect Health Connect
            </Btn>
          </Card>
        </div>
      ) : (
        <>
          <div className="m-grid">
            {(
              [
                ["steps", "Steps", latest.steps, "steps"],
                [
                  "steps",
                  "After-dinner steps (19:00–22:30)",
                  latest.stepsAfterDinner,
                  "steps",
                ],
                ["sleep", "Sleep", latest.sleepMinutes, "min"],
                ["heartRate", "Resting heart rate", latest.restingHr, "bpm"],
                ["oxygen", "Oxygen saturation", latest.spo2Min, "%"],
                [
                  "hydration",
                  "Hydration logged elsewhere",
                  latest.hydrationMl,
                  "ml",
                ],
              ] as const
            )
              .filter(([key, , ,]) => permitted[key])
              .filter(([, , value]) => value !== null)
              .map(([key, label, value, unit]) => (
                <div data-band-card key={label}>
                  <Card title={`${label} · Demo`}>
                    <strong className="big-number">
                      {value} {unit}
                    </strong>
                    <SourceBadge row={{ ...latest, lastSync: c?.lastSync }} />
                    {line}
                  </Card>
                </div>
              ))}
          </div>
          <p className={fresh.stale ? "freshness stale" : "freshness"}>
            {fresh.text}
            {!c?.connected ? " · disconnected; saved history" : ""}
          </p>
        </>
      )}
      {c && (
        <div className="m-actions">
          <Btn secondary onClick={open}>
            Review Health Connect permissions
          </Btn>
          {c.connected && (
            <Btn
              disabled={!s.sim.online}
              onClick={() =>
                mutate((s) => HC.sync(s, p.id, FEATURES.meterAutoSync))
              }
            >
              Sync now · Demo
            </Btn>
          )}
          {c.connected && (
            <Btn
              secondary
              onClick={async () => {
                const remove = await askConfirm(
                  "Delete past band data too? Choose Confirm to delete, or Cancel to keep history. Clinical glucose readings stay in Records.",
                );
                mutate((s) => HC.disconnect(s, remove, p.id));
              }}
            >
              Disconnect Health Connect
            </Btn>
          )}
          {!c.connected && (
            <Btn
              secondary
              onClick={async () => {
                if (
                  await askConfirm(
                    "Delete saved band history? Clinical glucose readings stay in Records.",
                  )
                )
                  mutate((s) => HC.disconnect(s, true, p.id));
              }}
            >
              Delete band history
            </Btn>
          )}
        </div>
      )}
      {FEATURES.meterAutoSync && c?.connected && permitted.bloodGlucose && (
        <p className="m-hint">
          Meter auto-sync · Demo · Blood glucose only. Your band does not
          measure glucose.
        </p>
      )}
      {sheet && (
        <div className="m-overlay hc-overlay" onClick={() => setSheet(false)}>
          <section
            className="m-confirm-sheet hc-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Health Connect permissions"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Health Connect permissions</h2>
            <p>Demo — the real app reads Health Connect on Android</p>
            {HC.PERMISSIONS.filter(
              ([key]) => key !== "bloodGlucose" || FEATURES.meterAutoSync,
            ).map(([key, label]) => (
              <Toggle
                key={key}
                label={label}
                on={permissions[key]}
                onChange={() =>
                  setPermissions({ ...permissions, [key]: !permissions[key] })
                }
              />
            ))}
            <Btn
              secondary
              onClick={() =>
                setPermissions(
                  Object.fromEntries(
                    HC.PERMISSIONS.map(([key]) => [
                      key,
                      key !== "bloodGlucose" || FEATURES.meterAutoSync,
                    ]),
                  ) as E.HealthPermissions,
                )
              }
            >
              Allow all
            </Btn>
            <Toggle
              label="Optional Pulse wellness consent"
              on={p.consents.band}
              onChange={() =>
                mutate((s) => {
                  E.patient(s).consents.band = !p.consents.band;
                  s.consentLog.push({
                    id: E.uid("CONSENT"),
                    patientId: p.id,
                    ...E.stamp(s),
                    action: "Optional band consent changed",
                    allowed: !p.consents.band,
                  });
                })
              }
            />
            {!p.consents.band && (
              <p className="m-hint">
                Band metrics will not be imported without optional wellness
                consent. Blood glucose can sync independently.
              </p>
            )}
            <p className="m-hint">
              Hydration comes from records you log elsewhere, not from a band
              sensor. Band metrics never trigger alerts.
            </p>
            <div className="m-actions">
              <Btn
                disabled={!Object.values(permissions).some(Boolean)}
                onClick={() => {
                  mutate((s) => HC.connect(s, permissions, p.id));
                  setSheet(false);
                }}
              >
                Allow selected
              </Btn>
              <Btn secondary onClick={() => setSheet(false)}>
                Cancel
              </Btn>
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}
function ConnectedDevices() {
  const { s, mutate } = useApp();
  const p = E.patient(s),
    c = s.healthConnect?.[p.id];
  return (
    <section className="connected-devices">
      <h2>Connected devices</h2>
      <Band settings />
      <Card title="Glucometer sync · Demo">
        <Toggle
          label="Glucometer auto-sync"
          on={c?.permissions.bloodGlucose}
          onChange={() =>
            mutate((s) => {
              const conn = (s.healthConnect[p.id] ||= {
                connected: true,
                permissions: HC.emptyPermissions(),
                lastSync: null,
              });
              conn.permissions.bloodGlucose = !conn.permissions.bloodGlucose;
              conn.connected = true;
              HC.sync(s, p.id);
            })
          }
        />
        <p>Device changes keep your clinical history.</p>
      </Card>
      <Card title="Scale / BP cuff (optional) · Demo">
        {(
          [
            ["scale", "Connected scale"],
            ["bpCuff", "Connected BP cuff"],
          ] as const
        ).map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            on={c?.devices?.[key]}
            onChange={() =>
              mutate((s) => HC.setDevice(s, key, !c?.devices?.[key], p.id))
            }
          />
        ))}
      </Card>
    </section>
  );
}
function YourDay() {
  const { s, mutate } = useApp();
  const text = DS.summary(s);
  const c = s.healthConnect?.[s.session.patientId];
  if (!text) return null;
  const stale = c?.lastSync != null && E.now(s) - c.lastSync >= 1440;
  return (
    <Card title="Your day">
      <p>
        {text} · Band, {HC.freshness(s, c?.lastSync).text} · Demo
      </p>
      {stale && (
        <p className="freshness stale">
          Band not synced since yesterday — open your band app{" "}
          <Btn secondary onClick={() => mutate((s) => HC.sync(s))}>
            Sync now
          </Btn>
        </p>
      )}
    </Card>
  );
}
function SourceBadge({ row, source }: { row?: E.Row; source?: E.DataSource }) {
  const { s } = useApp();
  const src = source || row?.source || "typed";
  const name =
    src === "band"
      ? "Band"
      : src === "lab"
        ? "Lab"
        : src === "typed"
          ? "You"
          : src === "health-connect"
            ? "Device"
            : "Meter";
  const device = src === "band" || src === "meter-sync";
  const at = row?.lastSync ?? (row ? E.minutes(row.day, row.time) : null);
  const fresh = HC.freshness(s, at);
  const label = device
    ? fresh.text
    : row
      ? `recorded ${Math.max(0, Math.floor((E.now(s) - (row.measuredAt ?? at!)) / 1440))} days ago`
      : "";
  return (
    <small className={`source-badge ${device && fresh.stale ? "stale" : ""}`}>
      <span aria-hidden="true">
        {src === "band"
          ? "◉"
          : src === "lab"
            ? "▤"
            : src === "typed"
              ? "●"
              : "▣"}
      </span>{" "}
      {name}
      {label ? ` · ${label}` : ""}
      {device ? " · Demo" : ""}
    </small>
  );
}

function Utility({ kind }: { kind?: string } = {}) {
  const { s, mutate, go, toast, route, askConfirm, askText } = useApp();
  const page = kind || route.split("?")[0].split("/")[2];
  const role = s.session.role;
  const p = E.patient(s);
  const [name, setName] = useState(p?.name || "");
  const [complaint, setComplaint] = useState("");
  if (page === "choose")
    return (
      <Shell title="Family members">
        {s.links
          .filter(
            (l) =>
              l.viewer === s.session.userId &&
              l.status === "approved" &&
              E.patient(s, l.patientId) &&
              !E.patient(s, l.patientId).deleted,
          )
          .map((l) => (
            <Card key={l.id} title={E.patient(s, l.patientId).name}>
              <Btn
                onClick={() => {
                  mutate((s) => {
                    s.session.patientId = l.patientId;
                  });
                  go("/caregiver/home");
                }}
              >
                Open care
              </Btn>
            </Card>
          ))}
        <Btn secondary onClick={() => go("/caregiver/connect")}>
          Connect another member
        </Btn>
      </Shell>
    );
  if (page === "permissions")
    return (
      <Shell title="Shared permissions">
        <Card title="Patient-controlled categories">
          {E.categories.map((c) => (
            <p key={c}>
              {c}:{" "}
              {E.allow(s, s.session.userId, s.session.patientId, c)
                ? "shared"
                : "not shared"}
            </p>
          ))}
          <p>🔒 Mood, private notes, sensitive documents: never shared.</p>
        </Card>
      </Shell>
    );
  if (page === "outbound")
    return (
      <Shell title="Simulated messages sent">
        <Card title="Safety contact SMS log">
          {s.outbound
            .filter((r) => E.visible(r, s))
            .map((r) => (
              <p key={r.id}>
                {E.date(r.day)} {r.time} · {r.recipient} · {r.body} · {r.status}
              </p>
            ))}
          {!s.outbound.length && <Empty />}
        </Card>
      </Shell>
    );
  if (page === "care") return <Caregiver />;
  if (page === "settings" || page === "profile")
    return (
      <Shell title="Profile & settings">
        <Card title={role === "patient" ? "Patient profile" : "Demo account"}>
          {role === "patient" ? (
            <>
              <Field label="Name" value={name} onChange={setName} />
              <Btn
                disabled={name.trim().length < 2}
                onClick={() => {
                  mutate((s) => {
                    E.patient(s).name = name.trim();
                  });
                  toast("Profile saved");
                }}
              >
                Save profile
              </Btn>
            </>
          ) : (
            <p>{roleNames[s.session.userId]}</p>
          )}
          <Toggle
            label="Extra large text"
            on={s.settings.large}
            onChange={() =>
              mutate((s) => {
                s.settings.large = !s.settings.large;
              })
            }
          />
          {role === "doctor" && (
            <>
              <Field
                label="Session lock minutes"
                type="number"
                min={5}
                max={15}
                value={s.settings.lockMinutes}
                onChange={(v: string) =>
                  mutate((s) => {
                    s.settings.lockMinutes = Math.min(
                      15,
                      Math.max(5, Number(v)),
                    );
                  })
                }
              />
              <Select
                label="Reply commitment hours"
                value={s.settings.replyHours}
                onChange={(v: string) =>
                  mutate((s) => {
                    s.settings.replyHours = Number(v);
                  })
                }
                options={["24", "48", "72"]}
              />
            </>
          )}
        </Card>
      </Shell>
    );
  return (
    <Shell title="Help & support">
      <Card title="Support hours 08:00–22:00">
        <a className="m-btn" href="tel:9876500003">
          Call demo care team
        </a>
        <a className="m-btn secondary" href="tel:14416">
          Tele-MANAS 14416
        </a>
        <p>
          For immediate emergencies, the person near the patient can call 112.
          Clinic and care-team numbers in this demo are synthetic placeholders.
        </p>
        <Field
          label="Demo support or grievance ticket"
          value={complaint}
          onChange={setComplaint}
        />
        <Btn
          disabled={!complaint.trim()}
          onClick={() => {
            mutate((s) => {
              s.grievances.push({
                id: E.uid("HELP"),
                patientId: s.session.patientId,
                ...E.stamp(s),
                text: complaint,
                status: "open",
              });
            });
            toast("Demo ticket saved. No external message was sent.");
            setComplaint("");
          }}
        >
          Save ticket
        </Btn>
        <p>
          Data rights and grievance: patient menu → My data. Complaints may be
          made to the Data Protection Board of India.
        </p>
      </Card>
    </Shell>
  );
}
function Auth({ role }: { role: E.Role }) {
  const { s, mutate, login, go, toast, askConfirm, askText } = useApp();
  const [register, setRegister] = useState(location.hash.includes("register"));
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState("9876543210");
  const [otp, setOtp] = useState("");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("56");
  const [pinCode, setPinCode] = useState("208001");
  const [condition, setCondition] = useState("Type 2");
  const [sex, setSex] = useState("male");
  const [pregnant, setPregnant] = useState(false);
  const [meter, setMeter] = useState(true);
  const [clinic, setClinic] = useState("KNP-VERMA-01");
  const [insulin, setInsulin] = useState(false);
  const [consents, setConsents] = useState<Record<string, boolean>>({
    readings: true,
    medicines: true,
  });
  const [safetyName, setSafetyName] = useState("");
  const [safetyPhone, setSafetyPhone] = useState("");
  const validMobile = /^[6-9]\d{9}$/.test(mobile);
  const [password, setPassword] = useState("");
  const [outcome, setOutcome] = useState("");
  const [city, setCity] = useState("Pune");
  const [reg, setReg] = useState("");
  const [declared, setDeclared] = useState(false);
  const verify = () => {
    if (otp !== "123456") {
      const a = attempts + 1;
      setAttempts(a);
      if (a >= 5) setLocked(E.now(s) + 15);
      toast(`Wrong demo OTP · ${Math.max(0, 5 - a)} attempts remaining`);
      return;
    }
    if (E.now(s) - (sentAt ?? 0) > 5) {
      toast("OTP expired — resend");
      return;
    }
    if (register) setStep(1);
    else {
      const matching =
        role === "patient"
          ? s.patients.find((p) => p.mobile === mobile && !p.deleted)
          : null;
      if (role === "patient" && !matching) {
        toast("This number isn't registered — register to continue");
        return;
      }
      login(role, matching?.id);
    }
  };
  const finish = (bandOwned = false) => {
    mutate((s) => {
      const id = `PUL-KNP-${String(s.patients.length + 1).padStart(4, "0")}`;
      s.patients.push({
        id,
        name,
        age: Number(age),
        sex,
        start: s.sim.day,
        doctorId:
          clinic === "KNP-VERMA-01"
            ? "DR-0001"
            : clinic === "KNP-SAXENA-02"
              ? "DR-0002"
              : "",
        inPerson: null,
        insulin,
        deleted: false,
        habitId: null,
        bandOwned,
        payerId: id,
        consents: { ...consents, sprint: !!consents.sprint && meter },
        target: 7,
        mobile,
      });
      for (const [category, on] of Object.entries(consents))
        s.consentLog.push({
          id: E.uid("CONSENT"),
          patientId: id,
          ...E.stamp(s),
          category,
          on,
          method: "tap",
        });
      s.session = { ...s.session, role: "patient", userId: id, patientId: id };
      s.testOrders.push({
        id: E.uid("BASELINE"),
        patientId: id,
        ...E.stamp(s),
        test: "HbA1c",
        due: s.sim.day + 2,
        status: "Recommended",
      });
      (s.patients.at(-1) as any).safetyContact = {
        name: safetyName,
        phone: safetyPhone,
      };
    });
    go(bandOwned ? "/patient/settings?connect=1" : "/patient/home");
  };
  return (
    <div className="m-auth">
      <Btn secondary onClick={() => go("/")}>
        <ArrowLeft size={18} />
        Home
      </Btn>
      <div className="m-brand">✚ pulse</div>
      <h1>
        {role} {register ? "registration" : "login"}
      </h1>
      <Badge>Synthetic demo · OTP 123456</Badge>
      <Card>
        {outcome ? (
          <>
            <h2>{outcome}</h2>
            <p>
              Only Kanpur, adult Type 2 tablet users are supported by the full
              sprint demo. Safety and helplines remain available.
            </p>
            <a className="m-btn secondary" href="tel:14416">
              14416
            </a>
            <Btn
              onClick={() => {
                mutate((s) =>
                  s.waitlist.push({
                    id: E.uid("WAIT"),
                    patientId: "",
                    ...E.stamp(s),
                    name,
                    mobile,
                    pincode: pinCode,
                  }),
                );
                toast("Demo waitlist saved");
                go("/");
              }}
            >
              Join demo waitlist
            </Btn>
          </>
        ) : register && role !== "patient" && step > 0 ? (
          <>
            <h2>
              {role === "doctor"
                ? "Doctor identity & verification"
                : "Caregiver profile"}
            </h2>
            <Field label="Full name" value={name} onChange={setName} />
            <Field label="City" value={city} onChange={setCity} />
            {role === "doctor" && (
              <Field
                label="Council registration number"
                value={reg}
                onChange={setReg}
              />
            )}
            <Toggle
              label="I confirm these are synthetic demo details and understand the privacy notice"
              on={declared}
              onChange={() => setDeclared(!declared)}
            />
            <Btn
              disabled={
                name.trim().length < 2 ||
                !city.trim() ||
                !declared ||
                (role === "doctor" && reg.trim().length < 3)
              }
              onClick={() => {
                let id = "";
                mutate((s) => {
                  id = role === "doctor" ? E.uid("DR") : E.uid("CG");
                  if (role === "doctor")
                    s.doctors[id] = {
                      name,
                      verified: false,
                      pin: "246810",
                      registration: reg,
                      qualification: "Demo qualification",
                    };
                  else s.users[id] = { name, city };
                  s.session = { role, userId: id, patientId: E.P };
                });
                go(role === "doctor" ? "/doctor/home" : "/caregiver/connect");
              }}
            >
              Create demo account
            </Btn>
            <Btn secondary onClick={() => setStep(0)}>
              Back
            </Btn>
          </>
        ) : !register || step === 0 ? (
          <>
            <Field
              label="Mobile number"
              value={mobile}
              onChange={(v: string) =>
                setMobile(v.replace(/\D/g, "").slice(0, 10))
              }
            />
            {role !== "patient" && (
              <Field
                label="Password (demo: demo1234)"
                type="password"
                value={password}
                onChange={setPassword}
              />
            )}
            <Btn
              disabled={
                !validMobile ||
                locked > E.now(s) ||
                (role !== "patient" && password !== "demo1234")
              }
              onClick={() => {
                setSentAt(E.now(s));
                toast("Demo OTP sent: 123456");
              }}
            >
              Send / resend demo OTP
            </Btn>
            {sentAt !== null && (
              <>
                <Field
                  label="6-digit OTP"
                  value={otp}
                  onChange={(v: string) =>
                    setOtp(v.replace(/\D/g, "").slice(0, 6))
                  }
                />
                <Btn
                  disabled={otp.length !== 6 || locked > E.now(s)}
                  onClick={verify}
                >
                  Verify OTP
                </Btn>
              </>
            )}
            {locked > E.now(s) && (
              <p role="alert">
                Locked for {locked - E.now(s)} simulated minutes.
              </p>
            )}
            <div className="m-actions">
              <Btn secondary onClick={() => login(role)}>
                Quick demo login
              </Btn>
              {role === "patient" && (
                <Btn
                  secondary
                  onClick={() => {
                    setRegister(!register);
                    setOtp("");
                    setSentAt(null);
                  }}
                >
                  {register ? "Login" : "Register"}
                </Btn>
              )}
            </div>
          </>
        ) : (
          <>
            <p>Step {step} of 5 · Back preserves inputs</p>
            {step === 1 ? (
              <>
                <Field label="Full name" value={name} onChange={setName} />
                <Field
                  label="Age"
                  type="number"
                  value={age}
                  onChange={setAge}
                />
                <Select
                  label="Sex"
                  value={sex}
                  onChange={setSex}
                  options={["male", "female", "other"]}
                />
                <Field
                  label="Pincode"
                  value={pinCode}
                  onChange={(v: string) =>
                    setPinCode(v.replace(/\D/g, "").slice(0, 6))
                  }
                />
                <Btn
                  disabled={
                    name.trim().length < 2 ||
                    !/^\d{6}$/.test(pinCode) ||
                    Number(age) <= 0
                  }
                  onClick={() => {
                    if (Number(age) < 18)
                      setOutcome("Not yet supported: under 18");
                    else if (
                      Number(pinCode) < 208001 ||
                      Number(pinCode) > 208027
                    )
                      setOutcome("Outside Kanpur — join waitlist");
                    else setStep(2);
                  }}
                >
                  Continue
                </Btn>
              </>
            ) : step === 2 ? (
              <>
                <Select
                  label="Diabetes type"
                  value={condition}
                  onChange={setCondition}
                  options={["Type 2", "Type 1", "Not sure"]}
                />
                <Toggle
                  label="Using insulin (doctor-supervised mode)"
                  on={insulin}
                  onChange={() => setInsulin(!insulin)}
                />
                {sex === "female" && Number(age) <= 50 && (
                  <Toggle
                    label="Pregnant"
                    on={pregnant}
                    onChange={() => setPregnant(!pregnant)}
                  />
                )}
                <Toggle
                  label="I have a glucometer"
                  on={meter}
                  onChange={() => setMeter(!meter)}
                />
                {!meter && (
                  <p>
                    Pulse needs a glucometer for experiments. Continue in
                    limited mode and ask your doctor.
                  </p>
                )}
                <p>
                  Insulin users can continue with safety features; sprints are
                  disabled.
                </p>
                <Btn
                  onClick={() =>
                    condition !== "Type 2" || pregnant
                      ? setOutcome(
                          "Not yet supported: needs clinician assessment",
                        )
                      : setStep(3)
                  }
                >
                  Continue
                </Btn>
              </>
            ) : step === 3 ? (
              <>
                <h2>Doctor & local safety contact</h2>
                <Select
                  label="Clinic code"
                  value={clinic}
                  onChange={setClinic}
                  options={[
                    ["KNP-VERMA-01", "Dr. Verma · KNP-VERMA-01 · Verified"],
                    ["KNP-SAXENA-02", "Dr. Saxena · Verification pending"],
                    ["none", "Continue without doctor (limited)"],
                  ]}
                />
                <p>Dr. Verma · MD (Medicine) · UPMC/DEMO/48213</p>
                <Field
                  label="Safety contact name"
                  value={safetyName}
                  onChange={setSafetyName}
                />
                <Field
                  label="Local safety contact mobile"
                  value={safetyPhone}
                  onChange={(v: string) =>
                    setSafetyPhone(v.replace(/\D/g, "").slice(0, 10))
                  }
                />
                <Btn
                  disabled={
                    safetyName.trim().length < 2 ||
                    !/^[6-9]\d{9}$/.test(safetyPhone) ||
                    safetyPhone === mobile
                  }
                  onClick={() => setStep(4)}
                >
                  Continue
                </Btn>
              </>
            ) : step === 4 ? (
              <>
                <h2>Itemised consent · optional items default off</h2>
                {[
                  ["readings", "Readings — safety checks (required)"],
                  ["medicines", "Medicines — reminders (required)"],
                  ["labs", "Labs — measured HbA1c change"],
                  ["sprint", "Sprint — personal experiment"],
                  ["doctor", "Share data with linked doctor"],
                  ["family", "Share patient-approved family categories"],
                  ["mood", "Mood — private care-team support"],
                  ["doctorMood", "Separately share mood with doctor"],
                  ["crisisContact", "Local contact only if I tap “not safe”"],
                  ["band", "Band — wellness only"],
                  ["meal", "Meal photos"],
                  ["research", "Research"],
                ].map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    on={consents[key]}
                    disabled={["readings", "medicines"].includes(key)}
                    onChange={() =>
                      setConsents((c) => ({ ...c, [key]: !c[key] }))
                    }
                  />
                ))}
                <Btn onClick={() => setStep(5)}>
                  Give consent to selected items
                </Btn>
              </>
            ) : (
              <>
                <h2>Connect your band</h2>
                <Badge>Recommended</Badge>
                <p>
                  Your band fills your day automatically. Pulse works fully
                  without one. Device permissions remain your choice.
                </p>
                <Btn onClick={() => finish(true)}>Connect band</Btn>
                <Btn secondary onClick={() => finish(false)}>
                  I don’t have a band
                </Btn>
              </>
            )}
            <Btn secondary onClick={() => setStep(step - 1)}>
              Back
            </Btn>
          </>
        )}
      </Card>
    </div>
  );
}
const guide = GUIDE;
function Demo() {
  const { s, mutate, login, go, toast, askConfirm, askText } = useApp();
  const [open, setOpen] = useState(false);
  const [guided, setGuided] = useState(false);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("8.1");
  const step = (i: number) => {
    setIndex(i);
    const [_, role, path, day] = guide[i];
    mutate((s) => {
      s.session = {
        role,
        userId:
          role === "patient"
            ? E.P
            : role === "caregiver"
              ? "CG-0001"
              : role === "doctor"
                ? "DR-0001"
                : "TEAM",
        patientId: E.P,
      };
      E.advance(s, day, "10:30");
      s.session.patientId = E.P;
    });
    go(`/${role}/${path}`);
  };
  const inject = (kind: string) => {
    mutate((s) => {
      const oldPid = s.session.patientId;
      s.session.patientId = E.P;
      if (
        ["Low 52", "Meter LO", "High 320 + vomiting", "Stale low"].includes(
          kind,
        )
      )
        E.recordReading(s, {
          value: kind === "High 320 + vomiting" ? 320 : 52,
          flag: kind === "Meter LO" ? "LO" : undefined,
          severe: kind === "High 320 + vomiting",
          symptoms: kind === "High 320 + vomiting" ? "vomiting" : "",
          measuredAt: kind === "Stale low" ? E.now(s) - 420 : E.now(s),
        });
      else if (kind === "Crisis message") {
        E.textEvent(s, "I don't feel like living anymore");
        s.messages.push({
          id: E.uid("CRISIS"),
          patientId: E.P,
          ...E.stamp(s),
          from: E.P,
          text: "I don't feel like living anymore",
        });
      } else if (kind === "Fasting 74 + 77") {
        const prev = s.sim;
        s.sim = { ...prev, day: Math.max(0, prev.day - 1) };
        E.recordReading(s, { value: 74, context: "fasting" });
        s.sim = prev;
        E.recordReading(s, { value: 77, context: "fasting" });
      } else if (kind === "Payment failed")
        s.payments.push({
          id: E.uid("PAY"),
          patientId: E.P,
          ...E.stamp(s),
          amount: 1199,
          status: "failed",
        });
      else if (kind === "Caregiver request")
        s.links.push({
          id: E.uid("LINK"),
          patientId: E.P,
          ...E.stamp(s),
          viewer: "CG-0003",
          name: "Vikas, nephew",
          status: "pending",
          permissions: {},
        });
      else if (kind === "Unknown myth")
        s.myths.push({
          id: E.uid("MYTH"),
          patientId: E.P,
          ...E.stamp(s),
          claim: "Does a new herbal powder change glucose?",
          verdict: "unverified",
          status: "waiting",
        });
      else if (kind === "Doctor reply") {
        s.messages.push({
          id: E.uid("MSG"),
          patientId: E.P,
          ...E.stamp(s),
          from: "DR-0001",
          text: "Please bring your meter and reports to the clinic.",
        });
        E.notify(
          s,
          E.P,
          E.P,
          "message",
          "Dr. Verma replied",
          "New message",
          undefined,
          "doctor",
        );
      } else if (kind === "Lab result")
        s.labs.push({
          id: E.uid("LAB"),
          patientId: E.P,
          ...E.stamp(s),
          value: Number(value),
          verified: true,
          source: "lab",
          provider: "Demo Diagnostics",
        });
      else if (kind === "Revoke Neha")
        s.links
          .filter((l) => l.viewer === "CG-0002" && l.patientId === E.P)
          .forEach((l) => (l.status = "revoked"));
      else if (kind === "Band disconnected")
        s.band.push({
          id: E.uid("BAND"),
          patientId: E.P,
          ...E.stamp(s),
          status: "disconnected",
        });
      else if (kind === "3 missed tablets")
        E.weekly(s, { habitDays: 3, missed: 3, feeling: "tired" });
      if (kind.startsWith("Band:") || kind.startsWith("Meter auto-sync:")) {
        if (kind.startsWith("Band:")) E.patient(s).consents.band = true;
        const permissions = HC.emptyPermissions();
        if (kind.startsWith("Band:")) {
          permissions.steps = true;
          permissions.sleep = true;
          permissions.heartRate = true;
          permissions.oxygen = true;
        } else permissions.bloodGlucose = true;
        HC.connect(s, permissions, E.P);
        if (kind === "Band: 3 poor-sleep nights") HC.poorSleep(s);
        if (kind === "Band: sync gap 3 days") {
          HC.syncGap(s);
          HC.staleBandNotice(s);
        }
        if (kind.startsWith("Meter auto-sync:"))
          HC.ingestMeter(
            s,
            {
              id: E.uid("HC-M-DEMO"),
              value: kind.endsWith("52") ? 52 : 128,
              context: "fasting",
              measuredAt: E.now(s),
            },
            E.P,
          );
      }
      s.session.patientId = oldPid;
    });
    const target = SCENARIOS[kind];
    if (target) {
      login(target.role, target.userId);
      go(`/${target.role}/${target.path}`);
      setOpen(false);
    }
    toast(`Injected: ${kind}`);
  };
  return (
    <>
      <button className="demo-pill" onClick={() => setOpen(true)}>
        <span />
        DEMO
      </button>
      {guided && (
        <div className="guide">
          <b>
            {index + 1}/{guide.length} · {guide[index][0]}
          </b>
          <div className="m-actions">
            <Btn
              secondary
              disabled={index === 0}
              onClick={() => step(index - 1)}
            >
              Back
            </Btn>
            <Btn
              disabled={index === guide.length - 1}
              onClick={() => step(index + 1)}
            >
              Next
            </Btn>
            <button
              aria-label="End guided demo"
              onClick={() => setGuided(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      {open && (
        <div className="m-overlay" onClick={() => setOpen(false)}>
          <aside
            className="m-drawer demo-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Close demo controls"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
            <h2>Demo controls</h2>
            <p>Not part of the product · synthetic data only</p>
            <h3>Day & time</h3>
            <Field
              label="Simulated day 0–120"
              type="number"
              min={0}
              max={120}
              value={s.sim.day}
              onChange={(v: string) =>
                mutate((s) =>
                  E.advance(
                    s,
                    Math.max(0, Math.min(120, Number(v))),
                    s.sim.time,
                  ),
                )
              }
            />
            <div className="day-chips">
              {[0, 3, 10, 22, 45, 48, 85, 90].map((day) => (
                <button
                  key={day}
                  onClick={() => mutate((s) => E.advance(s, day, s.sim.time))}
                >
                  {day}
                </button>
              ))}
            </div>
            <Field
              label="Simulated time"
              type="time"
              value={s.sim.time}
              onChange={(v: string) =>
                mutate((s) => E.advance(s, s.sim.day, v))
              }
            />
            <h3>Act as</h3>
            <div className="m-grid">
              {[
                [E.P, "patient"],
                ["CG-0001", "caregiver"],
                ["CG-0002", "caregiver"],
                ["DR-0001", "doctor"],
                ["DR-0002", "doctor"],
                ["TEAM", "team"],
              ].map(([id, role]) => (
                <Btn
                  key={id}
                  secondary
                  onClick={() => {
                    login(role as E.Role, id);
                    setOpen(false);
                  }}
                >
                  {roleNames[id]}
                </Btn>
              ))}
            </div>
            <h3>Scenarios</h3>
            <Field
              label="Custom lab HbA1c 4–15"
              type="number"
              value={value}
              onChange={setValue}
            />
            <div className="m-grid">
              {Object.keys(SCENARIOS).map((k) => (
                <Btn
                  key={k}
                  secondary
                  disabled={
                    k === "Lab result" &&
                    (Number(value) < 4 || Number(value) > 15)
                  }
                  onClick={() => inject(k)}
                >
                  {k}
                </Btn>
              ))}
            </div>
            <Toggle
              label="Offline"
              on={!s.sim.online}
              onChange={() =>
                mutate((s) =>
                  s.sim.online ? (s.sim.online = false) : E.sync(s),
                )
              }
            />
            <div className="m-stack">
              <Btn
                onClick={() => {
                  setGuided(true);
                  step(0);
                  setOpen(false);
                }}
              >
                Start guided demo
              </Btn>
              <Btn
                secondary
                onClick={() => {
                  go("/dev/tests");
                  setOpen(false);
                }}
              >
                Self-test
              </Btn>
              <Btn
                danger
                onClick={async () => {
                  if (await askConfirm("Reset all synthetic demo changes?")) {
                    mutate((s) => Object.assign(s, E.seed()));
                    go("/");
                    setGuided(false);
                    setOpen(false);
                  }
                }}
              >
                Reset demo
              </Btn>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
function TestsPage() {
  const { go, askConfirm, askText } = useApp();
  const tests = selfTests();
  return (
    <div className="m-test-page">
      <h1>Pulse self-test</h1>
      <p>Executed pure-rule checks · synthetic state</p>
      <Badge>
        {tests.filter((t) => t.pass).length}/{tests.length} passed
      </Badge>
      <Btn secondary onClick={() => go("/")}>
        Home
      </Btn>
      {tests.map((t, i) => (
        <div key={i} className={`test-row ${t.pass ? "pass" : "fail"}`}>
          <b>
            {t.pass ? "✓" : "✕"} {t.group}: {t.name}
          </b>
          <small>
            Expected: {JSON.stringify(t.expected)} · Actual:{" "}
            {JSON.stringify(t.actual)}
          </small>
        </div>
      ))}
    </div>
  );
}
class Boundary extends React.Component<
  {
    children: ReactNode;
  },
  {
    error: boolean;
  }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <div className="m-auth">
          <h1>Unable to load this view</h1>
          <p>Your saved demo records are retained.</p>
          <Btn
            onClick={() => {
              this.setState({ error: false });
              location.hash = "#/";
            }}
          >
            Retry from home
          </Btn>
        </div>
      );
    return this.props.children;
  }
}
export default function App() {
  const [s, setState] = useState<E.State>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if ([3, 4].includes(saved?.version)) {
        const migrated = E.migrateState(saved);
        migrated.users ||= E.seed().users;
        try {
          migrated.session = E.sessionFromStorage(
            JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"),
          );
        } catch {
          migrated.session = E.seed().session;
        }
        return migrated;
      }
      return E.seed();
    } catch {
      return E.seed();
    }
  });
  const [route, setRoute] = useState(
    resolveRoute(location.hash.slice(1) || "/"),
  );
  const [message, setMessage] = useState("");
  const [locked, setLocked] = useState(false);
  const [unlock, setUnlock] = useState("");
  const [unlockFailures, setUnlockFailures] = useState(0);
  const [loading, setLoading] = useState(true);
  const routeRef = useRef(route);
  routeRef.current = route;
  const lastActivity = useRef(Date.now());
  const stateRef = useRef(s);
  stateRef.current = s;
  const mutate = (f: (s: E.State) => void) => {
    const next = structuredClone(stateRef.current);
    f(next);
    E.normalizeDeviceState(next);
    stateRef.current = next;
    setState(next);
  };
  const go = (input: string) => {
    const path = resolveRoute(input);
    if (path !== routeRef.current) setLoading(true);
    else setLoading(false);
    location.hash = `#${path}`;
    setRoute(path);
    window.scrollTo(0, 0);
  };
  const [question, setQuestion] = useState<{
    text: string;
    type: "confirm" | "text";
  } | null>(null);
  const [answer, setAnswer] = useState("");
  const resolveQuestion = useRef<((answer: any) => void) | null>(null);
  const askConfirm = (text: string) =>
    new Promise<boolean>((resolve) => {
      resolveQuestion.current = resolve;
      setQuestion({ text, type: "confirm" });
    });
  const askText = (text: string, initial = "") =>
    new Promise<string | null>((resolve) => {
      resolveQuestion.current = resolve;
      setAnswer(initial);
      setQuestion({ text, type: "text" });
    });
  const finishQuestion = (yes: boolean) => {
    const resolve = resolveQuestion.current;
    resolveQuestion.current = null;
    setQuestion(null);
    resolve?.(question?.type === "text" ? (yes ? answer : null) : yes);
  };
  const toast = (text: string) => {
    setMessage(text);
  };
  const login = (role: E.Role, id?: string) => {
    const user =
      id ||
      (role === "patient"
        ? E.P
        : role === "caregiver"
          ? "CG-0001"
          : role === "doctor"
            ? "DR-0001"
            : "TEAM");
    mutate((s) => {
      s.session = {
        role,
        userId: user,
        patientId: E.P,
      };
    });
    setLocked(false);
    go(`/${role}/${role === "team" ? "desk" : "home"}`);
  };
  useEffect(() => {
    const initial = resolveRoute(location.hash.slice(1) || "/");
    if (location.hash !== `#${initial}`)
      history.replaceState(null, "", `#${initial}`);
    const change = () => {
      const next = resolveRoute(location.hash.slice(1) || "/");
      if (location.hash !== `#${next}`)
        history.replaceState(null, "", `#${next}`);
      if (next !== routeRef.current) {
        setLoading(true);
        setRoute(next);
      }
    };
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s.session));
      const serialized = JSON.stringify({ ...s, session: E.seed().session });
      if (localStorage.getItem(KEY) !== serialized)
        localStorage.setItem(KEY, serialized);
    } catch {
      setMessage(
        "Browser storage is full; download your demo data before closing.",
      );
    }
  }, [s]);
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue)
        try {
          const v = JSON.parse(e.newValue);
          if ([3, 4].includes(v.version))
            setState((prev) => ({
              ...E.migrateState(v),
              session: prev.session,
            }));
        } catch {}
    };
    addEventListener("storage", handler);
    return () => removeEventListener("storage", handler);
  }, []);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 180);
    return () => clearTimeout(t);
  }, [route]);
  useEffect(() => {
    const activity = () => {
      lastActivity.current = Date.now();
    };
    addEventListener("pointerdown", activity);
    addEventListener("keydown", activity);
    const t = setInterval(() => {
      if (
        s.session.role === "doctor" &&
        Date.now() - lastActivity.current > s.settings.lockMinutes * 60000
      )
        setLocked(true);
    }, 1000);
    return () => {
      clearInterval(t);
      removeEventListener("pointerdown", activity);
      removeEventListener("keydown", activity);
    };
  }, [s.session.role, s.settings.lockMinutes]);
  useEffect(() => {
    const role = route.split("/")[1] as E.Role;
    const pid = route.startsWith("/doctor/patient/")
      ? route.split("/")[3]
      : s.session.patientId;
    if (
      ["caregiver", "doctor", "team"].includes(role) &&
      s.session.role === role &&
      pid
    ) {
      mutate((s) => {
        if (role === "doctor" && s.patients.some((p) => p.id === pid))
          s.session.patientId = pid;
        for (const category of role === "caregiver"
          ? E.categories
          : role === "doctor"
            ? [
                "readings",
                "labs",
                "sprint",
                "records",
                "medicines",
                ...(route.includes("/patient/") &&
                (!route.split("/")[4] || route.endsWith("/overview")) &&
                E.allow(s, s.session.userId, pid, "mood")
                  ? ["mood"]
                  : []),
              ]
            : route.includes("desk")
              ? ["alerts"]
              : [])
          E.readLog(s, s.session.userId, pid, category);
      });
    }
  }, [route, s.session.userId, s.session.patientId]);
  const hcPatient = s.session.patientId,
    hcConnection = s.healthConnect?.[hcPatient];
  useEffect(() => {
    if (FEATURES.wellnessBand || FEATURES.meterAutoSync)
      mutate((s) => {
        HC.sync(s, hcPatient, FEATURES.meterAutoSync);
        HC.staleBandNotice(s, hcPatient);
      });
  }, [
    s.sim.day,
    s.sim.time,
    s.sim.online,
    hcPatient,
    hcConnection?.connected,
    JSON.stringify(hcConnection?.permissions),
    E.patient(s, hcPatient)?.consents.band,
  ]);
  const launchNav = (key: string) => {
    const map: any = {
      privacy: "/privacy-notice",
      authPatient: "/patient/login",
      authCaregiver: "/caregiver/login",
      authDoctor: "/doctor/login",
      launch: "/",
    };
    go(key.startsWith("/") ? key : map[key] || "/");
  };
  const role = route.split("/")[1] as E.Role;
  const page = route.split("?")[0].split("/")[2] || "home";
  const pages = ROUTES[role] ? allowedPages(role) : [];
  let content: ReactNode;
  if (route === "/")
    content = <Launch quickLogin={login} navigate={launchNav} />;
  else if (route === "/dev/tests") content = <TestsPage />;
  else if (route === "/terms" || route === "/complaints")
    content = (
      <div className="m-auth">
        <h1>{route === "/terms" ? "Prototype terms" : "Complaints"}</h1>
        <p>
          {route === "/terms"
            ? "Pulse is a synthetic hackathon demonstration. It does not diagnose or prescribe. Your doctor decides."
            : "For a demo complaint, contact the care team or sign in and use Help & complaints. You can also complain to the Data Protection Board of India."}
        </p>
        <Btn onClick={() => go("/")}>Home</Btn>
      </div>
    );
  else if (route === "/privacy-notice")
    content = (
      <div className="m-auth">
        <h1>Pulse privacy notice · demo</h1>
        <p>
          Required readings and medicines support safety and reminders. Labs,
          sprint, mood, family sharing, wellness, photos and research are
          optional and controlled separately by the patient.
        </p>
        <p>
          Mood and private notes never go to family. Sensitive records stay
          hidden from caregivers. You can access, correct, erase or withdraw
          through My data and Consent. You can also complain to the Data
          Protection Board of India.
        </p>
        <Btn onClick={() => go("/")}>Home</Btn>
      </div>
    );
  else if (!["patient", "caregiver", "doctor", "team"].includes(role))
    content = (
      <div className="m-auth">
        <h1>Page not found</h1>
        <Btn onClick={() => go("/")}>Go home</Btn>
      </div>
    );
  else if (["login", "register"].includes(page) || s.session.role !== role)
    content = <Auth role={role} />;
  else if (locked && role === "doctor")
    content = (
      <div className="m-auth">
        <h1>Session locked</h1>
        <Field
          label="Signing PIN to unlock"
          type="password"
          value={unlock}
          onChange={setUnlock}
        />
        <Btn
          disabled={unlock.length !== 6}
          onClick={() => {
            if (unlock === s.doctors[s.session.userId].pin) {
              lastActivity.current = Date.now();
              setLocked(false);
              setUnlock("");
            } else {
              const n = unlockFailures + 1;
              setUnlockFailures(n);
              toast("Incorrect PIN");
              if (n >= 5) {
                mutate((s) => {
                  s.session.role = null;
                  s.session.userId = "";
                });
                setLocked(false);
                go("/");
              }
            }
          }}
        >
          Unlock
        </Btn>
        <Btn
          secondary
          onClick={() => {
            mutate((s) => {
              s.session.role = null;
              s.session.userId = "";
            });
            go("/");
          }}
        >
          Log out
        </Btn>
      </div>
    );
  else if (role === "patient" && (!E.patient(s) || E.patient(s).deleted))
    content = (
      <div className="m-auth">
        <h1>Account unavailable</h1>
        <Btn onClick={() => go("/")}>Home</Btn>
      </div>
    );
  else if (
    role === "doctor" &&
    !s.doctors[s.session.userId]?.verified &&
    page !== "home" &&
    page !== "settings"
  )
    content = (
      <Shell title="Verification pending">
        <Empty>Patient data and prescribing unlock after verification.</Empty>
      </Shell>
    );
  else if (!featureVisible(page))
    content = (
      <Shell title="Today">
        <Empty>This feature is parked for the demo.</Empty>
        <Btn onClick={() => go(`/${role}/home`)}>Today</Btn>
      </Shell>
    );
  else if (!pages.includes(page))
    content = (
      <Shell title="Page not found">
        <Empty>This route is not available for this role.</Empty>
        <Btn onClick={() => go(`/${role}/home`)}>Go home</Btn>
      </Shell>
    );
  else if (
    role === "caregiver" &&
    ["records", "notes", "care", "billing", "alerts"].includes(page) &&
    !E.connected(s, s.session.userId, s.session.patientId)
  )
    content = (
      <Shell title="Access withdrawn">
        <Empty>The patient stopped sharing. Return to your family list.</Empty>
        <Btn onClick={() => go("/caregiver/choose")}>Family members</Btn>
      </Shell>
    );
  else if (page === "home")
    content =
      role === "patient" ? (
        <PatientHome />
      ) : role === "caregiver" ? (
        <Caregiver />
      ) : role === "doctor" ? (
        <DoctorHome />
      ) : (
        <Desk />
      );
  else if (page === "log") content = <Log />;
  else if (page === "sugar-detective") content = <Sprint />;
  else if (page === "weekly") content = <Weekly />;
  else if (page === "mood") content = <Mood />;
  else if (page === "crisis" || page === "safety" || page === "alerts")
    content =
      role === "caregiver" ? (
        <CaregiverAlerts />
      ) : (
        <Shell title="Safety support">
          <Safety rule={page === "crisis" ? "S7" : undefined} />
        </Shell>
      );
  else if (page === "progress") content = <Progress />;
  else if (page === "medicines")
    content = (
      <Shell title="Medicines">
        <DoseList pid={s.session.patientId} />
      </Shell>
    );
  else if (page === "records") content = <Records />;
  else if (page === "notes")
    content = role === "caregiver" ? <CaregiverNotes /> : <Notes />;
  else if (page === "family")
    content =
      role === "patient" ? <PatientFamily /> : <Utility kind="permissions" />;
  else if (page === "settings") content = <Settings />;
  else if (page === "billing" || page === "proof")
    content =
      role === "caregiver" &&
      !E.allow(s, s.session.userId, s.session.patientId, "proof") ? (
        <Shell title="Not shared">
          <Empty>Proof and billing are not shared with this caregiver.</Empty>
        </Shell>
      ) : (
        <Billing proofOnly={page === "proof"} />
      );
  else if (page === "tests") content = <PatientTests />;
  else if (page === "doctor") content = <PatientDoctor />;
  else if (page === "messages") content = <Messages />;
  else if (page === "appointments") content = <Appointments />;
  else if (page === "myth") content = <Myth />;
  else if (page === "patients") content = <Registry />;
  else if (
    page === "patient" &&
    !E.allow(
      s,
      s.session.userId,
      route.split("/")[3] || s.session.patientId,
      "readings",
    )
  )
    content = (
      <Shell title="Access withdrawn">
        <Empty>Patient consent or doctor verification is required.</Empty>
      </Shell>
    );
  else if (page === "patient")
    content = route.includes("/prescriptions/new") ? <Rx /> : <DoctorPatient />;
  else if (page === "desk") content = <CareDesk />;
  else if (page === "myths") content = <MythReview />;
  else if (page === "impact" || page === "outcomes") content = <Impact />;
  else if (page === "notifications") content = <Notifications />;
  else if (page === "band") content = <Band />;
  else if (
    [
      "choose",
      "connect",
      "permissions",
      "outbound",
      "care",
      "settings",
      "profile",
      "help",
    ].includes(page)
  )
    content = page === "connect" ? <Connect /> : <Utility />;
  else
    content = (
      <Shell title="Page not found">
        <Empty>This route is not available.</Empty>
        <Btn onClick={() => go(`/${role}/home`)}>Go home</Btn>
      </Shell>
    );
  return (
    <C.Provider
      value={{
        s,
        mutate,
        go,
        toast,
        login,
        route,
        askConfirm,
        askText,
      }}
    >
      <Boundary key={route}>
        {loading ? (
          <div className="m-loading" role="status" aria-label="Loading">
            <div />
            <div />
            <div />
          </div>
        ) : (
          content
        )}
      </Boundary>
      <Demo />
      {question && (
        <div className="m-overlay m-confirm-overlay">
          <section
            className="m-confirm-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm action"
            onKeyDown={(e) => {
              if (e.key === "Escape") finishQuestion(false);
            }}
          >
            <h2>
              {question.type === "text" ? "Enter details" : "Confirm action"}
            </h2>
            <p>{question.text}</p>
            {question.type === "text" && (
              <input
                autoFocus
                aria-label="Details"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            )}
            <div className="m-actions">
              <button
                className="m-btn secondary"
                autoFocus={question.type === "confirm"}
                onClick={() => finishQuestion(false)}
              >
                Cancel
              </button>
              <button
                className="m-btn"
                disabled={question.type === "text" && !answer.trim()}
                onClick={() => finishQuestion(true)}
              >
                Confirm
              </button>
            </div>
          </section>
        </div>
      )}

      {message && (
        <div className="m-toast" role="status">
          {message}
        </div>
      )}
    </C.Provider>
  );
}
function PatientTests() {
  const { s, mutate, go, toast, askConfirm, askText } = useApp();
  const list = s.testOrders.filter(
    (t) => t.patientId === s.session.patientId && E.visible(t, s),
  );
  return (
    <Shell title="Tests & home collection">
      {list.map((t) => (
        <Card key={t.id} title={t.test}>
          <p>
            Due {E.date(t.due)} · {t.status} ·{" "}
            {t.reason || "Doctor-recommended test"}
          </p>
          {t.status === "Recommended" && (
            <Btn
              onClick={() => {
                mutate((s) => {
                  s.testOrders.find((r) => r.id === t.id)!.status = "Booked";
                  E.notify(
                    s,
                    t.patientId,
                    t.patientId,
                    "tests",
                    "Home collection booked",
                    E.date(t.due),
                    undefined,
                    "tests",
                  );
                });
                toast("Synthetic home collection booked");
              }}
            >
              Book demo home collection
            </Btn>
          )}
          {t.status === "Booked" && (
            <Btn
              secondary
              onClick={() =>
                mutate((s) => {
                  s.testOrders.find((r) => r.id === t.id)!.status = "Collected";
                })
              }
            >
              Simulate sample collected
            </Btn>
          )}
          {["Collected", "Result uploaded"].includes(t.status!) && (
            <Btn onClick={() => go("/patient/records/upload")}>
              Upload result for verification
            </Btn>
          )}
        </Card>
      ))}
      {!list.length && <Empty>No recommended tests yet.</Empty>}
    </Shell>
  );
}
