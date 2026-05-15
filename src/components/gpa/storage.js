export const STORAGE_KEY = "gpa_v1";
export const THEME_STORAGE_KEY = "theme";

export function loadTranscriptData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTranscriptData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage can fail in private browsing or restricted webviews.
  }
}

export function loadThemePreference() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

export function saveThemePreference(isDark) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  } catch {
    // Theme persistence is optional; the UI still works without it.
  }
}
