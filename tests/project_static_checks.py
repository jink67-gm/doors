"""Validate paths and model wiring; not a replacement for WebGL play testing."""
from pathlib import Path
import re, subprocess
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text(encoding='utf-8')
gallery=(root/'monster_gallery.html').read_text(encoding='utf-8')
model=(root/'assets/js/monster-models-v2.js').read_text(encoding='utf-8')
for src in ['assets/js/audio-manager.js','assets/js/procedural-props.js','assets/js/monster-models-v2.js']:
    assert f'src="{src}"' in html,src
    assert (root/src).is_file(),src
for name in ['rush','screech','dupe','ambush','seek','figure','jack','hide']:
    assert f"MathDoorsMonsters.create('{name}')" in html, name
    assert f"'{name}'" in model or f"{name}:" in model, name
for pat in ['build3DRushMonster','build3DScreechMonster','build3DDupeMonster','build3DAmbushMonster','build3DSeekMonster','build3DFigureMonster','build3DJackMonster','build3DHideMonster']:
    assert html.count(f'function {pat}(')==1,pat
assert 'MathDoorsMonsters.animate' in html
assert 'MathDoorsMonsters.animate(d.dupeMesh' in html
assert 'MathDoorsMonsters.create(k)' in gallery
bgm=list((root/'assets/audio/bgm').glob('*.mp3'))
sfx=list((root/'assets/audio/sfx').glob('*.mp3'))
assert len(bgm)==9,len(bgm)
assert len(sfx)==56,len(sfx)
js_files=[p for p in (root/'assets/js').glob('*.js')]
for p in js_files:
    subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
for p in [root/'index.html',root/'monster_gallery.html']:
    text=p.read_text(encoding='utf-8')
    for i,m in enumerate(re.finditer(r'<script(?:\s+[^>]*)?>([\s\S]*?)</script>',text)):
        code=m.group(1)
        if code.strip():
            result=subprocess.run(['node','--check'],input=code,text=True,capture_output=True)
            assert result.returncode==0,f'{p.name} script {i}: {result.stderr}'
print('PASS: 8 monster constructors and model animation hookup')
print('PASS: 9 BGM, 56 SFX and correct paths')
print('PASS: game/gallery and all external JS syntax')
