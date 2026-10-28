#!/usr/bin/env python3
"""Plan synthetic presentation dialogue audio; use --generate for network TTS.

Reads an explicitly exported source file. Never queries a database, places calls,
clones voices, or attaches recordings. Existing audio is reused by content hash.
Requires Python's edge-tts package and ffmpeg/ffprobe for --generate.
"""
import argparse
import asyncio
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import wave
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICES = {
    "Telugu": {"assistant": "te-IN-MohanNeural", "parent": "te-IN-ShrutiNeural"},
    "Hindi": {"assistant": "hi-IN-SwaraNeural", "parent": "hi-IN-MadhurNeural"},
    "Tamil": {"assistant": "ta-IN-ValluvarNeural", "parent": "ta-IN-PallaviNeural"},
}
RATES = {"assistant": "+0%", "parent": "-3%"}
GAP_SECONDS = 0.32
SAMPLE_RATE = 24000
RENDER_VERSION = "edge-dialogue-v1-24k-64k-lufs18-peak2-gap320"


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:24]


def run(args):
    return subprocess.run(args, check=True, capture_output=True)


def turns(transcript, language):
    result = []
    for line in transcript.splitlines():
        if not line.strip():
            continue
        speaker, separator, speech = line.partition(":")
        if not separator or not speech.strip():
            raise ValueError("Each transcript line must contain a speaker label and spoken text.")
        role = "assistant" if speaker.strip() == "Assistant" else "parent"
        result.append({"voice": VOICES[language][role], "rate": RATES[role], "text": speech.strip()})
    if len(result) < 2 or not any(t["voice"] == VOICES[language]["parent"] for t in result):
        raise ValueError("A conversation must contain assistant and parent turns.")
    return result


def verify(path):
    info = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,sample_rate,channels,bit_rate", "-show_entries", "format=duration,size", "-of", "json", str(path)]).stdout)
    stream = info["streams"][0]
    if stream["codec_name"] != "mp3" or int(stream["sample_rate"]) != SAMPLE_RATE or stream["channels"] != 1 or int(stream["bit_rate"]) != 64000:
        raise ValueError(f"Unexpected audio format: {path.name}")
    duration = float(info["format"]["duration"])
    if not 1 < duration < 180:
        raise ValueError(f"Unexpected conversation duration: {path.name}")
    # Decode the entire stream, then inspect the decoded peak for clipping.
    run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "null", "-"])
    measurement = run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"]).stderr.decode()
    peak = float(re.search(r"max_volume: ([\-\d.]+) dB", measurement).group(1))
    if peak > -1:
        raise ValueError(f"Insufficient peak headroom in {path.name}: {peak} dBFS")
    return {"durationSeconds": round(duration, 3), "bytes": int(info["format"]["size"]), "peakDbfs": peak}


