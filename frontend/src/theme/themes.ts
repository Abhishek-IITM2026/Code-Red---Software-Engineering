export type ThemeType = "light" | "dark" | "ocean" | "professional" | "modern" | "classic"

export const themes = {
  light: {
    "--bg": "#ffffff",
    "--text": "#1f2937",
    "--text-secondary": "#6b7280",
    "--primary": "#2563eb",
    "--primary-hover": "#1d4ed8",
    "--secondary": "#f3f4f6",
    "--secondary-hover": "#e5e7eb",
    "--accent": "#8b5cf6",
    "--success": "#10b981",
    "--warning": "#f59e0b",
    "--error": "#ef4444",
    "--border": "#e5e7eb",
    "--card-bg": "#ffffff",
    "--sidebar-bg": "#f9fafb",
    "--header-bg": "#ffffff",
    "--input-bg": "#ffffff",
    "--shadow": "rgba(0, 0, 0, 0.1)",
    // UI Customization Variables
    "--card-radius": "12px",
    "--button-radius": "8px",
    "--input-radius": "8px",
    "--container-padding": "24px",
    "--border-width": "1px",
    "--card-shadow": "0 1px 3px rgba(0, 0, 0, 0.1)",
    "--hover-shadow": "0 4px 6px rgba(0, 0, 0, 0.1)"
  },

  dark: {
    "--bg": "#0f172a",
    "--text": "#f1f5f9",
    "--text-secondary": "#94a3b8",
    "--primary": "#60a5fa",
    "--primary-hover": "#3b82f6",
    "--secondary": "#1e293b",
    "--secondary-hover": "#334155",
    "--accent": "#a78bfa",
    "--success": "#34d399",
    "--warning": "#fbbf24",
    "--error": "#f87171",
    "--border": "#334155",
    "--card-bg": "#1e293b",
    "--sidebar-bg": "#1e293b",
    "--header-bg": "#1e293b",
    "--input-bg": "#0f172a",
    "--shadow": "rgba(0, 0, 0, 0.3)",
    // UI Customization Variables
    "--card-radius": "12px",
    "--button-radius": "8px",
    "--input-radius": "8px",
    "--container-padding": "24px",
    "--border-width": "1px",
    "--card-shadow": "0 1px 3px rgba(0, 0, 0, 0.3)",
    "--hover-shadow": "0 4px 6px rgba(0, 0, 0, 0.3)"
  },

  ocean: {
    "--bg": "#ecfeff",
    "--text": "#083344",
    "--text-secondary": "#0e7490",
    "--primary": "#0891b2",
    "--primary-hover": "#0e7490",
    "--secondary": "#cffafe",
    "--secondary-hover": "#a5f3fc",
    "--accent": "#06b6d4",
    "--success": "#14b8a6",
    "--warning": "#f59e0b",
    "--error": "#ef4444",
    "--border": "#67e8f9",
    "--card-bg": "#ffffff",
    "--sidebar-bg": "#f0fdfa",
    "--header-bg": "#ffffff",
    "--input-bg": "#ffffff",
    "--shadow": "rgba(8, 145, 178, 0.1)",
    // UI Customization Variables
    "--card-radius": "12px",
    "--button-radius": "8px",
    "--input-radius": "8px",
    "--container-padding": "24px",
    "--border-width": "1px",
    "--card-shadow": "0 1px 3px rgba(8, 145, 178, 0.1)",
    "--hover-shadow": "0 4px 6px rgba(8, 145, 178, 0.15)"
  },

  professional: {
    "--bg": "#f8fafc",
    "--text": "#1e293b",
    "--text-secondary": "#64748b",
    "--primary": "#0f766e",
    "--primary-hover": "#0d9488",
    "--secondary": "#e2e8f0",
    "--secondary-hover": "#cbd5e1",
    "--accent": "#0d9488",
    "--success": "#059669",
    "--warning": "#d97706",
    "--error": "#dc2626",
    "--border": "#cbd5e1",
    "--card-bg": "#ffffff",
    "--sidebar-bg": "#ffffff",
    "--header-bg": "#ffffff",
    "--input-bg": "#ffffff",
    "--shadow": "rgba(15, 118, 110, 0.08)",
    // UI Customization Variables
    "--card-radius": "8px",
    "--button-radius": "6px",
    "--input-radius": "6px",
    "--container-padding": "20px",
    "--border-width": "1px",
    "--card-shadow": "0 1px 2px rgba(0, 0, 0, 0.05)",
    "--hover-shadow": "0 2px 4px rgba(0, 0, 0, 0.1)"
  },

  modern: {
    "--bg": "#faf5ff",
    "--text": "#3b0764",
    "--text-secondary": "#7e22ce",
    "--primary": "#9333ea",
    "--primary-hover": "#7e22ce",
    "--secondary": "#f3e8ff",
    "--secondary-hover": "#e9d5ff",
    "--accent": "#c084fc",
    "--success": "#22c55e",
    "--warning": "#eab308",
    "--error": "#ef4444",
    "--border": "#d8b4fe",
    "--card-bg": "#ffffff",
    "--sidebar-bg": "#fdf4ff",
    "--header-bg": "#ffffff",
    "--input-bg": "#ffffff",
    "--shadow": "rgba(147, 51, 234, 0.1)",
    // UI Customization Variables
    "--card-radius": "16px",
    "--button-radius": "12px",
    "--input-radius": "12px",
    "--container-padding": "24px",
    "--border-width": "1px",
    "--card-shadow": "0 4px 6px rgba(147, 51, 234, 0.1)",
    "--hover-shadow": "0 8px 12px rgba(147, 51, 234, 0.15)"
  },

  classic: {
    "--bg": "#fffbf0",
    "--text": "#292524",
    "--text-secondary": "#78716c",
    "--primary": "#b45309",
    "--primary-hover": "#92400e",
    "--secondary": "#fef3c7",
    "--secondary-hover": "#fde68a",
    "--accent": "#d97706",
    "--success": "#65a30d",
    "--warning": "#ca8a04",
    "--error": "#dc2626",
    "--border": "#d6d3d1",
    "--card-bg": "#ffffff",
    "--sidebar-bg": "#fffbeb",
    "--header-bg": "#ffffff",
    "--input-bg": "#ffffff",
    "--shadow": "rgba(180, 83, 9, 0.1)",
    // UI Customization Variables
    "--card-radius": "4px",
    "--button-radius": "4px",
    "--input-radius": "4px",
    "--container-padding": "16px",
    "--border-width": "1px",
    "--card-shadow": "0 1px 2px rgba(0, 0, 0, 0.05)",
    "--hover-shadow": "0 2px 4px rgba(0, 0, 0, 0.1)"
  }
}

