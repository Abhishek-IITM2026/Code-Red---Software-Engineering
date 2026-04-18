import { useMemo, useState } from "react";
import { FiCpu, FiKey, FiRefreshCw, FiShield, FiSliders, FiAlertCircle } from "react-icons/fi";
import {
  useGetAISettingsQuery,
  useUpdateAISettingsMutation,
  type AISettings as AIRuntimeSettings,
  type AISettingsWritePayload,
} from "../api/adminApi";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

// Rate limit parsing and formatting utilities
const parseRateLimit = (rateLimitStr: string): { requests: number; timeWindow: string } => {
  const match = rateLimitStr.match(/(\d+)\s+per\s+(second|minute|hour|day)/i);
  if (match) {
    return { requests: parseInt(match[1], 10), timeWindow: match[2].toLowerCase() };
  }
  return { requests: 15, timeWindow: "minute" };
};

const formatRateLimit = (requests: number, timeWindow: string): string => {
  return `${Math.max(1, Math.round(requests))} per ${timeWindow}`;
};

// Preset configurations for different LLM usage patterns
const RATE_LIMIT_PRESETS = [
  { label: "Light (5/min)", requests: 5, timeWindow: "minute", description: "Conservative usage" },
  { label: "Standard (15/min)", requests: 15, timeWindow: "minute", description: "Recommended" },
  { label: "Production (30/min)", requests: 30, timeWindow: "minute", description: "High throughput" },
  { label: "Hourly (100/hr)", requests: 100, timeWindow: "hour", description: "Batch operations" },
];

const defaultForm: AISettingsWritePayload = {
  provider: "ollama",
  mode: "local",
  model: "llama3.2",
  baseUrl: "http://localhost:11434",
  apiKey: "",
  clearApiKey: false,
  temperature: 0.2,
  maxTokens: 1200,
  generationRateLimit: "15 per minute",
  modificationRateLimit: "15 per minute",
  fallbackToGroundedRag: true,
  notes: "",
  assessmentSystemPrompt: "You are a careful academic assessment generator. Use only the provided context and return machine-readable JSON.",
  assessmentModifySystemPrompt: "You are a careful academic assessment editor. Return only strict JSON matching the requested schema.",
  studentChatSystemPrompt: "You are a careful academic tutor. Return concise JSON that matches the required schema, and make the answer field polished Markdown.",
  assessmentUserPromptTemplate: "Generate assessment questions for {subject} at {difficulty} level with {questionCount} questions totaling {totalMarks} marks.",
};

const providerLabels: Record<AISettingsWritePayload["provider"], string> = {
  ollama: "Ollama",
  gemini: "Google Gemini",
  "grounded-rag": "Grounded RAG",
  "openai-compatible-cloud": "OpenAI-Compatible Cloud",
  "openai-compatible-local": "OpenAI-Compatible Local",
};

const buildFormFromSettings = (settings?: AIRuntimeSettings): AISettingsWritePayload => {
  if (!settings) return defaultForm;
  return {
    provider: settings.provider,
    mode: settings.mode,
    model: settings.model,
    baseUrl: settings.baseUrl || "",
    apiKey: "",
    clearApiKey: false,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    generationRateLimit: settings.generationRateLimit,
    modificationRateLimit: settings.modificationRateLimit,
    fallbackToGroundedRag: settings.fallbackToGroundedRag,
    notes: settings.notes || "",
    assessmentSystemPrompt: settings.assessmentSystemPrompt || defaultForm.assessmentSystemPrompt,
    assessmentModifySystemPrompt: settings.assessmentModifySystemPrompt || defaultForm.assessmentModifySystemPrompt,
    studentChatSystemPrompt: settings.studentChatSystemPrompt || defaultForm.studentChatSystemPrompt,
    assessmentUserPromptTemplate: settings.assessmentUserPromptTemplate || defaultForm.assessmentUserPromptTemplate,
  };
};

