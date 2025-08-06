import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  Info,
  Loader,
} from "lucide-react";

interface Pitch {
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

interface EvaluationModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  pitch: Pitch | null;
}

export function EvaluationModal({
  isOpen,
  onClose,
  pitch,
  isLoading,
}: EvaluationModalProps) {
  if (!pitch) return null;

  // Transform metrics to match the expected format
  // Calculate a normalized pace score based on WPM (Words Per Minute)
  const calculatePaceScore = (wpm: number): number => {
    const optimalMin = 130;
    const optimalMax = 160;

    if (wpm < optimalMin) {
      // Penalize slow speaking rate
      return Math.max(0, Math.round((wpm / optimalMin) * 100));
    } else if (wpm > optimalMax) {
      // Penalize fast speaking rate
      const overSpeedPenalty =
        ((wpm - optimalMax) / (optimalMax * 1.5 - optimalMax)) * 100;
      return Math.max(0, Math.round(100 - overSpeedPenalty));
    } else {
      // Ideal pace
      return 100;
    }
  };

  const evaluation = {
    delivery: {
      pace: calculatePaceScore(pitch.metrics.pace),
      tone:
        pitch.metrics.tone === "POSITIVE"
          ? 85
          : pitch.metrics.tone === "NEGATIVE"
          ? 40
          : 65,
      clarity: pitch.metrics.clarityWords.score,
      confidence: pitch.metrics.confidence.score,
      enthusiasm: pitch.metrics.emotionalWords.score,
    },
    engagement: {
      storytelling: pitch.metrics.storytellingWords.score,
      connection: pitch.metrics.connectionWords.score,
      persuasiveness: pitch.metrics.persuasiveWords.score,
    },
    overallScore: Math.round(
      pitch.metrics.confidence.score * 0.3 +
        pitch.metrics.connectionWords.score * 0.25 +
        pitch.metrics.persuasiveWords.score * 0.2 +
        pitch.metrics.storytellingWords.score * 0.15 +
        pitch.metrics.emotionalWords.score * 0.1
    ),
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4" />;
    if (score >= 60) return <Minus className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80)
      return { text: "Excellent", className: "bg-green-100 text-green-800" };
    if (score >= 60)
      return { text: "Good", className: "bg-yellow-100 text-yellow-800" };
    return { text: "Needs Work", className: "bg-red-100 text-red-800" };
  };

  const deliveryMetrics = [
    {
      label: "Pace",
      score: evaluation.delivery.pace,
      description: `Speaking speed: ${pitch.metrics.pace} WPM`,
    },
    {
      label: "Tone",
      score: evaluation.delivery.tone,
      description: `Overall tone: ${pitch.metrics.tone}`,
    },
    {
      label: "Clarity",
      score: evaluation.delivery.clarity,
      description: `Filler words: ${pitch.metrics.fillerWords.count}`,
    },
    {
      label: "Confidence",
      score: evaluation.delivery.confidence,
      description: `Confidence indicators: ${pitch.metrics.confidence.count}`,
    },
    {
      label: "Enthusiasm",
      score: evaluation.delivery.enthusiasm,
      description: `Emotional words: ${pitch.metrics.emotionalWords.count}`,
    },
  ];

  const engagementMetrics = [
    {
      label: "Storytelling",
      score: evaluation.engagement.storytelling,
      description: `Story markers: ${pitch.metrics.storytellingWords.count}`,
    },
    {
      label: "Connection",
      score: evaluation.engagement.connection,
      description: `Connection words: ${pitch.metrics.connectionWords.count}`,
    },
    {
      label: "Persuasiveness",
      score: evaluation.engagement.persuasiveness,
      description: `Persuasive terms: ${pitch.metrics.persuasiveWords.count}`,
    },
  ];

  const getFeedback = (score: number) => {
    if (score >= 80)
      return {
        icon: CheckCircle,
        color: "text-green-600",
        message: "Excellent performance!",
      };
    if (score >= 60)
      return {
        icon: AlertCircle,
        color: "text-yellow-500",
        message: "Good, with room for improvement",
      };
    return {
      icon: Info,
      color: "text-red-500",
      message: "Focus area for improvement",
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <BarChart3 className="w-6 h-6 mr-3" />
            Pitch Evaluation Results
          </DialogTitle>
          {pitch.filename && (
            <div className="text-sm text-gray-500">
              {pitch.filename} •{" "}
              {pitch.postedTime
                ? new Date(pitch.postedTime).toLocaleString()
                : "Just now"}
            </div>
          )}
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col justify-center items-center gap-4">
            <Loader className="animate-spin"/>
            Pleace Wait Loading
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="border-0 shadow-lg bg-gray-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div
                      className={`text-6xl font-bold ${getScoreColor(
                        evaluation.overallScore
                      )}`}
                    >
                      {evaluation.overallScore}
                    </div>
                    <div className="ml-4">
                      <div
                        className={`text-2xl ${getScoreColor(
                          evaluation.overallScore
                        )}`}
                      >
                        {getScoreIcon(evaluation.overallScore)}
                      </div>
                      <Badge
                        className={
                          getScoreBadge(evaluation.overallScore).className
                        }
                      >
                        {getScoreBadge(evaluation.overallScore).text}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">Overall Pitch Score</h3>
                  <p className="text-gray-500">
                    Duration: {pitch.duration} seconds
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delivery Metrics */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    Delivery Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deliveryMetrics.map((metric, index) => {
                    const feedback = getFeedback(metric.score);
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{metric.label}</span>
                            <feedback.icon
                              className={`w-4 h-4 ${feedback.color}`}
                            />
                          </div>
                          <span
                            className={`font-bold ${getScoreColor(
                              metric.score
                            )}`}
                          >
                            {metric.score}%
                          </span>
                        </div>
                        <Progress value={metric.score} className="h-2" />
                        <p className="text-xs text-gray-500">
                          {metric.description}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Engagement Metrics */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    Engagement Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {engagementMetrics.map((metric, index) => {
                    const feedback = getFeedback(metric.score);
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{metric.label}</span>
                            <feedback.icon
                              className={`w-4 h-4 ${feedback.color}`}
                            />
                          </div>
                          <span
                            className={`font-bold ${getScoreColor(
                              metric.score
                            )}`}
                          >
                            {metric.score}%
                          </span>
                        </div>
                        <Progress value={metric.score} className="h-2" />
                        <p className="text-xs text-gray-500">
                          {metric.description}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Transcript Section */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Full Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{pitch.transcript}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {/* <Button className="bg-blue-600 hover:bg-blue-700">
              Download Report
            </Button> */}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
