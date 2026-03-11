import { useEffect, type ReactNode } from "react"
import { useSelector } from "react-redux"
import { themes, cardBgColorPresets } from "./themes"
import type { ThemeType } from "./themes"
import type { RootState } from "../app/store"

interface ThemeProviderProps {
  children: ReactNode;
}

// Shadow presets based on intensity
const shadowPresets = {
  none: {
    "--card-shadow": "none",
    "--hover-shadow": "none"
  },
  light: {
    "--card-shadow": "0 1px 3px rgba(0, 0, 0, 0.1)",
    "--hover-shadow": "0 4px 6px rgba(0, 0, 0, 0.1)"
  },
  medium: {
    "--card-shadow": "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
    "--hover-shadow": "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)"
  },
  heavy: {
    "--card-shadow": "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
    "--hover-shadow": "0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)"
  }
}

// Card background presets
const cardBgPresets: Record<string, Record<string, string>> = {
  default: {},
  light: { "--card-bg": "#ffffff" },
  warm: { "--card-bg": "#fef3c7" },
  cool: { "--card-bg": "#f0f9ff" },
  nature: { "--card-bg": "#f0fdf4" },
  pastel: { "--card-bg": "#fdf2f8" },
  dark: { "--card-bg": "#1e293b" }
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSelector((state: RootState) => state.theme.theme)
  const fontSize = useSelector((state: RootState) => state.theme.fontSize)
  
  // UI Customization states
  const cardRadius = useSelector((state: RootState) => state.theme.cardRadius)
  const buttonRadius = useSelector((state: RootState) => state.theme.buttonRadius)
  const inputRadius = useSelector((state: RootState) => state.theme.inputRadius)
  const containerPadding = useSelector((state: RootState) => state.theme.containerPadding)
  const shadowIntensity = useSelector((state: RootState) => state.theme.shadowIntensity)
  const cardBg = useSelector((state: RootState) => state.theme.cardBg)

  useEffect(() => {
    const root = document.documentElement
    const selectedTheme = themes[theme as ThemeType]

    if (selectedTheme) {
      Object.entries(selectedTheme).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  // Apply UI customization CSS variables
  useEffect(() => {
    const root = document.documentElement
    
    root.style.setProperty("--card-radius", cardRadius)
    root.style.setProperty("--button-radius", buttonRadius)
    root.style.setProperty("--input-radius", inputRadius)
    root.style.setProperty("--container-padding", containerPadding)
    
    // Apply shadow presets
    const shadows = shadowPresets[shadowIntensity as keyof typeof shadowPresets]
    if (shadows) {
      Object.entries(shadows).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
    }

    // Apply card background color
    const cardBgColor = cardBgPresets[cardBg as keyof typeof cardBgPresets]
    if (cardBgColor) {
      Object.entries(cardBgColor).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
    }
  }, [cardRadius, buttonRadius, inputRadius, containerPadding, shadowIntensity, cardBg])

  return <>{children}</>
}
