import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  theme: localStorage.getItem("theme") || "light",
  fontSize: Number(localStorage.getItem("fontSize")) || 16
}

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload
      localStorage.setItem("theme", action.payload)
    },

    setFontSize(state, action) {
      state.fontSize = action.payload
      localStorage.setItem("fontSize", action.payload)
    }
  }
})

export const { setTheme, setFontSize } = themeSlice.actions
export default themeSlice.reducer