import { FEATURES, featureVisible } from "./features";
export type Role = "patient" | "caregiver" | "doctor" | "team";
export type Destination = { path: string; label: string; action?: "switch" };
const d = (path: string, label: string): Destination => ({ path, label });
export const ROUTES: Record<
  Role,
  {
    nav: Destination[];
    floating?: Destination;
    drawer: { title: string; items: Destination[] }[];
    hidden: string[];
    redirects: Record<string, string>;
  }
> = {
  patient: {
    nav: [
      d("home", "Today"),
      d("progress", "Progress"),
      d("records", "Records"),
      d("doctor", "Doctor"),
    ],
    drawer: [
      {
        title: "My care",
        items: [
          d("sugar-detective", "Sugar Detective"),
          ...(FEATURES.weeklyQuestionnaire
            ? [d("weekly", "Sunday check")]
            : []),
          d("mood", "Mood check — private"),
          d("myth", "True or false?"),
          d("notes", "My notes"),
        ],
      },
      {
        title: "Account",
        items: [
          d("family", "Family & privacy"),
          d("billing", "Payments"),
          d("settings", "Settings"),
          d("help", "Help & complaints"),
        ],
      },
    ],
    floating: d("log", "+ Log"),
    hidden: ["safety", "crisis", "proof", "notifications"],
    redirects: {
      jasoos: "sugar-detective",
      ...(!FEATURES.weeklyQuestionnaire ? { weekly: "home" } : {}),
      privacy: "family",
      "my-data": "family",
      profile: "settings",
      band: "settings",
      medicines: "home",
      messages: "doctor",
      appointments: "doctor?tab=appointments",
      tests: "doctor?tab=tests",
    },
  },
  caregiver: {
    nav: [d("home", "Home"), d("updates", "Updates"), d("billing", "Payments")],
    drawer: [
      {
        title: "Family",
        items: [
          {
            path: "home?switch=1",
            label: "Switch family member",
            action: "switch",
          },
          d("connect", "Connect a family member"),
          d("family", "What's shared with me"),
          d("myth", "True or false?"),
          d("settings", "Settings"),
          d("help", "Help"),
        ],
      },
    ],
    hidden: ["alerts", "notes"],
    redirects: {
      care: "home",
      choose: "home?switch=1",
      permissions: "family",
      notifications: "updates",
      profile: "settings",
      records: "notes",
    },
  },
  doctor: {
    nav: [
      d("home", "Today"),
      d("patients", "Patients"),
      d("messages", "Messages"),
      d("appointments", "Appointments"),
    ],
    drawer: [
      {
        title: "Practice",
        items: [
          d("outcomes", "Practice outcomes"),
          d("settings", "Settings"),
          d("help", "Help"),
        ],
      },
    ],
    hidden: ["patient"],
    redirects: { profile: "settings", notifications: "home" },
  },
  team: {
    nav: [d("desk", "Care desk")],
    drawer: [
      {
        title: "Account",
        items: [d("settings", "Settings"), d("help", "Help")],
      },
    ],
    hidden: ["myths", "impact"],
    redirects: {
      home: "desk",
      "case-review": "desk",
      outbound: FEATURES.teamOutboundLog ? "desk?tab=sent" : "desk",
      notifications: "desk",
      profile: "settings",
    },
  },
};
export const PROFILE_TABS = [
  d("overview", "Brief"),
  d("charts", "Charts"),
  d("records", "Records"),
  d("prescriptions", "Prescriptions"),
  d("messages", "Messages"),
];
export function resolveRoute(input: string): string {
  const [pathname, query = ""] = input.split("?");
  const parts = pathname.split("/");
  const role = parts[1] as Role;
  const config = ROUTES[role];
  if (!config) return input;
  let target = config.redirects[parts[2]];
  if (role === "doctor" && parts[2] === "patient") {
    const redirects: Record<string, string> = {
      reports: "records",
      tests: "records",
      notes: "messages",
      mood: "overview",
    };
    if (redirects[parts[4]])
      return `/doctor/patient/${parts[3]}/${redirects[parts[4]]}${query ? "?" + query : ""}`;
  }
  if (!target) return input;
  const [next, defaults = ""] = target.split("?");
  const params = new URLSearchParams(query);
  new URLSearchParams(defaults).forEach((v, k) => params.set(k, v));
  return `/${role}/${next}${params.size ? "?" + params.toString() : ""}`;
}
export function visibleRoutes(role: Role): string[] {
  return [
    ...new Set(
      [
        ...ROUTES[role].nav,
        ...(ROUTES[role].floating ? [ROUTES[role].floating!] : []),
        ...ROUTES[role].drawer.flatMap((g) => g.items),
      ]
        .filter((x) => !x.action && featureVisible(x.path.split("?")[0]))
        .map((x) => `/${role}/${x.path}`),
    ),
  ];
}
export function allowedPages(role: Role): string[] {
  return [
    ...ROUTES[role].nav,
    ...(ROUTES[role].floating ? [ROUTES[role].floating!] : []),
    ...ROUTES[role].drawer.flatMap((g) => g.items),
  ]
    .map((d) => d.path.split("?")[0])
    .concat(ROUTES[role].hidden);
}
export const GUIDE: [string, Role, string, number][] = [
  ["Ramesh chooses family sharing", "patient", "family", 0],
  ["Review the six-evening walking result", "patient", "sugar-detective", 10],
  ["Amit sees permitted progress", "caregiver", "home", 10],
  [
    FEATURES.weeklyQuestionnaire
      ? "Ramesh’s Sunday check"
      : "Ramesh reviews Today",
    "patient",
    FEATURES.weeklyQuestionnaire ? "weekly" : "home",
    22,
  ],
  ["Pooja reviews the support queue", "team", "desk", 22],
  ["Ramesh sends a private message to his doctor", "patient", "doctor", 22],
  ["Dr. Verma reviews Today", "doctor", "home", 45],
  ["Inject Low 52 and open safety steps", "patient", "safety", 45],
  ["Amit handles the shared alert", "caregiver", "alerts", 45],
  [
    "Dr. Verma reviews the Health map",
    "doctor",
    "patient/PUL-KNP-0001/map",
    90,
  ],
  [
    "Sign a renewal with PIN 246810",
    "doctor",
    "patient/PUL-KNP-0001/prescriptions/new",
    90,
  ],
  ["Ramesh’s Day-90 Proof Card", "patient", "proof", 90],
  ["Amit renews using mock UPI", "caregiver", "billing", 90],
  ["Pooja reviews the support queue", "team", "desk", 90],
];
export const SCENARIOS: Record<
  string,
  { role: Role; userId: string; path: string }
> = Object.fromEntries(
  [
    ["Low 52", "patient", "PUL-KNP-0001", "safety"],
    ["High 320 + vomiting", "patient", "PUL-KNP-0001", "safety"],
    ["Stale low", "patient", "PUL-KNP-0001", "safety"],
    ["Crisis message", "patient", "PUL-KNP-0001", "crisis"],
    ["3 missed tablets", "patient", "PUL-KNP-0001", "home"],
    ["Payment failed", "caregiver", "CG-0001", "billing"],
    ["Caregiver request", "patient", "PUL-KNP-0001", "family"],
    ["Lab result", "patient", "PUL-KNP-0001", "records"],
    ["Band: 3 poor-sleep nights", "patient", "PUL-KNP-0001", "progress"],
    ["Band: sync gap 3 days", "patient", "PUL-KNP-0001", "progress"],
    ["Meter auto-sync: 52", "patient", "PUL-KNP-0001", "safety"],
    ["Meter auto-sync: 128 fasting", "patient", "PUL-KNP-0001", "home"],
  ].map(([label, role, userId, path]) => [
    label,
    { role: role as Role, userId, path },
  ]),
);
