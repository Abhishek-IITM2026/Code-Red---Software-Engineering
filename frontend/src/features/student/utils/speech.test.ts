import { describe, expect, it } from "vitest";

import {
  appendTranscript,
  getPreferredSpeechVoice,
  getSpeechRecognitionErrorMessage,
  getSpeechRecognitionConstructor,
  hasSpeechRecognitionSupport,
  hasSpeechSynthesisSupport,
} from "./speech";


describe("speech utils", () => {
  it("detects browser speech recognition support", () => {
    class FakeRecognition {
      continuous = false;
      interimResults = false;
      lang = "en-US";
      onresult = null;
      onerror = null;
      onend = null;
      start() {}
      stop() {}
    }

    const scope = { webkitSpeechRecognition: FakeRecognition };
    expect(getSpeechRecognitionConstructor(scope)).toBe(FakeRecognition);
    expect(hasSpeechRecognitionSupport(scope)).toBe(true);
  });

  it("detects browser speech synthesis support", () => {
    const scope = {
      speechSynthesis: {
        cancel() {},
        speak() {},
      },
    };
    expect(hasSpeechSynthesisSupport(scope)).toBe(true);
    expect(hasSpeechSynthesisSupport({})).toBe(false);
  });

  it("appends transcripts cleanly", () => {
    expect(appendTranscript("", "Hello there")).toBe("Hello there");
    expect(appendTranscript("Hello", "there")).toBe("Hello there");
    expect(appendTranscript("Hello   there", " friend ")).toBe("Hello there friend");
  });

  it("maps recognition errors to user-friendly messages", () => {
    expect(getSpeechRecognitionErrorMessage({ error: "not-allowed" })).toContain("permission");
    expect(getSpeechRecognitionErrorMessage({ error: "no-speech" })).toContain("No speech");
  });

  it("selects a preferred synthesis voice", () => {
    const scope = {
      speechSynthesis: {
        cancel() {},
        speak() {},
        getVoices() {
          return [
            { name: "Fallback", lang: "fr-FR" },
            { name: "English", lang: "en-US", default: true },
          ];
        },
      },
    };

    expect(getPreferredSpeechVoice(scope, "en-US")?.name).toBe("English");
  });
});
