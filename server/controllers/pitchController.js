const axios = require("axios");
require("dotenv").config();

// ✅ Keyword sets
const fillerWords = [
  "uh", "um", "like", "you know", "basically", "actually", "literally", "so",
  "well", "hmm", "i mean", "sort of", "kind of", "you see", "er", "ah"
];

const emotionalWords = [
  "excited", "amazing", "passionate", "thrilled", "energized", "fantastic",
  "incredible", "awesome", "happy", "enthusiastic", "grateful", "love",
  "delighted", "fascinating"
];

const storytellingWords = [
  "once", "then", "after that", "finally", "at first", "suddenly", "meanwhile",
  "eventually", "because", "however", "so", "therefore", "next", "before", "later", "as a result"
];

const connectionWords = [
  "you", "your", "we", "together", "our", "us", "let’s", "imagine", "consider", "picture this", "think about"
];

const clarityWords = [
  "first", "second", "finally", "to summarize", "in short", "clearly", "importantly",
  "specifically", "main point", "let me explain", "in conclusion", "this means", "the point is"
];

const confidenceWords = [
  "we will", "i believe", "i know", "definitely", "certainly", "without a doubt",
  "i’m confident", "absolutely", "guaranteed", "committed", "focused on", "dedicated to"
];

const persuasiveWords = [
  "guarantee", "proof", "research", "results", "trusted", "study", "data", "verified",
  "proven", "because", "tested", "effective", "success", "benefit", "impact", "track record"
];

// ✅ Evaluation logic
const evaluateTextMetrics = (text, durationInSeconds, sentimentResults) => {
  const words = text.toLowerCase().split(/\s+/);
  const wpm = Math.round((words.length / durationInSeconds) * 60);

  const countOccurrences = (keywords) =>
    keywords.reduce(
      (acc, keyword) => acc + words.filter((w) => w.includes(keyword)).length,
      0
    );

  const maxThresholds = {
    fillerWords: 10,        // more = bad
    emotionalWords: 10,
    storytellingWords: 8,
    connectionWords: 8,
    persuasiveWords: 8,
    clarityWords: 6,
    confidenceWords: 6
  };

  const counts = {
    fillerWords: countOccurrences(fillerWords),
    emotionalWords: countOccurrences(emotionalWords),
    storytellingWords: countOccurrences(storytellingWords),
    connectionWords: countOccurrences(connectionWords),
    persuasiveWords: countOccurrences(persuasiveWords),
    clarityWords: countOccurrences(clarityWords),
    confidenceWords: countOccurrences(confidenceWords)
  };

  const getScore = (count, max) => Math.min(Math.round((count / max) * 100), 100);
  const getInverseScore = (count, max) => Math.max(0, 100 - Math.round((count / max) * 100));

  return {
    pace: wpm,
    tone: sentimentResults.length ? sentimentResults[0].sentiment : "Unknown",

    fillerWords: {
      count: counts.fillerWords,
      score: getScore(counts.fillerWords, maxThresholds.fillerWords)
    },

    emotionalWords: {
      count: counts.emotionalWords,
      score: getScore(counts.emotionalWords, maxThresholds.emotionalWords)
    },

    storytellingWords: {
      count: counts.storytellingWords,
      score: getScore(counts.storytellingWords, maxThresholds.storytellingWords)
    },

    connectionWords: {
      count: counts.connectionWords,
      score: getScore(counts.connectionWords, maxThresholds.connectionWords)
    },

    persuasiveWords: {
      count: counts.persuasiveWords,
      score: getScore(counts.persuasiveWords, maxThresholds.persuasiveWords)
    },

    clarityWords: {
      count: counts.clarityWords,
      score: getScore(counts.clarityWords, maxThresholds.clarityWords)
    },

    confidenceWords: {
      count: counts.confidenceWords,
      score: getScore(counts.confidenceWords, maxThresholds.confidenceWords)
    },

    confidence: {
      count: sentimentResults.filter((r) => r.sentiment === "POSITIVE").length,
      score: Math.min(
        Math.round(
          (sentimentResults.filter((r) => r.sentiment === "POSITIVE").length /
            (sentimentResults.length || 1)) * 100
        ),
        100
      )
    }
  };
};

// ✅ API handler
const evaluatePitch = async (req, res) => {
  try {
    const { audioData } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: "No audio data provided" });
    }

    const base64Data = audioData.split(",")[1] || audioData;
    const audioBuffer = Buffer.from(base64Data, "base64");

    // Upload to AssemblyAI
    const uploadRes = await axios({
      method: "post",
      url: "https://api.assemblyai.com/v2/upload",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY,
        "content-type": "application/octet-stream"
      },
      data: audioBuffer
    });

    const audioUrl = uploadRes.data.upload_url;

    // Request transcription and sentiment analysis
    const transcriptRes = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      {
        audio_url: audioUrl,
        sentiment_analysis: true
      },
      {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY
        }
      }
    );

    const transcriptId = transcriptRes.data.id;

    const getTranscript = async () => {
      const result = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: { authorization: process.env.ASSEMBLYAI_API_KEY }
        }
      );
      return result.data;
    };

    // Wait for transcription to complete
    let completed = false;
    let result;
    while (!completed) {
      result = await getTranscript();
      if (result.status === "completed" || result.status === "error") {
        completed = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    if (result.status === "completed") {
      const metrics = evaluateTextMetrics(
        result.text,
        result.audio_duration,
        result.sentiment_analysis_results || []
      );

      res.json({
        transcript: result.text,
        duration: result.audio_duration,
        metrics
      });
    } else {
      res.status(500).json({ error: "Transcription failed" });
    }
  } catch (err) {
    console.error("Error in evaluatePitch:", err.message);
    res.status(500).json({
      error: "Something went wrong",
      details: err.message
    });
  }
};

module.exports = { evaluatePitch };
