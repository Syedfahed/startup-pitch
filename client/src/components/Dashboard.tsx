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

interface PitchSate {
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
  useEffect(() => {
    const recordingForLocal = localStorage.getItem("recordings");
    const recording = recordingForLocal ? JSON.parse(recordingForLocal) : [];
    setPitches([
      ...recording,
      {
        filename: "ttsMP3.com_VoiceText_2025-8-6_15-2-20.mp3",
        postedTime: "2025-08-06T16:33:19.119Z",
        duration: "Unknown",
        audio: expAudio,
      },
    ]);
  }, []);

  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<PitchSate | null>(pichdummydata);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const handleRecordingComplete = (filename: string, duration: string) => {
    const recordingForLocal = localStorage.getItem("recordings");
    const recording = recordingForLocal ? JSON.parse(recordingForLocal) : [];
    setPitches(recording);
  };

  const handleAudioPlay = (currentIndex: number) => {
    audioRefs.current.forEach((audio, index) => {
      if (audio && index !== currentIndex) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };

  const handleAnalyse = async (data: Pitch) => {
    setLoading(true);
    setShowEvaluation(true);

    try {
      const response = await axios.post(
        "https://startup-pitch-fefk.onrender.com/api/pitch/upload",
        { audioData: data.audio },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(response.data);
      setSelectedPitch(response.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

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
      const recordingForLocal = localStorage.getItem("recordings");
      const recording = recordingForLocal ? JSON.parse(recordingForLocal) : [];
      const updated = [newPitch, ...recording];
      localStorage.setItem("recordings", JSON.stringify(updated));
      setPitches(updated);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Startup Pitch Evaluator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Perfect your startup pitch with AI-powered analysis. Get insights on
            delivery, engagement, and persuasion techniques.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-primary text-primary-foreground hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    Record New Pitch
                  </h3>
                  <p className="opacity-90">
                    Capture your pitch with our built-in recorder
                  </p>
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
                  <p className="text-muted-foreground">
                    Upload existing pitch recordings
                  </p>
                </div>
                <label className="group-hover:scale-105 transition-transform border-2 cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border-muted-foreground text-muted-foreground">
                  <Upload className="w-6 h-6" /> Upload
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Your Pitches</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pitches.length === 0 ? (
              <div className="text-center py-12">
                <FileAudio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  No pitches yet
                </h3>
                <p className="text-muted-foreground">
                  Record or upload your first pitch to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pitches.map((pitch, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 p-4 bg-surface rounded-xl border border-border hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between gap-4">
                      <h2 className="text-lg font-semibold">
                        {pitch.filename}
                      </h2>
                      <button
                        className={`${
                          isLoading
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                            : "bg-green-500 text-white"
                        } p-2 rounded-md`}
                        onClick={() => handleAnalyse(pitch)}
                        disabled={isLoading}
                      >
                        Evaluat
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Duration: {pitch.duration} | Posted:{" "}
                      {new Date(pitch.postedTime).toLocaleString()}
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

        <RecordingModal
          isOpen={isRecording}
          onClose={() => setIsRecording(false)}
          onComplete={handleRecordingComplete}
        />

        <EvaluationModal
          isOpen={showEvaluation}
          onClose={() => setShowEvaluation(false)}
          pitch={selectedPitch}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
