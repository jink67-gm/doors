"""한 방씩 실제 조작으로 진행하는 자동 플레이어."""
import math

async def hide_until_safe(g, log):
    t = await g.targets(); st = await g.state()
    p = st['player']
    if not t['closets']:
        log('    (no closet!)'); return False
    c = min(t['closets'], key=lambda c: math.hypot(c['x'] - p['x'], c['d'] - p['d']))
    await g.walk_to(c['x'], c['d'], tol=0.9, timeout=12)
    await g.key('KeyE'); await g.pg.wait_for_timeout(900)
    st = await g.state()
    log(f"    hide: closet={st['closet']} rush={st['rush']} ambush={st['ambush']}")
    for _ in range(400):
        st = await g.state()
        if st['ui']['emergency']:
            await g.answer_choice_modal('emergency', True); log('    latch quiz answered')
        if st['ui']['heartbeat']:
            await g.answer_choice_modal('heartbeat', True); log('    heartbeat answered')
        if not (st['rush']['warning'] or st['rush']['active'] or st['ambush']['warning'] or st['ambush']['active'] or st['figure']['hunt'] or (st['figure']['active'] and st['figure']['mode'] == 'chase')):
            break
        if st['closet'] == 'NONE' and not st['ui']['emergency']:
            if st['ambush']['active']:
                # 앰부쉬 쉬는 시간에 하이드가 밀어냄 → 다시 숨는다
                pl = st['player']; c = min(t['closets'], key=lambda c: math.hypot(c['x'] - pl['x'], c['d'] - pl['d']))
                await g.walk_to(c['x'], c['d'], tol=0.9, timeout=6); await g.key('KeyE'); await g.pg.wait_for_timeout(700)
                log('    re-hid after Hide ejected during ambush pause'); continue
            break
        await g.pg.wait_for_timeout(150)
    await g.pg.wait_for_timeout(500)
    st = await g.state()
    if st['closet'] == 'HIDDEN':
        await g.key('KeyE'); await g.pg.wait_for_timeout(900)
    return True

async def banish_screech(g, log):
    st = await g.state()
    if not st['flashlight']: await g.key('KeyF'); await g.pg.wait_for_timeout(100)
    for i in range(80):
        st = await g.state()
        if not st['screech']['active']: log('    👁️ screech banished'); return True
        s = st['screech']; p = st['player']
        yaw = math.atan2(-(s['x'] - p['wx']), -(s['z'] - p['wz']))
        dy = s['y'] - 1.7; dist = math.hypot(s['x'] - p['wx'], s['z'] - p['wz'])
        pitch = math.atan2(dy, dist)
        wob = 0.22 if i % 2 else -0.22
        await g.ev(f"() => {{ player.yaw = player.targetYaw = {yaw + wob}; player.pitch = player.targetPitch = {pitch}; }}")
        await g.pg.wait_for_timeout(110)
    return False

async def danger_check(g):
    async def f(st):
        if st['screech']['active']: return True
        if st['figure']['active'] and st['figure']['x'] is not None and st['player']:
            fd = math.hypot(st['figure']['x'] - st['player']['x'], st['figure']['d'] - st['player']['d'])
            if st['figure']['mode'] == 'chase' and fd < 9: return True
            if st['figure']['mode'] in ('patrol', 'investigate', 'search') and fd < 5.5: return True
        return st['rush']['warning'] or st['ambush']['warning'] or st['ui']['emergency'] or st['ui']['heartbeat']
    return f

async def walk_safe(g, x, d, log, **kw):
    for attempt in range(6):
        r = await g.walk_to(x, d, stop_on=await danger_check(g), **kw)
        st = await g.state()
        if g.verbose: log(f'      walk→({x:.1f},{d:.1f}) r={r} at ({st["player"]["x"]:.2f},{st["player"]["d"]:.2f}) door={st["door"]} w={await g.ev("keys.w")} ui={[k for k,v in st["ui"].items() if v]}')
        if r is True: return True
        if r == 'door': return 'door'
        st = await g.state()
        if not st['playing']: return False
        if st['rush']['warning'] or st['ambush']['warning']:
            log('    ⚡ warning → hiding'); await hide_until_safe(g, log); continue
        if st['figure']['active'] and st['figure']['mode'] == 'chase':
            log('    🩸 figure chasing → hiding'); await hide_until_safe(g, log); continue
        if st['screech']['active']:
            await banish_screech(g, log); continue
        if st['figure']['active'] and st['figure']['mode'] != 'chase':
            # 스텔스: 피규어가 가까우면 멈춰서 기다린다 (정지 = 소음 0)
            for _ in range(60):
                s2 = await g.state()
                if s2['figure']['mode'] == 'chase' or not s2['playing']: break
                if math.hypot(s2['figure']['x'] - s2['player']['x'], s2['figure']['d'] - s2['player']['d']) > 7.5: break
                await g.pg.wait_for_timeout(150)
            continue
        if st['ui']['heartbeat']:
            await g.answer_choice_modal('heartbeat', True); continue
        if st['ui']['emergency']:
            await g.answer_choice_modal('emergency', True); continue
        if st['closet'] != 'NONE':
            await g.pg.wait_for_timeout(1200)
            st = await g.state()
            if st['closet'] == 'HIDDEN': await g.key('KeyE'); await g.pg.wait_for_timeout(900)
            continue
        if any(st['ui'][k] for k in ('puzzle',)):
            await g.pg.click('text=✕ 닫기'); continue
        if r is False and attempt >= 2: return False
    return False

