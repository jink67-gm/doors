"""Coordinate invariant and static wiring for safe bridge-chasm furniture."""
from pathlib import Path
p=Path(__file__).resolve().parents[1]
s=(p/'index.html').read_text(encoding='utf8')
assert 'const primaryClosetZ = isBridgeChasmRoom ? zStart - 4.35' in s
assert 'const secondaryClosetZ = isBridgeChasmRoom ? zStart - roomLen + 3.8' in s
assert 'const drawerZ = isBridgeChasmRoom ? zStart - 3.15' in s
assert 'c1.worldZ = primaryClosetZ' in s
assert 'c2.worldZ = secondaryClosetZ' in s
zStart=0.0;length=24.0; chasm_near=-7.3;chasm_far=-13.1
near=-4.35; far=-length+3.8;drawer=-3.15
assert near>chasm_near+1.5,(near,chasm_near)
assert far<chasm_far-1.5,(far,chasm_far)
assert drawer>chasm_near+2
print('PASS: wardrobe & drawer positions on solid floor, separated from the bridge gap')
