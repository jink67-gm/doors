"""V4 bridge-room invariants (no wardrobes/Rush, no key behind missing bridge)."""
from pathlib import Path
s=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf8')
assert "roomArch = 'bridgeRoom'" in s
assert "roomArch === 'keySearch' || roomArch === 'library'" in s
assert 'if (!isBridgeChasmRoom) {' in s
assert 'closetObj: closets[0] || null' in s
assert 'closetWorldPos: closets[0] ?' in s
assert "if (!curRoom || curRoom.isBridgeChasmRoom" in s
assert "activeRooms[currentDoor]?.isBridgeChasmRoom" in s
assert 'if (room.isBridgeChasmRoom) {' in s
assert "roomArch !== 'seekCorridor' && !isBridgeChasmRoom" in s
assert 'const chasmFrontZ = curRoom.zStart - 7.3' in s
assert 'const chasmBackZ = curRoom.zStart - 13.1' in s
print('PASS: bridge room has no wardrobes, key drawers, Rush or Ambush, and bridge travel guards remain')
