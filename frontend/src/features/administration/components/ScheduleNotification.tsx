import { useState } from 'react';
import { useSendScheduleNotificationMutation } from '../../../services/api/dataApi';
import type { ClassSchedule } from '../../../services/api/dataApi';

interface ScheduleNotificationProps {
  schedules: ClassSchedule[];
  onClose: () => void;
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
const checkboxClass = "h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]";
const labelClass = "flex items-center gap-2 text-sm text-slate-700 cursor-pointer";
const btnPrimary = "inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50";
const btnSecondary = "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50";

const ScheduleNotification: React.FC<ScheduleNotificationProps> = ({ schedules, onClose }) => {
  const [notificationType, setNotificationType] = useState<'email' | 'sms' | 'both'>('email');
  const [recipients, setRecipients] = useState({
    faculty: true,
    students: true,
    parents: true,
  });
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [sendNotification] = useSendScheduleNotificationMutation();

  // Get unique classes from selected schedules
  const uniqueClasses = [...new Set(schedules.map(s => `${s.className} - ${s.sectionName}`))];

  const handleSend = async () => {
    setIsSending(true);
    setSendStatus('idle');

    try {
      await sendNotification({
        type: notificationType,
        recipients,
        scheduleIds: schedules.map(s => s.id),
        message: customMessage || undefined,
      }).unwrap();

      setSendStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const recipientCount = () => {
    let count = 0;
    if (recipients.faculty) count += schedules.length; // 1 faculty per schedule
    if (recipients.students) count += schedules.length * 5; // Estimate 5 students per class
    if (recipients.parents) count += schedules.length * 5; // Estimate 5 parents per class
    return count;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-800">Send Schedule Notification</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selected Schedules Summary */}
        <div className="mb-4 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-700">
            {schedules.length} schedule(s) selected for:
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {uniqueClasses.join(', ')}
          </p>
        </div>

        {/* Notification Type */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Notification Type
          </label>
          <div className="flex gap-4">
            {(['email', 'sms', 'both'] as const).map((type) => (
              <label key={type} className={labelClass}>
                <input
                  type="radio"
                  name="notificationType"
                  value={type}
                  checked={notificationType === type}
                  onChange={(e) => setNotificationType(e.target.value as typeof notificationType)}
                  className={checkboxClass}
                />
                <span className="capitalize">{type === 'both' ? 'Email & SMS' : type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Recipients */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Recipients
          </label>
          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            <label className={labelClass}>
              <input
                type="checkbox"
                checked={recipients.faculty}
                onChange={(e) => setRecipients({ ...recipients, faculty: e.target.checked })}
                className={checkboxClass}
              />
              <span>Faculty ({schedules.length} teacher(s))</span>
            </label>
            <label className={labelClass}>
              <input
                type="checkbox"
                checked={recipients.students}
                onChange={(e) => setRecipients({ ...recipients, students: e.target.checked })}
                className={checkboxClass}
              />
              <span>Students</span>
            </label>
            <label className={labelClass}>
              <input
                type="checkbox"
                checked={recipients.parents}
                onChange={(e) => setRecipients({ ...recipients, parents: e.target.checked })}
                className={checkboxClass}
              />
              <span>Parents</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Estimated recipients: ~{recipientCount()}
          </p>
        </div>

        {/* Custom Message */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Custom Message (Optional)
          </label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-none`}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a custom message to the notification..."
          />
        </div>

        {/* Status Messages */}
        {sendStatus === 'success' && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Notification sent successfully!
          </div>
        )}
        {sendStatus === 'error' && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Failed to send notification. Please try again.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className={btnSecondary}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || (!recipients.faculty && !recipients.students && !recipients.parents)}
            className={btnPrimary}
          >
            {isSending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ScheduleNotification;
