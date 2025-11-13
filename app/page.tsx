"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function Page() {
  const [text, setText] = useState<string>(
    typeof window !== "undefined" && localStorage.getItem("tts:text")
      ? localStorage.getItem("tts:text") || ""
      : "Paste or type text here and press Speak."
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(
    typeof window !== "undefined" && localStorage.getItem("tts:voice")
      ? (localStorage.getItem("tts:voice") as string)
      : ""
  );
  const [rate, setRate] = useState<number>(
    typeof window !== "undefined" && localStorage.getItem("tts:rate")
      ? Number(localStorage.getItem("tts:rate"))
      : 1
  );
  const [pitch, setPitch] = useState<number>(
    typeof window !== "undefined" && localStorage.getItem("tts:pitch")
      ? Number(localStorage.getItem("tts:pitch"))
      : 1
  );
  const [volume, setVolume] = useState<number>(
    typeof window !== "undefined" && localStorage.getItem("tts:volume")
      ? Number(localStorage.getItem("tts:volume"))
      : 1
  );
  const [status, setStatus] = useState<string>("Idle");
  const [paused, setPaused] = useState<boolean>(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const voiceOptions = useMemo(() => {
    return voices
      .slice()
      .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
  }, [voices]);

  // Load voices (browsers load asynchronously)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;

    const load = () => {
      const list = synth.getVoices();
      setVoices(list);
      if (!selectedVoice && list.length > 0) {
        setSelectedVoice(
          localStorage.getItem("tts:voice") || list.find(v => v.default)?.name || list[0].name
        );
      }
    };

    load();
    synth.onvoiceschanged = load;

    return () => {
      if (synth.onvoiceschanged) synth.onvoiceschanged = null;
    };
  }, []);

  // Persist settings
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("tts:text", text);
  }, [text]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("tts:voice", selectedVoice); }, [selectedVoice]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("tts:rate", String(rate)); }, [rate]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("tts:pitch", String(pitch)); }, [pitch]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("tts:volume", String(volume)); }, [volume]);

  const canUseTTS = typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = () => {
    if (!canUseTTS) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPaused(false);
    setStatus("Stopped");
  };

  const speak = () => {
    if (!canUseTTS || !text.trim()) return;

    // If currently speaking, stop first for a clean start
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }

    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;

    const voice = voiceOptions.find(v => v.name === selectedVoice);
    if (voice) u.voice = voice;

    u.onstart = () => { setStatus("Speaking"); setPaused(false); };
    u.onpause = () => { setStatus("Paused"); setPaused(true); };
    u.onresume = () => { setStatus("Speaking"); setPaused(false); };
    u.onend = () => { setStatus("Finished"); setPaused(false); utteranceRef.current = null; };
    u.onerror = () => { setStatus("Error"); };

    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const pauseOrResume = () => {
    if (!canUseTTS) return;
    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setPaused(true);
      setStatus("Paused");
    } else if (synth.paused) {
      synth.resume();
      setPaused(false);
      setStatus("Speaking");
    }
  };

  return (
    <div className="container">
      <header>
        <h1 className="h1">Text to Speech</h1>
        <div className="subtle">Client-side using the Web Speech API</div>
      </header>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="text">Text</label>
          <textarea
            id="text"
            placeholder="Type something to speak..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="row" style={{ marginBottom: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="voice">Voice</label>
            <select
              id="voice"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              {voiceOptions.length === 0 && <option value="">No voices available</option>}
              {voiceOptions.map((v) => (
                <option key={`${v.name}-${v.lang}`} value={v.name}>
                  {v.name} ({v.lang}){v.default ? " ? default" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="rate">Rate: {rate.toFixed(2)}</label>
            <input
              id="rate"
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>

          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="pitch">Pitch: {pitch.toFixed(2)}</label>
            <input
              id="pitch"
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
            />
          </div>

          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="volume">Volume: {volume.toFixed(2)}</label>
            <input
              id="volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="controls" style={{ marginTop: 8 }}>
          <button className="primary" onClick={speak} disabled={!canUseTTS || !text.trim()}>
            Speak
          </button>
          <button className="secondary" onClick={pauseOrResume} disabled={!canUseTTS}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button className="danger" onClick={stop} disabled={!canUseTTS}>
            Stop
          </button>
        </div>

        <div className="status" style={{ marginTop: 10 }}>
          Status: {canUseTTS ? status : "Not supported in this browser"}
        </div>
      </div>

      <div className="footer">Voices are provided by your browser/OS. Availability varies by device.</div>
    </div>
  );
}
