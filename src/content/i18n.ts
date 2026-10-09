import hi from "./hi.json";
import en from "./en.json";
export function t(key: string, lang: "hi" | "en") {
  const dict: Record<string, string> = lang === "hi" ? hi : en;
  return dict[key] || key;
}
