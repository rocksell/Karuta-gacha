import json
import re
import difflib
from pathlib import Path

import pdfplumber
from pykakasi import kakasi

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "tmp/pdfs/dokushu-text.pdf"
DATA_PATH = ROOT / "src/data/poems.json"
KANA = re.compile(r"[ぁ-ゖゝゞ]$")
CONVERTER = kakasi()


def digit_groups(page):
    digits = sorted(
        [
            character
            for character in page.chars
            if character["text"].isdigit()
            and character["size"] < 9
            and character["top"] < 640
        ],
        key=lambda item: (round(item["top"], 1), item["x0"]),
    )
    groups = []
    for character in digits:
        if (
            groups
            and abs(groups[-1][-1]["top"] - character["top"]) < 1
            and character["x0"] - groups[-1][-1]["x1"] < 2
        ):
            groups[-1].append(character)
        else:
            groups.append([character])
    output = []
    for group in groups:
        value = int("".join(character["text"] for character in group))
        if 1 <= value <= 100:
            output.append(
                (value, sum(character["x0"] for character in group) / len(group), group[0]["top"])
            )
    return output


def align_visible_kana(target, visible):
    mapping = {}
    visible_text = "".join(character for _, character in visible)
    matcher = difflib.SequenceMatcher(None, visible_text, target, autojunk=False)
    for block in matcher.get_matching_blocks():
        for offset in range(block.size):
            mapping[visible[block.a + offset][0]] = block.b + offset
    return mapping


def edit_distance(left, right):
    previous = list(range(len(right) + 1))
    for left_index, left_character in enumerate(left, start=1):
        current = [left_index]
        for right_index, right_character in enumerate(right, start=1):
            current.append(
                min(
                    current[-1] + 1,
                    previous[right_index] + 1,
                    previous[right_index - 1] + (left_character != right_character),
                )
            )
        previous = current
    return previous[-1]


def partition_target(target, segments):
    states = {0: (0.0, [])}
    for segment_index, segment in enumerate(segments):
        next_states = {}
        remaining_segments = len(segments) - segment_index - 1
        for start, (cost, boundaries) in states.items():
            min_end = start + 1
            max_end = len(target) - remaining_segments
            for end in range(min_end, max_end + 1):
                candidate = target[start:end]
                distance = edit_distance(segment, candidate)
                segment_cost = distance / max(len(segment), len(candidate), 1)
                segment_cost += abs(len(segment) - len(candidate)) * 0.025
                total = cost + segment_cost
                if end not in next_states or total < next_states[end][0]:
                    next_states[end] = (total, boundaries + [end])
        states = next_states
    return states[len(target)][1]


def extract_column(page, number, number_x, number_top, target):
    base_candidates = [
        character["x0"]
        for character in page.chars
        if abs(character["size"] - 14) < 0.2
        and number_top + 12 < character["top"] < 640
        and abs(character["x0"] - number_x) < 10
    ]
    if not base_candidates:
        raise RuntimeError(f"Card {number}: text column not found")
    base_x = min(base_candidates, key=lambda value: abs(value - number_x))
    characters = sorted(
        [
            character
            for character in page.chars
            if (
                (abs(character["size"] - 14) < 0.2 and abs(character["x0"] - base_x) < 3.2)
                or (
                    character["text"] == "ー"
                    and 8.8 < character["size"] < 9.2
                    and abs(character["x0"] - base_x) < 4
                )
            )
            and number_top + 12 < character["top"] < 640
        ],
        key=lambda item: item["top"],
    )
    tokens = [character for character in characters if character["text"].strip()]
    flat_target = "".join(target.splitlines())
    converted_segments = []
    marker_symbols = []
    segment = ""
    index = 0
    while index < len(tokens):
        token = tokens[index]
        if token["text"] != "ー":
            segment += token["text"]
            index += 1
            continue
        converted = "".join(item["hira"] for item in CONVERTER.convert(segment))
        converted_segments.append(converted)
        segment = ""
        marker_symbols.append("-" if token["size"] < 10 else "—")
        index += 1
    converted_segments.append(
        "".join(item["hira"] for item in CONVERTER.convert(segment))
    )

    boundaries = partition_target(flat_target, converted_segments)
    markers = {}
    for boundary, marker in zip(boundaries, marker_symbols):
        markers[boundary - 1] = marker

    # The tapered triangle printed after every poem marks the final sustained sound.
    markers[len(flat_target) - 1] = markers.get(len(flat_target) - 1, "") + "△"
    first_length = len(target.splitlines()[0])
    return [
        {str(index): marker for index, marker in markers.items() if index < first_length},
        {
            str(index - first_length): marker
            for index, marker in markers.items()
            if index >= first_length
        },
    ]


def main():
    poems = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    by_number = {poem["number"]: poem for poem in poems}
    found = set()
    with pdfplumber.open(PDF_PATH) as document:
        for page in document.pages[5:]:
            for number, number_x, number_top in digit_groups(page):
                if number in found or number not in by_number:
                    continue
                poem = by_number[number]
                poem["notation"] = extract_column(
                    page, number, number_x, number_top, poem["hiragana"]
                )
                found.add(number)
                print(f"Extracted card {number:03}")
    missing = set(range(1, 101)) - found
    if missing:
        raise RuntimeError(f"Notation missing for cards: {sorted(missing)}")
    DATA_PATH.write_text(
        json.dumps(poems, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("Saved notation for 100 cards")


if __name__ == "__main__":
    main()
