import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  theme: localStorage.getItem("theme") || "light",
  fontSize: Number(localStorage.getItem("fontSize")) || 16,
  // UI Customization Settings
  cardRadius: localStorage.getItem("cardRadius") || "12px",
  buttonRadius: localStorage.getItem("buttonRadius") || "8px",
  inputRadius: localStorage.getItem("inputRadius") || "8px",
  containerPadding: localStorage.getItem("containerPadding") || "24px",
  shadowIntensity: localStorage.getItem("shadowIntensity") || "light",
  cardBg: localStorage.getItem("cardBg") || "default"
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
    },

    setCardRadius(state, action) {
      state.cardRadius = action.payload
      localStorage.setItem("cardRadius", action.payload)
    },

    setButtonRadius(state, action) {
      state.buttonRadius = action.payload
      localStorage.setItem("buttonRadius", action.payload)
    },

    setInputRadius(state, action) {
      state.inputRadius = action.payload
      localStorage.setItem("inputRadius", action.payload)
    },

    setContainerPadding(state, action) {
      state.containerPadding = action.payload
      localStorage.setItem("containerPadding", action.payload)
    },

    setShadowIntensity(state, action) {
      state.shadowIntensity = action.payload
      localStorage.setItem("shadowIntensity", action.payload)
    },

    setCardBg(state, action) {
      state.cardBg = action.payload
      localStorage.setItem("cardBg", action.payload)
    }
  }
})

export const {
  setTheme,
  setFontSize,
  setCardRadius,
  setButtonRadius,
  setInputRadius,
  setContainerPadding,
  setShadowIntensity,
  setCardBg
} = themeSlice.actions
export default themeSlice.reducer