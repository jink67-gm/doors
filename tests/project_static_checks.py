"""MATH DOORS V5 — 파일 경로·스크립트 구문·오디오 연결 정적 검사 (WebGL 플레이 테스트를 대신하지 않음)."""
from pathlib import Path
import re, subprocess, json
root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
# 1) local scripts / css exist and are referenced (no CDN dependency for core runtime)
for src in ['assets/vendor/three.min.js', 'assets/js/audio-manager.js', 'assets/js/procedural-props.js', 'assets/js/monster-models-v2.js', 'assets/js/v5-core.js', 'assets/js/math-bank-v5.js']:
    assert f'src="{src}"' in html, src
    assert (root / src).is_file(), src
assert 'href="assets/css/tailwind.css"' in html and (root / 'assets/css/tailwind.css').stat().st_size > 10000
assert 'cdn.tailwindcss.com' not in html, 'tailwind runtime CDN should not be required'
# script order: three -> props/models -> core -> bank -> inline game
order = [html.index(x) for x in ['assets/vendor/three.min.js', 'procedural-props.js', 'v5-core.js', 'math-bank-v5.js', 'window.MathDoorsDebug']]
assert order == sorted(order), 'script order'
# 2) 8 monster constructors still wired
for name in ['rush', 'screech', 'dupe', 'ambush', 'seek', 'figure', 'jack', 'hide']:
    assert f"MathDoorsMonsters.create('{name}')" in html, name
# 3) audio: every playSfx key used in the game exists in the manager, every mapped file exists
am = (root / 'assets/js/audio-manager.js').read_text(encoding='utf-8')
effects = dict(re.findall(r'"(\w+)":\s*"(\w+)"', am.split('const EFFECTS')[1].split('};')[0]))
tracks = dict(re.findall(r'"(\w+)":\s*"(\w+)"', am.split('const TRACKS')[1].split('};')[0]))
used = set(re.findall(r"playSfx\('(\w+)'", html))
missing = sorted(u for u in used if u not in effects)
assert not missing, f'playSfx keys without audio file mapping: {missing}'
for k, f in effects.items(): assert (root / f'assets/audio/sfx/{f}.mp3').is_file(), f
for k, f in tracks.items(): assert (root / f'assets/audio/bgm/{f}.mp3').is_file(), f
scenes = set(re.findall(r"setBgmMode\('(\w+)'\)", html)) | {'darkRoom', 'dupe', 'explore', 'figure', 'seek'}
assert all(s in tracks for s in scenes), [s for s in scenes if s not in tracks]
assert len(list((root / 'assets/audio/bgm').glob('*.mp3'))) == 9
assert len(list((root / 'assets/audio/sfx').glob('*.mp3'))) == 56
# 4) syntax of every script
for p in (root / 'assets/js').glob('*.js'):
    subprocess.run(['node', '--check', str(p)], check=True, capture_output=True)
for p in [root / 'index.html', root / 'monster_gallery.html', root / '3d_asset_gallery.html']:
    text = p.read_text(encoding='utf-8')
    for i, m in enumerate(re.finditer(r'<script(?:\s+[^>]*)?>([\s\S]*?)</script>', text)):
        code = m.group(1)
        if code.strip():
            r = subprocess.run(['node', '--check', '--input-type=commonjs'], input=code, text=True, capture_output=True)
            assert r.returncode == 0, f'{p.name} script {i}: {r.stderr}'
# 5) removed legacy bank must not come back
for legacy in ['INTERACTIVE_MATH_BANK', 'ProblemDeckManager', 'DEFENSE_MATH_BANK']:
    assert legacy not in html, legacy
print('PASS: local runtime files, script order, 8 monsters, audio mappings (%d sfx keys used), syntax' % len(used))