async def play_room(g, log, wrong_first=False):
    st = await g.state(); t = await g.targets()
    room = st['room']; door = st['door']
    log(f"DOOR {door} {room['arch']} type={room['problemType']} device={room['device']} events={room['events']} hearts={st['hearts']}")
    if room['arch'] == 'seek':
        gate = t['gate']
        if wrong_first and gate:
            await g.walk_to(gate['wrongX'], gate['d'] - 1.0, tol=0.6, timeout=25)
            await g.walk_to(gate['wrongX'], gate['d'] - 0.5, tol=0.3, timeout=2)
            log('    tried wrong gate door')
        # path planned as if gate open (door opens when we get close)
        for attempt in range(8):
            r = await g.walk_to(gate['correctX'], gate['d'] - 1.0, tol=0.7, timeout=30) if gate else True
            if r is True: break
        for attempt in range(10):
            path_ok = await g.ev('() => !!MathDoorsDebug.pathLocal(MathDoorsDebug.targets().exit.x, MathDoorsDebug.targets().exit.d)')
            st = await g.state()
            if st['door'] != door or not st['playing']: break
            r = await g.walk_to(t['exit']['x'], t['exit']['d'], tol=0.5, timeout=40)
            st = await g.state()
            if st['door'] != door or not st['playing']: break
        st = await g.state()
        return st['door'] != door
    if room['arch'] == 'library':
        await g.set_crouch(True)
    if room.get('keyUnlocked') is False:
        for i, dr in enumerate(t['drawers']):
            await walk_safe(g, dr['x'], dr['d'], log, tol=0.6, crouch=(True if room['arch']=='library' else 'auto'))
            await g.key('KeyE'); await g.pg.wait_for_timeout(350); await g.key('KeyE'); await g.pg.wait_for_timeout(350)
            st = await g.state()
            if st['keys'] > 0: log(f'    key found in drawer {i}'); break
    if t['terminal']:
        ok = await walk_safe(g, t['terminal']['x'], t['terminal']['d'], log, tol=0.6, crouch=(True if room['arch']=='library' else 'auto'))
        for attempt in range(5):
            st = await g.state()
            if st['room']['solved']: break
            await g.key('KeyE'); await g.pg.wait_for_timeout(400)
            st = await g.state()
            if st['ui']['puzzle']:
                if wrong_first and attempt == 0 and room['problemType'] != 'typeE_dupe':
                    tp = await g.solve_open_puzzle(False); log(f'    answered WRONG ({tp}) hearts→{(await g.state())["hearts"]}')
                    await g.pg.wait_for_timeout(1800)
                    await walk_safe(g, t['terminal']['x'], t['terminal']['d'], log, tol=0.6)
                    continue
                tp = await g.solve_open_puzzle(True)
                log(f'    solved {tp}')
                if tp == 'typeE_dupe': break
            else:
                await walk_safe(g, t['terminal']['x'], t['terminal']['d'], log, tol=0.6)
    if t['dupe']:
        if wrong_first:
            wrong = [d for d in t['dupe'] if not d['correct']][0]
            await walk_safe(g, wrong['x'], wrong['d'], log, tol=0.5)
            h0 = (await g.state())['hearts']
            await g.key('KeyE'); await g.pg.wait_for_timeout(2500)
            st = await g.state(); log(f'    opened WRONG dupe door: hearts {h0}→{st["hearts"]}, playing={st["playing"]}')
        cor = [d for d in t['dupe'] if d['correct']][0]
        await walk_safe(g, cor['x'], cor['d'], log, tol=0.5)
        await g.key('KeyE'); await g.pg.wait_for_timeout(500)
    # wait for unlocked/bridge
    for _ in range(60):
        st = await g.state()
        if st['room']['unlocked'] and st['room']['bridged'] and st['room']['deviceDone']: break
        await g.pg.wait_for_timeout(150)
    st = await g.state()
    if not st['room']['unlocked']:
        # standard door: press E at door
        await walk_safe(g, t['door']['x'], t['door']['d'], log, tol=0.6)
        await g.key('KeyE'); await g.pg.wait_for_timeout(600)
    for attempt in range(6):
        await walk_safe(g, t['exit']['x'], t['exit']['d'], log, tol=0.5, crouch=(True if room['arch']=='library' else 'auto'))
        st = await g.state()
        if st['door'] != door or not st['playing']: break
    st = await g.state()
    return st['door'] != door or not st['playing']
