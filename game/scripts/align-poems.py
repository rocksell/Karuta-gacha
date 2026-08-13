import difflib
import json
import re
import sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "src/data/poems.json"
AUDIO_DIRECTORY = ROOT / "public/audio/poems"


def normalize(text):
    output = []
    for character in text:
        code = ord(character)
        if 0x30A1 <= code <= 0x30F6:
            character = chr(code - 0x60)
        if re.match(r"[ぁ-ゖゝゞ]", character):
            output.append(character)
    return "".join(output)


def distribute_word(word):
    characters = list(normalize(word.word))
    if not characters:
        return []
    duration = max(0.02, word.end - word.start)
    return [
        (character, word.start + duration * index / len(characters))
        for index, character in enumerate(characters)
    ]


def align_times(target, recognized):
    recognized_text = "".join(character for character, _ in recognized)
    matcher = difflib.SequenceMatcher(None, target, recognized_text, autojunk=False)
    times = [None] * len(target)
    for block in matcher.get_matching_blocks():
        for offset in range(block.size):
            times[block.a + offset] = recognized[block.b + offset][1]

    known = [index for index, value in enumerate(times) if value is not None]
    if not known:
        raise RuntimeError("No recognized characters matched the target text")

    for index in range(len(times)):
        if times[index] is not None:
            continue
        previous = max((item for item in known if item < index), default=None)
        following = min((item for item in known if item > index), default=None)
        if previous is None:
            times[index] = max(0, times[following] - 0.18 * (following - index))
        elif following is None:
            times[index] = times[previous] + 0.18 * (index - previous)
        else:
            position = (index - previous) / (following - previous)
            times[index] = times[previous] + (times[following] - times[previous]) * position

    return [round(value, 2) for value in times], matcher.ratio()


def find_line_break(audio, sample_rate=16000):
    window = int(sample_rate * 0.12)
    energy = np.array([
        np.sqrt(np.mean(np.square(audio[start : start + window])))
        for start in range(0, len(audio) - window, window)
    ])
    smooth = np.convolve(energy, np.ones(3) / 3, mode="same")
    lower = int(len(smooth) * 0.34)
    upper = int(len(smooth) * 0.58)
    quietest = lower + int(np.argmin(smooth[lower:upper]))
    return quietest * window


def transcribe_line(model, audio, text, offset):
    segments, _ = model.transcribe(
        audio,
        language="ja",
        beam_size=5,
        word_timestamps=True,
        vad_filter=False,
        condition_on_previous_text=False,
        initial_prompt=text,
    )
    recognized = []
    for segment in segments:
        for word in segment.words or []:
            recognized.extend(
                (character, timestamp + offset)
                for character, timestamp in distribute_word(word)
            )
    return align_times(text, recognized)


def main():
    poems = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    model = WhisperModel("small", device="cpu", compute_type="int8")
    requested = {int(value) for value in sys.argv[1:]}

    for position, poem in enumerate(poems, start=1):
        number = poem["number"]
        if requested and number not in requested:
            continue
        lines = poem["hiragana"].splitlines()
        audio = decode_audio(str(AUDIO_DIRECTORY / f"{number:03}.mp3"))
        line_break = find_line_break(audio)
        chunks = (audio[:line_break], audio[line_break:])
        offset = line_break / 16000
        first_times, first_quality = transcribe_line(model, chunks[0], lines[0], 0)
        second_times, second_quality = transcribe_line(model, chunks[1], lines[1], offset)
        poem["timings"] = [first_times, second_times]
        print(
            f"[{position:03}/100] card {number:03}: "
            f"split={offset:.2f}s match={first_quality:.1%}/{second_quality:.1%}",
            flush=True,
        )

    DATA_PATH.write_text(
        json.dumps(poems, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Saved aligned timings to {DATA_PATH}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Alignment failed: {error}", file=sys.stderr)
        raise
