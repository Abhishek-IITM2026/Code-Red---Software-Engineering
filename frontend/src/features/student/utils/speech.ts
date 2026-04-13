export interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

export interface SpeechRecognitionResultLike {
  [index: number]: SpeechRecognitionAlternativeLike;
  length: number;
}

export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

export interface SpeechRecognitionErrorLike {
  error?: string;
  message?: string;
}

export interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

export interface SpeechSynthesisVoiceLike {
  default?: boolean;
  lang?: string;
  name?: string;
}

export interface SpeechSynthesisLike {
  speaking?: boolean;
  paused?: boolean;
  cancel(): void;
  getVoices?(): SpeechSynthesisVoiceLike[];
  resume?(): void;
  speak(utterance: SpeechSynthesisUtterance): void;
}

export interface SpeechWindowLike {
  SpeechRecognition?: SpeechRecognitionConstructorLike;
  webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  speechSynthesis?: SpeechSynthesisLike;
}

export const getSpeechRecognitionConstructor = (
  scope?: SpeechWindowLike,
): SpeechRecognitionConstructorLike | null => {
  if (!scope) return null;
  return scope.SpeechRecognition || scope.webkitSpeechRecognition || null;
};

export const hasSpeechRecognitionSupport = (scope?: SpeechWindowLike): boolean =>
  Boolean(getSpeechRecognitionConstructor(scope));

export const hasSpeechSynthesisSupport = (scope?: SpeechWindowLike): boolean =>
  Boolean(
    scope?.speechSynthesis &&
      typeof scope.speechSynthesis.cancel === "function" &&
      typeof scope.speechSynthesis.speak === "function",
  );

export const appendTranscript = (current: string, transcript: string): string => {
  const existing = current.trim();
  const next = transcript.trim();
  if (!next) return existing;
  if (!existing) return next;
  return `${existing} ${next}`.replace(/\s+/g, " ").trim();
};

export const getSpeechRecognitionErrorMessage = (error?: SpeechRecognitionErrorLike): string => {
  const code = (error?.error || "").trim().toLowerCase();
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Microphone permission was denied. Allow microphone access and try again.";
  }
  if (code === "no-speech") {
    return "No speech was detected. Try speaking a little closer to the microphone.";
  }
  if (code === "audio-capture") {
    return "No microphone was found. Check your microphone connection and browser permissions.";
  }
  if (code === "network") {
    return "Voice recognition is temporarily unavailable due to a browser speech service error.";
  }
  return error?.message || error?.error || "Voice input is not available right now.";
};

export const getPreferredSpeechVoice = (
  scope?: SpeechWindowLike,
  lang: string = "en-US",
): SpeechSynthesisVoiceLike | null => {
  const voices = scope?.speechSynthesis?.getVoices?.() || [];
  if (voices.length === 0) return null;
  const normalizedLang = lang.toLowerCase();
  return (
    voices.find((voice) => voice.lang?.toLowerCase() === normalizedLang) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("en")) ||
    voices.find((voice) => voice.default) ||
    voices[0] ||
    null
  );
};
