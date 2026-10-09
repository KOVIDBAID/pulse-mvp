import en from "./en.json";
export function t(key: string) {
  return (en as Record<string, string>)[key] || key;
}
