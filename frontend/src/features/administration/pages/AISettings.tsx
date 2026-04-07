import { useEffect, useState } from "react";
import { FiCpu, FiKey, FiRefreshCw, FiShield, FiSliders } from "react-icons/fi";
import {
  useGetAISettingsQuery,
  useUpdateAISettingsMutation,
  type AISettingsWritePayload,
} from "../api/adminApi";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const defaultForm: AISettingsWritePayload = {
  provider: "grounded-rag",
  model: "grounded-rag-v1",
  baseUrl: "",
  apiKey: "",
  clearApiKey: false,
  temperature: 0.2,
  maxTokens: 1200,
  generationRateLimit: "15 per minute",
  modificationRateLimit: "15 per minute",
  fallbackToGroundedRag: true,
  notes: "",
};

const providerLabels: Record<AISettingsWritePayload["provider"], string> = {
  "grounded-rag": "Grounded RAG",
  "openai-compatible-cloud": "OpenAI-Compatible Cloud",
  "openai-compatible-local": "OpenAI-Compatible Local",
};

const AISettings = function () {
  const { data, isLoading, isFetching } = useGetAISettingsQuery();
  const [updateAISettings, { isLoading: isSaving }] = useUpdateAISettingsMutation();
  const [form, setForm] = useState<AISettingsWritePayload>(defaultForm);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!data) {
      return;
    }
    setForm({
      provider: data.provider,
      model: data.model,
      baseUrl: data.baseUrl || "",
      apiKey: "",
      clearApiKey: false,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      generationRateLimit: data.generationRateLimit,
      modificationRateLimit: data.modificationRateLimit,
      fallbackToGroundedRag: data.fallbackToGroundedRag,
      notes: data.notes || "",
    });
  }, [data]);

  const handleSave = async () => {
    setStatusMessage("");
    try {
      await updateAISettings({
        ...form,
        baseUrl: form.baseUrl?.trim() || null,
        apiKey: form.apiKey?.trim() || null,
        notes: form.notes?.trim() || null,
      }).unwrap();
      setStatusMessage("AI settings saved. The updated provider, model, and rate controls are now active.");
      setForm((current) => ({ ...current, apiKey: "", clearApiKey: false }));
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
              Control the active question-generation provider, model, API credentials, and request throttles used by the faculty assessment flow.
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
              {providerLabels[data?.provider || form.provider]}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Generation Rate Limit</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {data?.generationRateLimit || form.generationRateLimit}
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
                Choose grounded local generation or connect an OpenAI-compatible cloud/local endpoint.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Provider</label>
              <select
                value={form.provider}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    provider: event.target.value as AISettingsWritePayload["provider"],
                  }))
                }
                className={fieldClass}
              >
                <option value="grounded-rag">Grounded RAG</option>
                <option value="openai-compatible-cloud">OpenAI-Compatible Cloud</option>
                <option value="openai-compatible-local">OpenAI-Compatible Local</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Model</label>
              <input
                value={form.model}
                onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
                className={fieldClass}
                placeholder="Example: gpt-4.1-mini or qwen2.5:14b"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Base URL</label>
              <input
                value={form.baseUrl || ""}
                onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))}
                className={fieldClass}
                placeholder="Example: http://localhost:11434/v1 or https://api.openai.com/v1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">API Key</label>
              <input
                type="password"
                value={form.apiKey || ""}
                onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value, clearApiKey: false }))}
                className={fieldClass}
                placeholder={data?.hasApiKey ? `Stored key: ${data.apiKeyPreview}` : "Paste a new provider key"}
              />
            </div>

            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.clearApiKey || false}
                onChange={(event) =>
                  setForm((current) => ({
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
                  value={form.temperature}
                  onChange={(event) =>
                    setForm((current) => ({
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
                  value={form.maxTokens}
                  onChange={(event) =>
                    setForm((current) => ({
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

            <div className="mt-6 grid gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Generate Questions Limit</label>
                <input
                  value={form.generationRateLimit}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, generationRateLimit: event.target.value }))
                  }
                  className={fieldClass}
                  placeholder="Example: 15 per minute"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Modify Questions Limit</label>
                <input
                  value={form.modificationRateLimit}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, modificationRateLimit: event.target.value }))
                  }
                  className={fieldClass}
                  placeholder="Example: 15 per minute"
                />
              </div>
              <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.fallbackToGroundedRag}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fallbackToGroundedRag: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                Fall back to grounded RAG if the external provider is unavailable
              </label>
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
                value={form.notes || ""}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
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

export default AISettings;
