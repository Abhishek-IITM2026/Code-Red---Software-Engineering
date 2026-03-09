import { configureStore } from '@reduxjs/toolkit'
import { authApi } from '../features/auth/api/authApi'
import { dataApi } from '../services/api/dataApi'
import themeReducer from '../theme/themeSlice'
import authReducer from '../features/auth/authSlice'

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [dataApi.reducerPath]: dataApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, dataApi.middleware),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
