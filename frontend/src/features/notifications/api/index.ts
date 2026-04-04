// Notifications API
export { notificationsApi } from './notificationsApi';
export type {
  Notification,
  NotificationPreference,
  NotificationTemplate,
  BulkNotification,
  NotificationLog,
} from './notificationsApi';
export {
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
} from './notificationsApi';
