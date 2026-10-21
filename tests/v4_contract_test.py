"""V4 static regressions. Run: python tests/v4_contract_test.py"""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
s=(root/'index.html').read_text()
a=(root/'assets/js/audio-manager.js').read_text()
checks={
'bookshelves grounded': 'shelf.position.set(sx, 0, zStart - roomLen * fraction)' in s,
'library double-size': 'library: { w: 30.0, len: 62.0 }' in s,
'long seek chase': 'seekCorridor: { w: 17.0, len: 94.0 }' in s,
'bridge excludes wardrobes': 'if (!isBridgeChasmRoom) {' in s,
'bridge excludes rush': 'if (!curRoom || curRoom.isBridgeChasmRoom' in s,
'bridge excludes ambush': 'activeRooms[currentDoor]?.isBridgeChasmRoom' in s,
'key-bridge collision prevented': "roomArch === 'keySearch' || roomArch === 'library'" in s,
'closet safely nullable': 'closetObj: closets[0] || null' in s,
'figure heartbeat math': 'function openFigureHeartQuiz()' in s and 'function resolveFigureHeartQuiz(correct)' in s,
'heartbeat audio available': '"figureHeartbeat": "ambient_heartbeat"' in a,
'creaky floor hazards': 'figureNoiseZones.push' in s,
'dupe wrong door recoverable': 'nonlethal: true' in s,
'11 hazard hallway details': 'for (let i = 1; i <= 11; i++)' in s,
}
for n,result in checks.items():
 print(('PASS' if result else 'FAIL'),n)
assert all(checks.values())
assert len(list((root/'assets/audio/bgm').glob('*.mp3')))==9
assert len(list((root/'assets/audio/sfx').glob('*.mp3')))==56
print('PASS audio asset counts 9 BGM + 56 SFX')
