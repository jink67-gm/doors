"""MATH DOORS V5.1 — 학생 피드백 수정 검증 (실제 키보드 조작)
1) 러쉬 경고 중 다음 방으로 도망 → 러쉬가 따라와서 다음 방을 휩쓴다 (안전한 다음 방)
2) 러쉬 경고 중 다음 방에 숨을 곳이 없으면(도서관) → 문 앞에서 막힘
3) 앰부쉬: 옷장에 계속 있으면 쉬는 시간에 하이드가 밀어냄(피해 없음) → 다시 숨어서 생존
4) 듀프: 생명 1에서 가짜 문 → 사망 / 생명 2에서 두 번 → 사망
"""
import asyncio, sys, json, math
sys.path.insert(0, '/home/claude/v5/tests/e2e')
from harness import Game, launch
from agent import hide_until_safe, walk_safe

RESULTS = []
def record(name, ok, detail=''):
    RESULTS.append((name, ok, detail)); print(('PASS ' if ok else 'FAIL ') + name + (' — ' + detail if detail else ''), flush=True)

async def begin(g, pg, seed, door, hearts=3, diff='normal'):
    await g.ev(f"startGame({{seed:{seed}, maxDoors:10, door:{door}, units:[1,2,3,4,5,6], difficulty:'{diff}', hearts:{hearts}}})")
    await pg.wait_for_timeout(300); await g.hook_hits()

async def wait_for(g, pg, fn, n=250, step=100):
    for _ in range(n):
        st = await g.state()
        if fn(st): return st
        await pg.wait_for_timeout(step)
    return None

async def rush_carry(g, pg):
    await begin(g, pg, 11, 3)
    # 예약된 러쉬를 잠시 보류하고 출구 앞까지 간 다음, 같은 러쉬 이벤트를 출구 앞에서 발생시킨다
    await g.ev("() => { clearTimeout(rushSpawnTimerId); clearTimeout(screechSpawnTimerId); markRoomSolved(activeRooms[3]); }")
    t = await g.targets()
    await walk_safe(g, t['door']['x'], t['door']['d'] - 1.6, g.log, tol=0.6)
    await g.ev("triggerRushEvent()")
    st = await wait_for(g, pg, lambda s: s['rush']['warning'])
    record('carry: rush warning starts in DOOR 3', st is not None)
    await g.walk_to(t['door']['x'], t['door']['d'] + 2.5, tol=0.8, timeout=8, crouch=False)
    st = await wait_for(g, pg, lambda s: s['door'] == 4, n=40)
    record('carry: escaped into DOOR 4 during the warning', st is not None)
    st = await g.state()
    record('carry: rush still coming after entering the next room', st['rush']['warning'] or st['rush']['active'], str(st['rush']))
    swept = await g.ev("""() => new Promise(res => { let seen = false; const t0 = performance.now(); (function f(){ const r = activeRooms[4];
        if (rushState.active && rushState.phase === 'SWEEPING' && rushState.z < r.zStart - 2 && rushState.z > r.zEnd) seen = true;
        if (seen || performance.now() - t0 > 15000) res(seen); else requestAnimationFrame(f); })(); })""")
    record('carry: rush sweeps through DOOR 4 (the room the player fled to)', swept)

async def rush_block(g, pg):
    await begin(g, pg, 4, 4)
    await g.ev("markRoomSolved(activeRooms[4])")
    st = await wait_for(g, pg, lambda s: s['rush']['warning'])
    t = await g.targets()
    await g.walk_to(t['door']['x'], t['door']['d'] + 2.5, tol=0.8, timeout=6, crouch=False)
    st = await g.state()
    record('block: next room is the library (no closets) → door blocks during rush warning', st['door'] == 4 and (st['rush']['warning'] or st['rush']['active']), f"door={st['door']} rush={st['rush']}")
    h0 = st['hearts']
    ok = await hide_until_safe(g, g.log)
    st = await g.state()
    record('block: player stays in DOOR 4 and survives the rush there (hid after being blocked)', ok and st['playing'] and st['door'] == 4, f"hearts {h0}→{st['hearts']}")
    await walk_safe(g, t['door']['x'], t['door']['d'] - 1.0, g.log, tol=0.6)
    await g.walk_to(t['door']['x'], t['door']['d'] + 2.5, tol=0.8, timeout=8, crouch=False)
    st = await wait_for(g, pg, lambda s: s['door'] == 5, n=40)
    record('block: after the rush the door lets the player through', st is not None)

