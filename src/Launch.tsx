import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Droplets,
  FileText,
  FlaskConical,
  HeartHandshake,
  Home,
  IndianRupee,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  NotebookPen,
  Pill,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  Share2,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TestTube2,
  TrendingDown,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";

type Role = "patient" | "caregiver" | "doctor" | "team" | null;
type Route = string;
function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  ariaLabel,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`btn btn-${variant} ${className}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="icon-btn"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "info" | "private";
  children: ReactNode;
}) {
  const Icon =
    tone === "success" ? Check : tone === "private" ? LockKeyhole : CircleAlert;
  return (
    <span className={`status-pill status-${tone}`}>
      <Icon size={14} strokeWidth={2.5} />
      {children}
    </span>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo-lockup">
      <span className="logo-mark">
        <Activity size={compact ? 20 : 24} strokeWidth={2.8} />
      </span>
      <span className={compact ? "logo-text compact" : "logo-text"}>pulse</span>
    </div>
  );
}

export function Launch({
  quickLogin,
  navigate,
}: {
  quickLogin: (role: Exclude<Role, null>) => void;
  navigate: (route: Route) => void;
}) {
  const roles = [
    {
      role: "patient" as const,
      icon: UserRound,
      eyebrow: "For you",
      title: "Patient",
      copy: "Understand your sugar. See the effect of small habits on your own meter.",
      accent: "neem",
    },
    {
      role: "caregiver" as const,
      icon: HeartHandshake,
      eyebrow: "For family",
      title: "Caregiver",
      copy: "Stay close without taking control. See only what your family shares.",
      accent: "indigo",
    },
    {
      role: "doctor" as const,
      icon: Stethoscope,
      eyebrow: "For clinicians",
      title: "Doctor",
      copy: "A clear, longitudinal view built from patient-reported and lab data.",
      accent: "slate",
    },
  ];

  return (
    <div className="launch-page">
      <div className="launch-topbar">
        <Logo />
        <div className="launch-links">
          <button onClick={() => navigate("privacy")} type="button">
            Privacy
          </button>
        </div>
      </div>
      <main className="launch-main">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={16} /> Continuous care, made personal
            </span>
            <h1>
              Your meter.
              <br />
              <em>Your proof.</em>
            </h1>
            <p>
              Understand the relationship between daily habits and sugar over 90
              days, with your doctor and family.
            </p>
            <div className="hero-actions">
              <Button onClick={() => quickLogin("patient")}>
                See Ramesh's demo <ArrowRight size={18} />
              </Button>
              <Button variant="secondary" onClick={() => navigate("privacy")}>
                <ShieldCheck size={18} /> Your privacy
              </Button>
            </div>
            <div className="trust-row">
              <span>
                <ShieldCheck size={17} /> Patient-controlled sharing
              </span>
              <span>
                <Stethoscope size={17} /> Doctor verified
              </span>
              <span>
                <FlaskConical size={17} /> Synthetic demo data
              </span>
            </div>
          </div>
          <div
            className="hero-visual"
            aria-label="Sugar Detective result preview"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="phone-preview">
              <div className="preview-head">
                <Logo compact />
                <span>Day 10 / 90</span>
              </div>
              <div className="preview-card">
                <span className="mini-label">Sugar Detective result</span>
                <div className="result-number">
                  31 <small>mg/dL</small>
                </div>
                <p>Average smaller sugar rise on evenings with a walk</p>
                <div className="mini-bars">
                  <div>
                    <span>With a walk</span>
                    <i className="bar bar-short" />
                    <b>41</b>
                  </div>
                  <div>
                    <span>Without a walk</span>
                    <i className="bar bar-long" />
                    <b>72</b>
                  </div>
                </div>
                <StatusPill tone="success">Same every time</StatusPill>
              </div>
              <div className="preview-note">
                <Check size={18} /> Your own data. Your own learning.
              </div>
            </div>
          </div>
        </section>

        <section className="role-section">
          <div className="section-heading">
            <span>ONE SHARED CARE CIRCLE</span>
            <h2>The right view for every role</h2>
            <p>
              One shared story. Each role sees only what is needed and
              permitted.
            </p>
          </div>
          <div className="role-grid">
            {roles.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  className={`role-card accent-${item.accent}`}
                  key={item.role}
                >
                  <span className="role-icon">
                    <Icon size={24} />
                  </span>
                  <span className="role-eyebrow">{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <div className="role-card-actions">
                    <Button
                      onClick={() =>
                        navigate(
                          item.role === "patient"
                            ? "authPatient"
                            : item.role === "caregiver"
                              ? "authCaregiver"
                              : "authDoctor",
                        )
                      }
                    >
                      Login
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigate(
                          item.role === "patient"
                            ? "authPatient"
                            : item.role === "caregiver"
                              ? "authCaregiver"
                              : "authDoctor",
                        );
                        window.location.hash = `#/${item.role}/register`;
                      }}
                    >
                      Register
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="quick-demo">
            <div>
              <span className="demo-label">QUICK DEMO LOGIN</span>
              <p>
                Jump into the same synthetic care story from any point of view.
              </p>
            </div>
            <div className="demo-people">
              {[
                ["RK", "Ramesh", "patient"],
                ["AK", "Amit", "caregiver"],
                ["AV", "Dr. Verma", "doctor"],
                ["PP", "Pooja", "team"],
              ].map(([initials, name, role]) => (
                <button
                  key={name}
                  onClick={() => quickLogin(role as Exclude<Role, null>)}
                  type="button"
                >
                  <span>{initials}</span>
                  <b>{name}</b>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="launch-footer">
        <span>
          <span className="kanpur-dot" /> Kanpur pilot
        </span>
        <p>Pulse does not diagnose or prescribe — your doctor decides.</p>
        <div>
          <button onClick={() => navigate("privacy")} type="button">
            Privacy notice
          </button>
          <button onClick={() => quickLogin("team")} type="button">
            Staff sign-in
          </button>
        </div>
      </footer>
      <div className="emergency-strip">
        <span>
          <CircleAlert size={18} /> Need help now?
        </span>
        <a href="tel:112">112</a>
        <a href="tel:14416">Tele-MANAS 14416</a>
      </div>
    </div>
  );
}
