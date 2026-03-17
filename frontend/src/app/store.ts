import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../features/auth/api/authApi';
import { dataApi } from '../services/api/dataApi';
import { studentApi } from '../features/student/api/studentApi';
import { assessmentApi } from '../features/faculty/api/assessmentApi';
import themeReducer from '../theme/themeSlice';
import authReducer from '../features/auth/store/authSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [dataApi.reducerPath]: dataApi.reducer,
    [studentApi.reducerPath]: studentApi.reducer,
    [assessmentApi.reducerPath]: assessmentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      dataApi.middleware,
      studentApi.middleware,
      assessmentApi.middleware
    ),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
