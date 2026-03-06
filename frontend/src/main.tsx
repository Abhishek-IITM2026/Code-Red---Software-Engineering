import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import ThemeProvider from './theme/ThemeProvider.tsx'


// -------------------------------------------------------
// Css styles Import
import './index.css'
// custum css
import "./styles/variables.css";
import "./styles/themes.css";
import "./styles/base.css";
import "./styles/utilities.css";
import "./styles/responsive.css";


// -------------------------------------------------------

import {store} from './app/store.ts'
import { Provider } from 'react-redux'
import router from './app/routes.tsx'

const setTheme = (theme: string) => {
  document.body.classList.remove("light", "dark", "blue");
  document.body.classList.add(theme);
};

// setTheme("blue");


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router}/>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)

