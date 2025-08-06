import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Play, Pause, Download } from "lucide-react";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (filename: string, duration: string) => void;
}

export function RecordingModal({
  isOpen,
  onClose,
  onComplete,
}: RecordingModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [filename, setFilename] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

 const saveRecording = () => {
  if (audioBlob && filename) {
    const finalFilename = filename || `Pitch Recording ${new Date().toLocaleDateString()}`;
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Audio = reader.result as string;

      const recordingData = {
        filename: finalFilename + '.wav',
        postedTime: new Date().toISOString(),
        duration: formatTime(recordingTime),
        audio: base64Audio,
      };

      // Store in localStorage (you can use an array to store multiple recordings)
      const existing = JSON.parse(localStorage.getItem("recordings") || "[]");
      existing.push(recordingData);
      localStorage.setItem("recordings", JSON.stringify(existing));

      // Callback
      onComplete(recordingData.filename, recordingData.duration);
      resetModal();
      onClose();
    };

    reader.readAsDataURL(audioBlob); // Convert Blob to base64
  }
};


  const resetModal = () => {
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setRecordingTime(0);
    setFilename("");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-xl">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">
            Record Your Pitch
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recording Visualization */}
          <div className="text-center py-8">
            <div
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 transition-all duration-300 ${
                isRecording && !isPaused
                  ? "bg-destructive shadow-glow animate-pulse-subtle"
                  : "bg-primary"
              }`}
            >
              <Mic className="w-12 h-12 text-white" />
            </div>

            <div className="text-3xl font-mono font-bold text-foreground mb-2">
              {formatTime(recordingTime)}
            </div>

            {isRecording && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isPaused ? "bg-warning" : "bg-destructive animate-pulse"
                  }`}
                />
                <span>{isPaused ? "Paused" : "Recording..."}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isRecording && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>Max: 10:00</span>
              </div>
              <Progress value={(recordingTime / 600) * 100} className="h-2" />
            </div>
          )}

          {/* Filename Input */}
          {audioBlob && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Preview
              </label>
              <audio controls className="w-full mt-2">
                <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>

              <label className="text-sm font-medium text-foreground">
                Filename
              </label>

              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {!filename && <p className="text-red-600 text-sm">Requried</p>}
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <>
                <Button onClick={pauseRecording} variant="outline" size="lg">
                  {isPaused ? (
                    <Play className="w-5 h-5 mr-2" />
                  ) : (
                    <Pause className="w-5 h-5 mr-2" />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </Button>

                <Button onClick={stopRecording} variant="destructive" size="lg">
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </>
            )}

            {audioBlob && (
              <Button
                onClick={saveRecording}
                size="lg"
                className="bg-accent hover:bg-accent/90"
              >
                <Download className="w-5 h-5 mr-2" />
                Save Recording
              </Button>
            )}
          </div>

          {/* Cancel Button */}
          <div className="text-center pt-4 border-t border-border">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
