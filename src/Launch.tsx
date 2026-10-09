import { HeartHandshake, Stethoscope, UserRound } from "lucide-react";
import type { Role } from "./app/routes";
export function Launch({
  quickLogin,
  navigate,
}: {
  quickLogin: (role: Role) => void;
  navigate: (route: string) => void;
}) {
  const roles = [
    {
      role: "patient",
      label: "Patient",
      copy: "Understand your sugar with your own meter.",
      Icon: UserRound,
    },
    {
      role: "caregiver",
      label: "Family caregiver",
      copy: "Support your family with the information they share.",
      Icon: HeartHandshake,
    },
    {
      role: "doctor",
      label: "Doctor",
      copy: "Review your patients’ progress and continue their care.",
      Icon: Stethoscope,
    },
  ] as const;
  return (
    <main className="launch-minimal">
      <header>
        <h1>Pulse</h1>
        <p>Your meter. Your proof.</p>
      </header>
      <div className="launch-role-grid">
        {roles.map(({ role, label, copy, Icon }) => (
          <section key={role}>
            <Icon aria-hidden="true" />
            <h2>{label}</h2>
            <p>{copy}</p>
            <div className="m-actions">
              <button onClick={() => navigate(`/${role}/login`)}>Log in</button>
              <button onClick={() => navigate(`/${role}/register`)}>
                Register
              </button>
            </div>
          </section>
        ))}
      </div>
      <section className="launch-demo">
        <h2>Try the demo as:</h2>
        <div className="m-actions">
          {[
            ["Ramesh (patient)", "patient"],
            ["Amit (son)", "caregiver"],
            ["Dr. Verma", "doctor"],
            ["Pooja (care team)", "team"],
          ].map(([label, role]) => (
            <button key={role} onClick={() => quickLogin(role as Role)}>
              {label}
            </button>
          ))}
        </div>
      </section>
      <button
        className="launch-text-link"
        onClick={() => navigate("/caregiver/connect")}
      >
        Have an invite code?
      </button>
      <footer>
        {[
          ["Privacy notice", "/privacy-notice"],
          ["Terms", "/terms"],
          ["Complaints", "/complaints"],
        ].map(([label, path]) => (
          <button key={path} onClick={() => navigate(path)}>
            {label}
          </button>
        ))}
      </footer>
      <aside className="launch-emergency" aria-label="Emergency help">
        <a href="tel:112">Call 112</a>
        <a href="tel:14416">Call 14416 (Tele-MANAS, 24×7, free)</a>
      </aside>
    </main>
  );
}
