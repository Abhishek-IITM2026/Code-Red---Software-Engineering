import { useEffect } from "react"
import { useSelector } from "react-redux"
import { themes} from "./themes"
import type { ThemeType } from "./themes"

export default function ThemeProvider({ children }: any) {

  const theme = useSelector((state: any) => state.theme.theme)
  const fontSize = useSelector((state: any) => state.theme.fontSize)

  useEffect(() => {
    const root = document.documentElement
    const selectedTheme = themes[theme as ThemeType]

    Object.entries(selectedTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

  }, [theme])

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return <>{children}</>
}