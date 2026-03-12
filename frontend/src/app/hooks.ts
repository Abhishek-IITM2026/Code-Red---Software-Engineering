import {type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// RTK Query hooks - Auth
import { authApi } from '../features/auth/api/authApi'

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
} = authApi

// RTK Query hooks - Data
import { dataApi } from '../services/api/dataApi'

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useGetAttendanceQuery,
  useGetMarksQuery,
} = dataApi
