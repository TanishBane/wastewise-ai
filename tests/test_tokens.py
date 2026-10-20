"""Check the workspace palette and chart styling against its CSS tokens."""
from pathlib import Path
import re


def test_token_drift_check():
    root = Path(__file__).resolve().parents[1] / 'frontend' / 'src'
    tokens = dict(re.findall(r"(\w+):\s*['\"]([#a-fA-F0-9]+)['\"]", (root / 'tokens.ts').read_text(encoding='utf-8')))
    css = dict(re.findall(r'--([\w-]+):\s*(#[a-fA-F0-9]+)', (root / 'index.css').read_text(encoding='utf-8')))
    def normalize(value):
        value = value.lower()
        return '#' + ''.join(ch * 2 for ch in value[1:]) if len(value) == 4 else value
    assert tokens
    for name, value in tokens.items():
        assert name in css, f'No CSS custom property for {name}'
        assert normalize(value) == normalize(css[name]), f'Palette drift for {name}'
    assert 'palette' in (root / 'workspace' / 'Charts.tsx').read_text(encoding='utf-8')
