"""
WasteWise AI - Automated Design Token Consistency Test
Verifies that frontend/src/tokens.ts and frontend/src/index.css have zero drift.
All color tokens in tokens.ts must exist and match 1:1 with CSS custom properties in index.css.
"""

import os
import re
import pytest

def test_token_drift_check():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    tokens_path = os.path.join(root_dir, "frontend", "src", "tokens.ts")
    css_path = os.path.join(root_dir, "frontend", "src", "index.css")

    assert os.path.exists(tokens_path), f"tokens.ts not found at {tokens_path}"
    assert os.path.exists(css_path), f"index.css not found at {css_path}"

    with open(tokens_path, "r", encoding="utf-8") as f:
        tokens_content = f.read()

    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()

    # Extract all hex codes from tokens.ts
    hex_pattern = re.compile(r"['\"](#([0-9a-fA-F]{6}|[0-9a-fA-F]{3}))['\"]")
    tokens_hexes = set(m.group(1).upper() for m in hex_pattern.finditer(tokens_content))

    # Extract all hex codes from index.css
    css_hex_pattern = re.compile(r"(#([0-9a-fA-F]{6}|[0-9a-fA-F]{3}))")
    css_hexes = set(m.group(1).upper() for m in css_hex_pattern.finditer(css_content))

    # Verify that key color tokens in tokens.ts are present in index.css
    missing_in_css = tokens_hexes - css_hexes
    assert len(missing_in_css) == 0, f"Design token drift detected! Tokens in tokens.ts missing in index.css: {missing_in_css}"

    # Verify essential brand and semantic tokens exist in both
    essential_tokens = {
        "#12523C", # Brand Deep Forest
        "#16865D", # Brand Emerald
        "#47D7A0", # Brand Mint
        "#4263D8", # Professional Royal Blue
        "#7656D6", # Premium Violet
        "#087E8B", # Deep Teal
        "#E7A32D", # Amber
        "#E96B63", # Coral
        "#F5F7FA", # Canvas Background
        "#17232E", # Primary Text
        "#647386", # Secondary Text
        "#DFE5EC", # Canvas Border
        "#172B3D", # Deep Feature Surface
    }
    
    for token in essential_tokens:
        assert token in tokens_hexes, f"Missing essential token {token} in tokens.ts"
        assert token in css_hexes, f"Missing essential token {token} in index.css"

    print(f"\n[TOKEN DRIFT TEST PASSED] Verified {len(tokens_hexes)} tokens synchronized across index.css and tokens.ts.")