export const themeLabels: Record<ThemeType, string> = {
  light: "Light",
  dark: "Dark",
  ocean: "Ocean",
  professional: "Professional",
  modern: "Modern",
  classic: "Classic"
}

export const fontSizeOptions = [
  { value: 14, label: "Small (14px)" },
  { value: 16, label: "Medium (16px)" },
  { value: 18, label: "Large (18px)" },
  { value: 20, label: "Extra Large (20px)" }
]

export const borderRadiusOptions = [
  { value: "0px", label: "None (0px)" },
  { value: "4px", label: "Small (4px)" },
  { value: "8px", label: "Medium (8px)" },
  { value: "12px", label: "Large (12px)" },
  { value: "16px", label: "Extra Large (16px)" },
  { value: "24px", label: "Round (24px)" },
  { value: "9999px", label: "Pill (9999px)" }
]

export const containerPaddingOptions = [
  { value: "12px", label: "Compact (12px)" },
  { value: "16px", label: "Small (16px)" },
  { value: "20px", label: "Medium (20px)" },
  { value: "24px", label: "Large (24px)" },
  { value: "32px", label: "Extra Large (32px)" }
]

export const shadowIntensityOptions = [
  { value: "none", label: "None" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" }
]

export const cardBgOptions = [
  { value: "default", label: "Default (Theme)", color: "" },
  { value: "#ffffff", label: "White", color: "#ffffff" },
  { value: "#f9fafb", label: "Gray 50", color: "#f9fafb" },
  { value: "#f3f4f6", label: "Gray 100", color: "#f3f4f6" },
  { value: "#f0f9ff", label: "Sky 50", color: "#f0f9ff" },
  { value: "#f0fdf4", label: "Green 50", color: "#f0fdf4" },
  { value: "#fef3c7", label: "Amber 100", color: "#fef3c7" },
  { value: "#fdf2f8", label: "Pink 50", color: "#fdf2f8" },
  { value: "#f5f3ff", label: "Violet 50", color: "#f5f3ff" },
  { value: "#fff7ed", label: "Orange 50", color: "#fff7ed" },
  { value: "#ecfeff", label: "Cyan 50", color: "#ecfeff" },
  { value: "#fefce8", label: "Yellow 50", color: "#fefce8" },
  { value: "#1e293b", label: "Dark Slate", color: "#1e293b" },
  { value: "#0f172a", label: "Dark Navy", color: "#0f172a" },
]

export const cardBgColorPresets = {
  default: "",
  light: {
    "--card-bg": "#ffffff"
  },
  warm: {
    "--card-bg": "#fef3c7"
  },
  cool: {
    "--card-bg": "#f0f9ff"
  },
  nature: {
    "--card-bg": "#f0fdf4"
  },
  pastel: {
    "--card-bg": "#fdf2f8"
  },
  dark: {
    "--card-bg": "#1e293b"
  }
}
