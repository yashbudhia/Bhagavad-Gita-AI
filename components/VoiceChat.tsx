import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

interface Message {
  sent: boolean;
  message: string;
}

const LANGUAGES = [
  { code: "hi-IN", name: "हिंदी", flag: "🇮🇳" },
  { code: "en-IN", name: "English", flag: "🇬🇧" },
  { code: "kn-IN", name: "ಕನ್ನಡ", flag: "🇮🇳" },
];

export default function VoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("hi-IN");
  const { token } = useAuth();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        processAudio();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const base64Audio = await blobToBase64(audioBlob);

      // 1. Speech to Text
      const sttRes = await fetch("/api/voice/speech-to-text", {
        method: "POST",
        headers: { "Content-Type": "application/json", token: token! },
        body: JSON.stringify({ audio: base64Audio, language }),
      });
      
      if (!sttRes.ok) throw new Error("Speech recognition failed");
      const { transcript } = await sttRes.json();
      
      if (!transcript) throw new Error("Could not understand audio");

      setMessages((prev) => [...prev, { sent: true, message: transcript }]);

      // 2. Get AI Response (Cerebras)
      const chatRes = await fetch("/api/voice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", token: token! },
        body: JSON.stringify({ message: transcript, chatHistory: messages, language }),
      });
      
      if (!chatRes.ok) throw new Error("AI response failed");
      const { reply } = await chatRes.json();

      setMessages((prev) => [...prev, { sent: false, message: reply }]);

      // 3. Text to Speech
      const ttsRes = await fetch("/api/voice/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", token: token! },
        body: JSON.stringify({ text: reply, language }),
      });
      
      if (!ttsRes.ok) throw new Error("Speech synthesis failed");
      const { audio } = await ttsRes.json();

      // Play audio
      playAudio(audio);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const playAudio = (base64Audio: string) => {
    setIsSpeaking(true);
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audioRef.current = audio;
    audio.onended = () => setIsSpeaking(false);
    audio.play();
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  };

  const selectedLang = LANGUAGES.find((l) => l.code === language);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {error && (
        <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Voice Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || isSpeaking}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? "bg-red-500 animate-pulse"
            : isProcessing
            ? "bg-gray-400"
            : "bg-orange-500 hover:bg-orange-600"
        } disabled:opacity-50`}
      >
        {isProcessing ? (
          <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>

      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">
          {isRecording ? "Listening... Tap to stop" : isProcessing ? "Processing..." : isSpeaking ? "Speaking..." : "Tap to speak"}
        </p>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isRecording || isProcessing}
          className="text-sm px-2 py-1 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {isSpeaking && (
        <button onClick={stopSpeaking} className="text-sm text-orange-500 hover:underline">
          Stop Speaking
        </button>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="w-full max-w-md mt-4">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setMessages([])}
              className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 hover:bg-red-50 rounded transition-all"
            >
              🗑️ Clear chat
            </button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-lg ${msg.sent ? "bg-orange-100 ml-8" : "bg-gray-100 mr-8"}`}>
                <p className="text-sm">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
