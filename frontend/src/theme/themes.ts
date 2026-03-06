export type ThemeType = "light" | "dark" | "ocean"

export const themes = {
  light: {
    "--bg": "#ffffff",
    "--text": "#000000",
    "--primary": "#2563eb",
    "--secondary": "#f3f4f6"
  },

  dark: {
    "--bg": "#0f172a",
    "--text": "#ffffff",
    "--primary": "#60a5fa",
    "--secondary": "#1e293b"
  },

  ocean: {
    "--bg": "#ecfeff",
    "--text": "#083344",
    "--primary": "#0891b2",
    "--secondary": "#cffafe"
  }
}