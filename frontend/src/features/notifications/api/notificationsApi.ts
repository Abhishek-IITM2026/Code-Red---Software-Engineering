import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';

// Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'event' | 'assignment' | 'attendance' | 'marks';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationPreference {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  preferences: {
    attendanceUpdates: boolean;
    assignmentDue: boolean;
    marksReleased: boolean;
    eventAnnouncements: boolean;
    systemUpdates: boolean;
    scheduleChanges: boolean;
    leaveApprovals: boolean;
    payrollUpdates: boolean;
  };
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  template: string;
  variables: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface BulkNotification {
  id: string;
  title: string;
  message: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface NotificationLog {
  id: string;
  notificationId: string;
  userId: string;
  deliveryMethod: 'email' | 'sms' | 'push' | 'in-app';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  failureReason?: string;
  sentAt?: string;
  deliveredAt?: string;
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
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
  tagTypes: [
    'Notifications',
    'Preferences',
    'Templates',
    'BulkNotifications',
    'Logs',
  ],
  endpoints: (builder) => ({
    // User Notifications
    listNotifications: builder.query<
      Notification[],
      { unreadOnly?: boolean; limit?: number; offset?: number }
    >({
      query: ({ unreadOnly = false, limit = 50, offset = 0 }) =>
        `/notifications?unreadOnly=${unreadOnly}&limit=${limit}&offset=${offset}`,
      providesTags: ['Notifications'],
    }),

    getNotification: builder.query<Notification, string>({
      query: (id) => `/notifications/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Notifications', id }],
    }),

    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notifications'],
    }),

    markAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/mark-read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),

    markAllAsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),

    deleteNotification: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),

    deleteAllNotifications: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/notifications',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // Notification Preferences
    getPreferences: builder.query<NotificationPreference, void>({
      query: () => '/notifications/preferences',
      providesTags: ['Preferences'],
    }),

    updatePreferences: builder.mutation<
      NotificationPreference,
      Partial<NotificationPreference>
    >({
      query: (data) => ({
        url: '/notifications/preferences',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Preferences'],
    }),

    // Notification Templates (Admin only)
    listTemplates: builder.query<NotificationTemplate[], void>({
      query: () => '/notifications/templates',
      providesTags: ['Templates'],
    }),

    getTemplate: builder.query<NotificationTemplate, string>({
      query: (id) => `/notifications/templates/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Templates', id }],
    }),

    createTemplate: builder.mutation<
      NotificationTemplate,
      Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => ({
        url: '/notifications/templates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Templates'],
    }),

    updateTemplate: builder.mutation<NotificationTemplate, NotificationTemplate>({
      query: ({ id, ...data }) => ({
        url: `/notifications/templates/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Templates', id }],
    }),

    deleteTemplate: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/notifications/templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Templates'],
    }),

    // Bulk Notifications (Admin only)
    listBulkNotifications: builder.query<BulkNotification[], void>({
      query: () => '/notifications/bulk',
      providesTags: ['BulkNotifications'],
    }),

    getBulkNotification: builder.query<BulkNotification, string>({
      query: (id) => `/notifications/bulk/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'BulkNotifications', id }],
    }),

    sendBulkNotification: builder.mutation<
      BulkNotification,
      {
        title: string;
        message: string;
        recipientIds: string[];
        type: string;
        priority?: 'low' | 'medium' | 'high';
        deliveryMethods?: ('email' | 'sms' | 'push' | 'in-app')[];
      }
    >({
      query: (data) => ({
        url: '/notifications/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BulkNotifications'],
    }),

    retryBulkNotification: builder.mutation<BulkNotification, string>({
      query: (id) => ({
        url: `/notifications/bulk/${id}/retry`,
        method: 'POST',
      }),
      invalidatesTags: ['BulkNotifications'],
    }),

    // Scheduled Notifications (Admin only)
    scheduleNotification: builder.mutation<
      { success: boolean; scheduledId: string },
      {
        title: string;
        message: string;
        recipientIds: string[];
        scheduledAt: string;
        type: string;
        priority?: string;
      }
    >({
      query: (data) => ({
        url: '/notifications/schedule',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notifications'],
    }),

    // Send Custom Notification Event (e.g., attendance alert, assignment due)
    sendEventNotification: builder.mutation<
      { success: boolean },
      {
        eventType: string;
        userIds: string[];
        title: string;
        message: string;
        metadata?: Record<string, any>;
        priority?: 'low' | 'medium' | 'high';
      }
    >({
      query: (data) => ({
        url: '/notifications/event',
        method: 'POST',
        body: data,
      }),
    }),

    // Notification Logs (Admin only)
    getNotificationLogs: builder.query<
      NotificationLog[],
      {
        notificationId?: string;
        userId?: string;
        status?: string;
        limit?: number;
      }
    >({
      query: ({ notificationId, userId, status, limit = 50 }) => {
        const params = [];
        if (notificationId) params.push(`notificationId=${notificationId}`);
        if (userId) params.push(`userId=${userId}`);
        if (status) params.push(`status=${status}`);
        params.push(`limit=${limit}`);
        return `/notifications/logs?${params.join('&')}`;
      },
      providesTags: ['Logs'],
    }),

    // WebSocket subscription for real-time notifications
    subscribeToNotifications: builder.query<Notification, void>({
      query: () => '/notifications/stream',
      providesTags: ['Notifications'],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useGetNotificationQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useListTemplatesQuery,
  useGetTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useListBulkNotificationsQuery,
  useGetBulkNotificationQuery,
  useSendBulkNotificationMutation,
  useRetryBulkNotificationMutation,
  useScheduleNotificationMutation,
  useSendEventNotificationMutation,
  useGetNotificationLogsQuery,
  useSubscribeToNotificationsQuery,
} = notificationsApi;