async def generate(source, dialogues, destination):
    import edge_tts  # Imported only for the explicit network operation.
    for binary in ["ffmpeg", "ffprobe"]:
        if not shutil.which(binary):
            raise RuntimeError(f"Required tool is unavailable: {binary}")
    cache = Path(tempfile.gettempdir()) / "parivaar-presentation-tts"
    cache.mkdir(mode=0o700, exist_ok=True)
    destination.mkdir(parents=True, exist_ok=True)
    utterances = {digest(turn): turn for item in dialogues.values() for turn in item["turns"]}
    semaphore = asyncio.Semaphore(3)

    async def synthesize(key, turn):
        raw = cache / f"{key}.mp3"
        pcm = cache / f"{key}.wav"
        if pcm.exists() and pcm.stat().st_size > 100:
            return
        async with semaphore:
            if not raw.exists() or raw.stat().st_size < 100:
                for attempt in range(2):
                    temporary = cache / f"{key}.part.mp3"
                    try:
                        await asyncio.wait_for(edge_tts.Communicate(turn["text"], voice=turn["voice"], rate=turn["rate"]).save(str(temporary)), timeout=45)
                        temporary.replace(raw)
                        break
                    except Exception:
                        temporary.unlink(missing_ok=True)
                        if attempt:
                            raise
                        await asyncio.sleep(0.75)
            # Remove only silence at the ends, keeping all pauses inside the turn.
            trim = "silenceremove=start_periods=1:start_duration=0.015:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_duration=0.015:start_threshold=-50dB,areverse"
            run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", trim, "-ar", str(SAMPLE_RATE), "-ac", "1", "-c:a", "pcm_s16le", str(pcm)])
            print(f"Prepared voice turn {key} ({turn['voice']})", flush=True)

    await asyncio.gather(*(synthesize(key, turn) for key, turn in utterances.items()))
    clips = []
    for index, (key, item) in enumerate(dialogues.items(), 1):
        output = destination / f"{key}.mp3"
        if not output.exists():
            combined = cache / f"dialogue-{key}.wav"
            with wave.open(str(combined), "wb") as target:
                target.setnchannels(1)
                target.setsampwidth(2)
                target.setframerate(SAMPLE_RATE)
                for position, turn in enumerate(item["turns"]):
                    if position:
                        target.writeframes(b"\0\0" * round(SAMPLE_RATE * GAP_SECONDS))
                    with wave.open(str(cache / f"{digest(turn)}.wav"), "rb") as audio:
                        target.writeframes(audio.readframes(audio.getnframes()))
            temporary = cache / f"dialogue-{key}.mp3"
            run(["ffmpeg", "-v", "error", "-y", "-i", str(combined), "-af", "loudnorm=I=-18:TP=-2:LRA=7", "-ar", str(SAMPLE_RATE), "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", "-map_metadata", "-1", str(temporary)])
            verify(temporary)
            shutil.copyfile(temporary, output)
        details = verify(output)
        clips.append({"path": item["path"], "language": item["language"], "voices": VOICES[item["language"]], **details})
        print(f"Verified clip {index}/{len(dialogues)}: {item['language']}, {details['durationSeconds']}s", flush=True)
    calls = []
    for call in source["calls"]:
        key = digest({"version": RENDER_VERSION, "language": call["script_language"], "transcript": call["transcript"], "voices": VOICES[call["script_language"]], "rates": RATES})
        calls.append({"id": call["id"], "path": dialogues[key]["path"], "transcript": call["transcript"]})
    return {"accountId": source["accountId"], "provider": "edge_neural_synthetic", "generatedAt": datetime.now(timezone.utc).isoformat(), "calls": calls, "clips": clips}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=ROOT / "reports/presentation-audio-source.json")
    parser.add_argument("--generate", action="store_true", help="Generate audio through the online TTS service; never places telephone calls.")
    args = parser.parse_args()
    source = json.loads(args.source.read_text())
    if not source.get("accountId") or not source.get("calls"):
        raise ValueError("Source requires an accountId and a nonempty calls list.")
    if len({c["id"] for c in source["calls"]}) != len(source["calls"]):
        raise ValueError("Duplicate call IDs in source.")
    # All permitted speech is fictional copy authored in the demo seed script.
    # Reject edited/private transcript text before sending anything to TTS.
    seed_source = (ROOT / "scripts/seed-presentation-demo.mjs").read_text()
    speech_block = seed_source.split("const speech = {", 1)[1].split("const calls =", 1)[0]
    approved_speech = set(re.findall(r'^\s+(?:prompt|confirmed|snoozed|need_help|missed|close): "([^"]+)"', speech_block, re.MULTILINE))
    if len(approved_speech) != 18:
        raise ValueError("Expected the 18 reviewed fictional seed phrases.")
    demo_definition = (ROOT / "lib/demo-account.ts").read_text()
    demo_match = re.search(r'DEMO_ACCOUNT_ID\s*=\s*"([^"]+)"', demo_definition)
    if not demo_match or source["accountId"] != demo_match.group(1):
        raise ValueError("Only the protected presentation account is allowed.")
    dialogues = {}
    for call in source["calls"]:
        language = call["script_language"]
        if language not in VOICES:
            raise ValueError(f"No reviewed voice pair for {language}")
        key = digest({"version": RENDER_VERSION, "language": language, "transcript": call["transcript"], "voices": VOICES[language], "rates": RATES})
        prepared_turns = turns(call["transcript"], language)
        if any(turn["text"] not in approved_speech for turn in prepared_turns):
            raise ValueError("Transcript contains speech outside the reviewed fictional seed phrases.")
        dialogues[key] = {"language": language, "turns": prepared_turns, "path": f"/audio/conversations/{key}.mp3"}
    print("Verified: only fictional seed phrases are sent; speaker names, IDs, numbers, and transcript labels stay local.")
    print(json.dumps({"mode": "generate" if args.generate else "plan", "calls": len(source["calls"]), "uniqueDialogues": len(dialogues), "uniqueUtterances": len({digest(turn) for item in dialogues.values() for turn in item["turns"]}), "voices": VOICES}, indent=2))
    if args.generate:
        manifest = asyncio.run(generate(source, dialogues, ROOT / "public/audio/conversations"))
        target = ROOT / "reports/presentation-audio-manifest.json"
        target.parent.mkdir(exist_ok=True)
        target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        print(f"Completed: {len(manifest['clips'])} clips, {len(manifest['calls'])} call references. No calls placed or database changes made.")


if __name__ == "__main__":
    main()
