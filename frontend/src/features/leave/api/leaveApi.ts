import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';

// Types - matching backend model
export type LeaveApplicantRole = 'student' | 'faculty';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: LeaveApplicantRole;
  applicantContext: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  contactNumber: string;
  supportingNote?: string;
  status: LeaveStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewerComment?: string;
  reviewedAt?: string;
  submittedAt: string;
}

export interface LeaveRequestInput {
  applicantId: string;
  applicantName: string;
  applicantRole: LeaveApplicantRole;
  applicantContext: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  contactNumber: string;
  supportingNote?: string;
}

export interface LeaveReviewInput {
  status: 'Approved' | 'Rejected';
  reviewerComment?: string;
}

export interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byRole: {
    student: number;
    faculty: number;
  };
}

// API Slice
export const leaveApi = createApi({
  reducerPath: 'leaveApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3500/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['LeaveRequests', 'LeaveStats'],
  endpoints: (builder) => ({
    // Get all leave requests (admin sees all, users see their own)
    getLeaveRequests: builder.query<LeaveRequest[], { status?: string; applicantRole?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.applicantRole) queryParams.append('applicantRole', params.applicantRole);
        const queryString = queryParams.toString();
        return `/leave${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['LeaveRequests'],
    }),

    // Get a specific leave request
    getLeaveRequest: builder.query<LeaveRequest, string>({
      query: (id) => `/leave/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'LeaveRequests', id }],
    }),

    // Create a new leave request (student/faculty)
    createLeaveRequest: builder.mutation<LeaveRequest, LeaveRequestInput>({
      query: (data) => ({
        url: '/leave',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['LeaveRequests', 'LeaveStats'],
    }),

    // Review a leave request (admin only)
    reviewLeaveRequest: builder.mutation<LeaveRequest, { id: string; data: LeaveReviewInput }>({
      query: ({ id, data }) => ({
        url: `/leave/${id}/review`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['LeaveRequests', 'LeaveStats'],
    }),

    // Cancel a leave request (user can only cancel their own)
    cancelLeaveRequest: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/leave/${id}/cancel`,
        method: 'PUT',
      }),
      invalidatesTags: ['LeaveRequests', 'LeaveStats'],
    }),

    // Get leave statistics (admin only)
    getLeaveStats: builder.query<LeaveStats, void>({
      query: () => '/leave/stats',
      providesTags: ['LeaveStats'],
    }),
  }),
});

// Export hooks
export const {
  useGetLeaveRequestsQuery,
  useGetLeaveRequestQuery,
  useCreateLeaveRequestMutation,
  useReviewLeaveRequestMutation,
  useCancelLeaveRequestMutation,
  useGetLeaveStatsQuery,
} = leaveApi;

export default leaveApi;