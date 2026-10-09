import type { Patient, Row } from "./lib/engine";
import { date } from "./lib/engine";
export function RxPreview({
  rx,
  p,
  doctor,
  onClose,
}: {
  rx: Row | any;
  p: Patient;
  doctor: any;
  onClose: () => void;
}) {
  return (
    <div
      className="m-overlay rx-print-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Prescription preview"
      onClick={onClose}
    >
      <div className="rx-paper" onClick={(e) => e.stopPropagation()}>
        <div className="m-actions rx-print-controls">
          <button className="m-btn" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
          <button className="m-btn secondary" onClick={onClose}>
            Close preview
          </button>
        </div>
        <header>
          <h1>{rx.doctorName || doctor.name}</h1>
          <p>
            {rx.doctorQualification || doctor.qualification || "MD (Medicine)"}{" "}
            · Registration{" "}
            {rx.doctorRegistration || doctor.registration || "UPMC/DEMO/48213"}
          </p>
          <p>Verma Diabetes & Family Clinic (demo) · Kanpur · KNP-VERMA-01</p>
        </header>
        <hr />
        <h2>
          Prescription {rx.signed ? `v${rx.version}` : "draft — not signed"}
        </h2>
        <p>
          {p.name} · {p.age} years · {p.sex} · {p.id}
        </p>
        <p>
          Date: {date(rx.day)} · Time: {rx.time} · Consultation: {rx.mode}
        </p>
        <p>Provisional diagnosis: {rx.diagnosis}</p>
        <table>
          <thead>
            <tr>
              <th>Generic medicine</th>
              <th>Dose / instruction</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {rx.medicines?.map((m: any, i: number) => (
              <tr key={i}>
                <td>
                  {m.generic}
                  <br />
                  {m.strength}
                </td>
                <td>
                  {m.pattern}
                  <br />
                  {m.instruction}
                </td>
                <td>{m.duration} days</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Advice: {rx.advice || "As discussed with the doctor."}</p>
        <p>Follow-up: {rx.followup}</p>
        <p>
          {rx.signed
            ? "PIN-signed by the verified demo doctor"
            : "Signature pending — cannot be used as a prescription"}
        </p>
        <footer>
          Synthetic hackathon data · no real prescription or pharmacy order is
          issued.
        </footer>
      </div>
    </div>
  );
}