async def ambush_hide(g, pg):
    await begin(g, pg, 2, 4)
    await g.ev("() => { clearTimeout(ambushSpawnTimerId); clearTimeout(screechSpawnTimerId); }")
    t = await g.targets(); pl = (await g.state())['player']
    c = min(t['closets'], key=lambda c: math.hypot(c['x'] - pl['x'], c['d'] - pl['d']))
    await walk_safe(g, c['x'], c['d'], g.log, tol=0.9)   # 옷장 앞에서 대기 → 경고가 들리면 숨는다
    await g.ev("triggerAmbushEvent()")
    st = await wait_for(g, pg, lambda s: s['ambush']['warning'] or s['ambush']['active'], n=400)
    record('ambush: event starts in DOOR 4', st is not None)
    await g.key('KeyE')
    h0 = st['hearts']; ejected = 0; hide_seen = False; rehid = 0
    for i in range(900):
        st = await g.state()
        if st['ui']['emergency']: await g.answer_choice_modal('emergency', True)
        if await g.ev("hideMonster3D && hideMonster3D.visible && ambushState.active"): hide_seen = True
        if st['closet'] == 'NONE' and st['ambush']['active'] and not st['ui']['emergency']:
            ejected += 1
            pl = st['player']; c = min(t['closets'], key=lambda c: math.hypot(c['x'] - pl['x'], c['d'] - pl['d']))
            await g.walk_to(c['x'], c['d'], tol=0.9, timeout=6); await g.key('KeyE'); await pg.wait_for_timeout(700)
            if (await g.state())['closet'] != 'NONE': rehid += 1
        if not st['ambush']['active'] and not st['ambush']['warning']: break
        await pg.wait_for_timeout(120)
    st = await g.state(); hits = await g.ev('window.__hits')
    record('ambush: Hide appears during the pause between passes', hide_seen)
    record('ambush: Hide pushes the player out during a pause (forces exit → re-hide)', ejected >= 1 and rehid >= 1, f'ejected={ejected} rehid={rehid}')
    record('ambush: eject itself does no damage, re-hiding survives the whole ambush', st['playing'] and st['hearts'] == h0 and not any('하이드' in h['title'] for h in hits), f"hearts {h0}→{st['hearts']} hits={[h['title'] for h in hits]}")

async def dupe_door(g, pg, hearts):
    await begin(g, pg, 2, 6, hearts=hearts)
    t = await g.targets()
    if t['terminal']:
        await walk_safe(g, t['terminal']['x'], t['terminal']['d'], g.log, tol=0.6)
        await g.key('KeyE'); await pg.wait_for_timeout(400)
        if (await g.state())['ui']['puzzle']: await g.solve_open_puzzle(True)
        await pg.wait_for_timeout(600)
    t = await g.targets()
    wrongs = [d for d in t['dupe'] if not d['correct']]
    for i in range(hearts):
        w = wrongs[i]
        await walk_safe(g, w['x'], w['d'], g.log, tol=0.5)
        await g.key('KeyE'); await pg.wait_for_timeout(2600)
    st = await g.state()
    return st

async def main():
    p, b, ctx, pg = await launch()
    g = Game(pg, lambda m: print(m, flush=True))
    await rush_carry(g, pg)
    await rush_block(g, pg)
    await ambush_hide(g, pg)
    st = await dupe_door(g, pg, 1)
    record('dupe: 1 heart + wrong dupe door → game over', not st['playing'] and st['hearts'] == 0, f"playing={st['playing']} hearts={st['hearts']}")
    st = await dupe_door(g, pg, 2)
    record('dupe: 2 hearts + two wrong dupe doors → game over', not st['playing'] and st['hearts'] == 0, f"playing={st['playing']} hearts={st['hearts']}")
    record('v5.1: no page errors', not g.errors, '; '.join(g.errors[:3]))
    print('SUMMARY', sum(1 for r in RESULTS if r[1]), '/', len(RESULTS))
    json.dump(RESULTS, open('/home/claude/scenario_results_v51.json', 'w'), ensure_ascii=False, indent=1)
    await b.close(); await p.stop()

asyncio.run(main())
