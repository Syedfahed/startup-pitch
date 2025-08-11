import { useState, useRef, useEffect } from "react";
import { Mic, Upload, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordingModal } from "./RecordingModal";
import { EvaluationModal } from "./EvaluationModal";
import axios from "axios";
import { expAudio, pichdummydata } from "@/lib/data";

interface Pitch {
  filename: string;
  postedTime: string;
  duration: string;
  audio: string; // base64
}

interface PitchState {
  filename?: string;
  postedTime?: string;
  duration: string;
  transcript?: string;
  metrics?: {
    pace: number;
    tone: string;
    fillerWords: { count: number; score: number };
    emotionalWords: { count: number; score: number };
    storytellingWords: { count: number; score: number };
    connectionWords: { count: number; score: number };
    persuasiveWords: { count: number; score: number };
    clarityWords: { count: number; score: number };
    confidenceWords: { count: number; score: number };
    confidence: { count: number; score: number };
  };
}

export function Dashboard() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<PitchState | null>(pichdummydata);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // ✅ Load pitches from localStorage + default file once
  useEffect(() => {
    const recordingForLocal = localStorage.getItem("recordings");
    const recording = recordingForLocal ? JSON.parse(recordingForLocal) : [];
    setPitches([
      {
        filename: "Testing-audio",
        postedTime: "2025-08-06T16:33:19.119Z",
        duration: "60",
        audio: expAudio,
      },
      ...recording,
    ]);
  }, []);

  const handleRecordingComplete = () => {
    const recordingForLocal = localStorage.getItem("recordings");
    const recording = recordingForLocal ? JSON.parse(recordingForLocal) : [];
    setPitches((prev) => [
      prev[0], // Keep Testing-audio
      ...recording,
    ]);
  };

  const handleAudioPlay = (currentIndex: number) => {
    audioRefs.current.forEach((audio, index) => {
      if (audio && index !== currentIndex) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };

  // ✅ Delete and keep default pitch
  const handleDelete = (pitch: Pitch) => {
    try {
      let data = JSON.parse(localStorage.getItem("recordings") || "[]");
      data = data.filter((item: Pitch) => item.filename !== pitch.filename);
      localStorage.setItem("recordings", JSON.stringify(data));
      setPitches((prev) => prev.filter((p) => p.filename !== pitch.filename));
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to delete pitch from storage.");
    }
  };

  // ✅ Analyse with loader
  const handleAnalyse = async (data: Pitch) => {
    setLoading(true);
    setShowEvaluation(true);
    try {
      const response = await axios.post(
        "https://startup-pitch-fefk.onrender.com/api/pitch/upload",
        { audioData: data.audio },
        { headers: { "Content-Type": "application/json" } }
      );
      setSelectedPitch(response.data);
    } catch (error) {
      console.error(error);
      setErrorMsg("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Upload with quota check
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      const newPitch: Pitch = {
        filename: file.name,
        postedTime: new Date().toISOString(),
        duration: "Unknown",
        audio: base64Audio,
      };
      try {
        const recordingForLocal = localStorage.getItem("recordings");
        const recording = recordingForLocal ? JSON.parse(recordingForLocal) : [];
        const updated = [newPitch, ...recording];
        localStorage.setItem("recordings", JSON.stringify(updated));

        setPitches((prev) => [prev[0], ...updated]); // Keep default pitch at top
      } catch (err) {
        if (err instanceof DOMException && err.name === "QuotaExceededError") {
          setErrorMsg("Storage is full. Please delete old pitches.");
        } else {
          setErrorMsg("Failed to save pitch.");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
            {errorMsg}
            <button className="ml-2 text-sm underline" onClick={() => setErrorMsg(null)}>Dismiss</button>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Startup Pitch Evaluator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Perfect your startup pitch with AI-powered analysis. Get insights on delivery, engagement, and persuasion techniques.
          </p>
        </div>

        {/* Record & Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-primary text-primary-foreground hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Record New Pitch</h3>
                  <p className="opacity-90">Capture your pitch with our built-in recorder</p>
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 group-hover:scale-105 transition-transform"
                  onClick={() => setIsRecording(true)}
                >
                  <Mic className="w-6 h-6 mr-2" /> Record
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Upload Audio</h3>
                  <p className="text-muted-foreground">Upload existing pitch recordings</p>
                </div>
                <label className="group-hover:scale-105 transition-transform border-2 cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border-muted-foreground text-muted-foreground">
                  <Upload className="w-6 h-6" /> Upload
                  <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Pitches */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Your Pitches</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pitches.length === 0 ? (
              <div className="text-center py-12">
                <FileAudio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">No pitches yet</h3>
                <p className="text-muted-foreground">Record or upload your first pitch to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pitches.map((pitch, i) => (
                  <div key={i} className="flex flex-col gap-2 p-4 bg-surface rounded-xl border border-border hover:shadow-md transition-all duration-200">
                    <div className="flex flex-wrap gap-4 justify-between">
                      <h2 className="text-lg font-semibold">{pitch.filename}</h2>
                      <div className="flex gap-2">
                        <button
                          className={`${isLoading ? "bg-gray-400 text-gray-600 cursor-not-allowed" : "bg-green-500 text-white"} p-2 rounded-md`}
                          onClick={() => handleAnalyse(pitch)}
                          disabled={isLoading}
                        >
                          {isLoading && selectedPitch?.filename === pitch.filename ? "Analysing..." : "Evaluate"}
                        </button>
                        {pitch.filename !== "Testing-audio" && (
                          <button className="bg-red-600 text-white p-2 rounded-md" onClick={() => handleDelete(pitch)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Duration: {pitch.duration} | Posted: {new Date(pitch.postedTime).toLocaleString()}
                    </div>
                    <audio
                      controls
                      className="w-full"
                      ref={(el) => (audioRefs.current[i] = el)}
                      onPlay={() => handleAudioPlay(i)}
                    >
                      <source src={pitch.audio} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <RecordingModal isOpen={isRecording} onClose={() => setIsRecording(false)} onComplete={handleRecordingComplete} />
        <EvaluationModal isOpen={showEvaluation} onClose={() => setShowEvaluation(false)} pitch={selectedPitch} isLoading={isLoading} />
      </div>
    </div>
  );
}