// Component for professional rate limit configuration
const RateLimitControl = ({
  label,
  value,
  onChangeRequests,
  onChangeTimeWindow,
  onApplyPreset,
  description,
}: {
  label: string;
  value: string;
  onChangeRequests: (requests: number) => void;
  onChangeTimeWindow: (timeWindow: string) => void;
  onApplyPreset: (requests: number, timeWindow: string) => void;
  description: string;
}) => {
  const { requests, timeWindow } = parseRateLimit(value);
  const timeWindows = ["second", "minute", "hour", "day"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-600">{description}</p>
        </div>
        <div className="rounded-lg bg-white px-2 py-1 font-mono text-sm font-semibold text-[var(--primary)]">
          {formatRateLimit(requests, timeWindow)}
        </div>
      </div>

      {/* Request count and time window inputs */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700">Requests</label>
          <input
            type="number"
            min="1"
            max="500"
            value={requests}
            onChange={(e) => onChangeRequests(parseInt(e.target.value, 10) || 1)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Time Window</label>
          <select
            value={timeWindow}
            onChange={(e) => onChangeTimeWindow(e.target.value)}
            className={fieldClass}
          >
            {timeWindows.map((tw) => (
              <option key={tw} value={tw}>
                per {tw}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset buttons */}
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-600">Quick Presets</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {RATE_LIMIT_PRESETS.map((preset) => (
            <button
              key={`${preset.requests}-${preset.timeWindow}`}
              onClick={() => onApplyPreset(preset.requests, preset.timeWindow)}
              className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                requests === preset.requests && timeWindow === preset.timeWindow
                  ? "bg-[var(--primary)] text-white shadow-md"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AISettingsPage = function () {
  const { data, isLoading, isFetching } = useGetAISettingsQuery();
  const [updateAISettings, { isLoading: isSaving }] = useUpdateAISettingsMutation();
  const [form, setForm] = useState<AISettingsWritePayload>(defaultForm);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const syncedForm = useMemo(() => buildFormFromSettings(data), [data]);
  const activeForm = isFormDirty ? form : syncedForm;

  const mutateForm = (updater: (current: AISettingsWritePayload) => AISettingsWritePayload) => {
    setForm((current) => updater(isFormDirty ? current : syncedForm));
    setIsFormDirty(true);
  };

  const handleSave = async () => {
    setStatusMessage("");
    try {
      const updated = await updateAISettings({
        ...activeForm,
        baseUrl: activeForm.baseUrl?.trim() || null,
        apiKey: activeForm.apiKey?.trim() || null,
        notes: activeForm.notes?.trim() || null,
      }).unwrap();
      setStatusMessage("AI settings saved. The updated provider, model, and rate controls are now active.");
      setForm(buildFormFromSettings(updated));
      setIsFormDirty(false);
    } catch (error) {
      const fallbackMessage = "Unable to save AI settings right now.";
      if (typeof error === "object" && error && "data" in error) {
        const message = (error as { data?: { error?: { message?: string } } }).data?.error?.message;
        setStatusMessage(message || fallbackMessage);
        return;
      }
      setStatusMessage(fallbackMessage);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Administration
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">AI Settings</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Control the active provider, model, API credentials, and request throttles used by both student chat and faculty assessment generation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <FiRefreshCw className="h-5 w-5 animate-spin" /> : <FiSliders className="h-5 w-5" />}
            Save Settings
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active Provider</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {providerLabels[data?.provider || activeForm.provider]}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Generation Rate Limit</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {data?.generationRateLimit || activeForm.generationRateLimit}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Stored API Key</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {data?.hasApiKey ? data.apiKeyPreview : "Not set"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiCpu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Provider and Runtime</p>
              <p className="text-sm text-slate-500">
                Choose a local runtime or API-key-backed provider for shared RAG answer generation and assessment workflows.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Runtime Mode</label>
              <select
                value={activeForm.mode}
                onChange={(event) =>
                  mutateForm((current) => ({
                    ...current,
                    mode: event.target.value as AISettingsWritePayload["mode"],
                  }))
                }
                className={fieldClass}
              >
                <option value="local">Local Runtime</option>
                <option value="api-key">API Key Runtime</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Provider</label>
              <select
                value={activeForm.provider}
                onChange={(event) =>
                  mutateForm((current) => ({
                    ...current,
                    provider: event.target.value as AISettingsWritePayload["provider"],
                  }))
                }
                className={fieldClass}
              >
                <option value="ollama">Ollama</option>
                <option value="gemini">Google Gemini</option>
                <option value="grounded-rag">Grounded RAG</option>
                <option value="openai-compatible-cloud">OpenAI-Compatible Cloud</option>
                <option value="openai-compatible-local">OpenAI-Compatible Local</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Model</label>
              <input
                value={activeForm.model}
                onChange={(event) => mutateForm((current) => ({ ...current, model: event.target.value }))}
                className={fieldClass}
                placeholder="Example: llama3.2, gemini-1.5-flash, or gpt-4.1-mini"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Base URL</label>
              <input
                value={activeForm.baseUrl || ""}
                onChange={(event) => mutateForm((current) => ({ ...current, baseUrl: event.target.value }))}
                className={fieldClass}
                placeholder="Example: http://localhost:11434 or https://generativelanguage.googleapis.com/v1beta"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">API Key</label>
              <input
                type="password"
                value={activeForm.apiKey || ""}
                onChange={(event) => mutateForm((current) => ({ ...current, apiKey: event.target.value, clearApiKey: false }))}
                className={fieldClass}
                placeholder={data?.hasApiKey ? `Stored key: ${data.apiKeyPreview}` : "Paste a new provider key"}
              />
            </div>

            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={activeForm.clearApiKey || false}
                onChange={(event) =>
                  mutateForm((current) => ({
                    ...current,
                    clearApiKey: event.target.checked,
                    apiKey: event.target.checked ? "" : current.apiKey,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              Remove the stored API key on save
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={activeForm.temperature}
                  onChange={(event) =>
                    mutateForm((current) => ({
                      ...current,
                      temperature: Number(event.target.value) || 0,
                    }))
                  }
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Max Tokens</label>
                <input
                  type="number"
                  min="256"
                  max="8192"
                  step="1"
                  value={activeForm.maxTokens}
                  onChange={(event) =>
                    mutateForm((current) => ({
                      ...current,
                      maxTokens: Number(event.target.value) || 256,
                    }))
                  }
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiShield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Rate Control</p>
                <p className="text-sm text-slate-500">
                  These values apply directly to the assessment AI endpoints.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <RateLimitControl
                label="Assessment Generation Limit"
                value={activeForm.generationRateLimit}
                onChangeRequests={(requests) => {
                  const { timeWindow } = parseRateLimit(activeForm.generationRateLimit);
                  mutateForm((current) => ({
                    ...current,
                    generationRateLimit: formatRateLimit(requests, timeWindow),
                  }));
                }}
                onChangeTimeWindow={(timeWindow) => {
                  const { requests } = parseRateLimit(activeForm.generationRateLimit);
                  mutateForm((current) => ({
                    ...current,
                    generationRateLimit: formatRateLimit(requests, timeWindow),
                  }));
                }}
                onApplyPreset={(requests, timeWindow) => {
                  mutateForm((current) => ({
                    ...current,
                    generationRateLimit: formatRateLimit(requests, timeWindow),
                  }));
                }}
                description="Controls the frequency at which faculty can request new assessment questions"
              />

              <RateLimitControl
                label="Assessment Modification Limit"
                value={activeForm.modificationRateLimit}
                onChangeRequests={(requests) => {
                  const { timeWindow } = parseRateLimit(activeForm.modificationRateLimit);
                  mutateForm((current) => ({
                    ...current,
                    modificationRateLimit: formatRateLimit(requests, timeWindow),
                  }));
                }}
                onChangeTimeWindow={(timeWindow) => {
                  const { requests } = parseRateLimit(activeForm.modificationRateLimit);
                  mutateForm((current) => ({
                    ...current,
                    modificationRateLimit: formatRateLimit(requests, timeWindow),
                  }));
                }}
                onApplyPreset={(requests, timeWindow) => {
                  mutateForm((current) => ({
                    ...current,
                    modificationRateLimit: formatRateLimit(requests, timeWindow),
                  }));
                }}
                description="Controls the frequency at which faculty can modify/refine assessment questions"
              />

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                <FiAlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Rate Limiting Guidelines</p>
                  <ul className="mt-1 space-y-1 text-xs text-amber-800">
                    <li>• <strong>Local LLM (Ollama):</strong> Can handle higher limits (20-50/min)</li>
                    <li>• <strong>Cloud API (Gemini/OpenAI):</strong> Check your API plan and adjust accordingly</li>
                    <li>• <strong>Production:</strong> Start conservative and increase based on actual usage</li>
                  </ul>
                </div>
              </div>

              <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={activeForm.fallbackToGroundedRag}
                  onChange={(event) =>
                    mutateForm((current) => ({ ...current, fallbackToGroundedRag: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                Fall back to grounded RAG if the external provider is unavailable
              </label>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                <FiSliders className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">System Prompts</p>
                <p className="text-sm text-slate-500">
                  Configure LLM behavior for assessment generation and student chat responses.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Assessment Generation System Prompt</label>
                <textarea
                  value={activeForm.assessmentSystemPrompt || ""}
                  onChange={(event) =>
                    mutateForm((current) => ({ ...current, assessmentSystemPrompt: event.target.value }))
                  }
                  className={`${fieldClass} min-h-24 resize-y`}
                  placeholder="Instructions for the LLM when generating assessment questions..."
                />
                <p className="mt-1 text-xs text-slate-500">Used when faculty generate new assessment questions</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Assessment Modification System Prompt</label>
                <textarea
                  value={activeForm.assessmentModifySystemPrompt || ""}
                  onChange={(event) =>
                    mutateForm((current) => ({ ...current, assessmentModifySystemPrompt: event.target.value }))
                  }
                  className={`${fieldClass} min-h-24 resize-y`}
                  placeholder="Instructions for the LLM when modifying assessment questions..."
                />
                <p className="mt-1 text-xs text-slate-500">Used when faculty modify generated assessment questions</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Student Chat System Prompt</label>
                <textarea
                  value={activeForm.studentChatSystemPrompt || ""}
                  onChange={(event) =>
                    mutateForm((current) => ({ ...current, studentChatSystemPrompt: event.target.value }))
                  }
                  className={`${fieldClass} min-h-24 resize-y`}
                  placeholder="Instructions for the LLM when answering student subject questions..."
                />
                <p className="mt-1 text-xs text-slate-500">Used when students ask questions in subject chat</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Assessment User Prompt Template</label>
                <textarea
                  value={activeForm.assessmentUserPromptTemplate || ""}
                  onChange={(event) =>
                    mutateForm((current) => ({ ...current, assessmentUserPromptTemplate: event.target.value }))
                  }
                  className={`${fieldClass} min-h-24 resize-y`}
                  placeholder="Template for faculty custom prompts: {subject}, {difficulty}, {questionCount}, {totalMarks}"
                />
                <p className="mt-1 text-xs text-slate-500">Template available to faculty when setting custom generation prompts. Use placeholders like {'{subject}'}, {'{difficulty}'}, etc.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <FiKey className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Operator Notes</p>
                <p className="text-sm text-slate-500">
                  Capture any environment-specific setup for local or cloud model usage.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <textarea
                value={activeForm.notes || ""}
                onChange={(event) => mutateForm((current) => ({ ...current, notes: event.target.value }))}
                className={`${fieldClass} min-h-36 resize-y`}
                placeholder="Example: Local OpenAI-compatible gateway is available only on the campus VPN."
              />
            </div>
          </div>
        </div>
      </section>

      {statusMessage ? (
        <div className="rounded-2xl bg-white px-5 py-4 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
};

export default AISettingsPage;
