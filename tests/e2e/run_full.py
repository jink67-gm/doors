import asyncio, sys, json, time
sys.path.insert(0, '/home/claude/v5/tests/e2e')
from harness import Game, launch
from agent import play_room

async def main(doors=10, seed=4242, units=(1,2,3,4,5,6), diff='easy', wrong_first=False, maxrooms=None, out=None, start=1):
    p, b, ctx, pg = await launch()
    logs = []
    def log(m): logs.append(m); print(m, flush=True)
    g = Game(pg, log)
    g.verbose = True
    if start > 1:
        # 체크포인트 복원 경로로 해당 문에서 시작 (이전 방들은 같은 시드로 재계산)
        await g.ev(f"startGame({{seed:{seed}, maxDoors:{doors}, door:{start}, units:{list(units)}, difficulty:'{diff}', hearts:3}})")
        await pg.wait_for_timeout(500); await g.hook_hits()
    else:
        await g.start(doors=doors, diff=diff, units=units, seed=seed)
    t0 = time.time(); n = 0
    while True:
        st = await g.state()
        if not st['playing']: break
        ok = await play_room(g, log, wrong_first=wrong_first)
        n += 1
        if not ok:
            log('  !! room not cleared'); break
        if maxrooms and n >= maxrooms: break
    res = await g.ev("({title: document.getElementById('result-title').innerText, visible: !document.getElementById('result-screen').classList.contains('hidden')})")
    st = await g.state()
    log('HITS ' + json.dumps(await g.ev('window.__hits'), ensure_ascii=False))
    log(f'RESULT {res} door={st["door"]} hearts={st["hearts"]} time={time.time()-t0:.0f}s errors={g.errors[:5]}')
    if out: await pg.screenshot(path=out)
    await b.close(); await p.stop()
    return res, logs, g.errors

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--doors', type=int, default=10); ap.add_argument('--seed', type=int, default=4242)
    ap.add_argument('--units', default='1,2,3,4,5,6'); ap.add_argument('--diff', default='easy')
    ap.add_argument('--wrong', action='store_true'); ap.add_argument('--max', type=int, default=0)
    ap.add_argument('--out', default=None); ap.add_argument('--start', type=int, default=1)
    a = ap.parse_args()
    asyncio.run(main(doors=a.doors, seed=a.seed, units=tuple(int(x) for x in a.units.split(',')), diff=a.diff, wrong_first=a.wrong, maxrooms=a.max or None, out=a.out, start=a.start))
