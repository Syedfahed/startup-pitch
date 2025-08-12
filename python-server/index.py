import os
import base64
import time
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ✅ Keyword sets
filler_words = [
    "uh", "um", "like", "you know", "basically", "actually", "literally", "so",
    "well", "hmm", "i mean", "sort of", "kind of", "you see", "er", "ah"
]
emotional_words = [
    "excited", "amazing", "passionate", "thrilled", "energized", "fantastic",
    "incredible", "awesome", "happy", "enthusiastic", "grateful", "love",
    "delighted", "fascinating"
]
storytelling_words = [
    "once", "then", "after that", "finally", "at first", "suddenly", "meanwhile",
    "eventually", "because", "however", "so", "therefore", "next", "before", "later", "as a result"
]
connection_words = [
    "you", "your", "we", "together", "our", "us", "let’s", "imagine", "consider", "picture this", "think about"
]
clarity_words = [
    "first", "second", "finally", "to summarize", "in short", "clearly", "importantly",
    "specifically", "main point", "let me explain", "in conclusion", "this means", "the point is"
]
confidence_words = [
    "we will", "i believe", "i know", "definitely", "certainly", "without a doubt",
    "i’m confident", "absolutely", "guaranteed", "committed", "focused on", "dedicated to"
]
persuasive_words = [
    "guarantee", "proof", "research", "results", "trusted", "study", "data", "verified",
    "proven", "because", "tested", "effective", "success", "benefit", "impact", "track record"
]

# ✅ Evaluation logic
def evaluate_text_metrics(text, duration_in_seconds, sentiment_results):
    words = text.lower().split()
    wpm = round((len(words) / duration_in_seconds) * 60) if duration_in_seconds > 0 else 0

    def count_occurrences(keywords):
        return sum(1 for w in words for k in keywords if k in w)

    max_thresholds = {
        "filler_words": 10,
        "emotional_words": 10,
        "storytelling_words": 8,
        "connection_words": 8,
        "persuasive_words": 8,
        "clarity_words": 6,
        "confidence_words": 6
    }

    counts = {
        "filler_words": count_occurrences(filler_words),
        "emotional_words": count_occurrences(emotional_words),
        "storytelling_words": count_occurrences(storytelling_words),
        "connection_words": count_occurrences(connection_words),
        "persuasive_words": count_occurrences(persuasive_words),
        "clarity_words": count_occurrences(clarity_words),
        "confidence_words": count_occurrences(confidence_words)
    }

    def get_score(count, max_val):
        return min(round((count / max_val) * 100), 100)

    return {
        "pace": wpm,
        "tone": sentiment_results[0]["sentiment"] if sentiment_results else "Unknown",
        "fillerWords": {
            "count": counts["filler_words"],
            "score": get_score(counts["filler_words"], max_thresholds["filler_words"])
        },
        "emotionalWords": {
            "count": counts["emotional_words"],
            "score": get_score(counts["emotional_words"], max_thresholds["emotional_words"])
        },
        "storytellingWords": {
            "count": counts["storytelling_words"],
            "score": get_score(counts["storytelling_words"], max_thresholds["storytelling_words"])
        },
        "connectionWords": {
            "count": counts["connection_words"],
            "score": get_score(counts["connection_words"], max_thresholds["connection_words"])
        },
        "persuasiveWords": {
            "count": counts["persuasive_words"],
            "score": get_score(counts["persuasive_words"], max_thresholds["persuasive_words"])
        },
        "clarityWords": {
            "count": counts["clarity_words"],
            "score": get_score(counts["clarity_words"], max_thresholds["clarity_words"])
        },
        "confidenceWords": {
            "count": counts["confidence_words"],
            "score": get_score(counts["confidence_words"], max_thresholds["confidence_words"])
        },
        "confidence": {
            "count": sum(1 for r in sentiment_results if r["sentiment"] == "POSITIVE"),
            "score": min(round(
                (sum(1 for r in sentiment_results if r["sentiment"] == "POSITIVE") / max(len(sentiment_results), 1)) * 100
            ), 100)
        }
    }

# ✅ API handler
def evaluate_pitch(audio_data):
    try:
        if not audio_data:
            return {"error": "No audio data provided"}

        base64_data = audio_data.split(",")[1] if "," in audio_data else audio_data
        audio_bytes = base64.b64decode(base64_data)
        headers = {
            "authorization": os.getenv("ASSEMBLYAI_API_KEY"),
            "content-type": "application/octet-stream"
        }

        # Upload to AssemblyAI
        upload_res = requests.post("https://api.assemblyai.com/v2/upload", headers=headers, data=audio_bytes)
        audio_url = upload_res.json().get("upload_url")

        # Request transcription & sentiment analysis
        transcript_res = requests.post(
            "https://api.assemblyai.com/v2/transcript",
            headers={"authorization": os.getenv("ASSEMBLYAI_API_KEY")},
            json={"audio_url": audio_url, "sentiment_analysis": True}
        )
        transcript_id = transcript_res.json().get("id")

        # Poll until completion
        while True:
            result = requests.get(
                f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
                headers={"authorization": os.getenv("ASSEMBLYAI_API_KEY")}
            ).json()

            if result["status"] in ["completed", "error"]:
                break
            time.sleep(3)

        if result["status"] == "completed":
            metrics = evaluate_text_metrics(
                result["text"],
                result["audio_duration"],
                result.get("sentiment_analysis_results", [])
            )
            return {
                "transcript": result["text"],
                "duration": result["audio_duration"],
                "metrics": metrics
            }
        else:
            return {"error": "Transcription failed"}

    except Exception as e:
        print("Error in evaluate_pitch:", str(e))
        return {"error": "Something went wrong", "details": str(e)}
