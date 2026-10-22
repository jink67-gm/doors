/* MATH DOORS — original audio asset playback manager
   Generated for the user's existing 3D HTML game. No JS frameworks required.
   Music uses cross-faded HTMLAudioElement loops; effects use overlapping HTMLAudioElement voices.
*/
(function(){
'use strict';
const TRACKS = {
  "lobby": "01_title_lobby",
  "explore": "02_hotel_exploration",
  "puzzle": "03_math_puzzle",
  "darkRoom": "04_blackout_darkroom",
  "rush": "05_rush_ambush_tension",
  "closet": "05_rush_ambush_tension",
  "ambush": "05_rush_ambush_tension",
  "seek": "06_seek_chase",
  "figure": "07_figure_library",
  "dupe": "08_dupe_secretrooms",
  "safe": "09_safe_recovery"
};
const EFFECTS = {
  "step": "footstep_carpet",
  "crouchStep": "footstep_carpet",
  "key": "keypad_press",
  "itemPickup": "item_pickup",
  "drawerOpen": "drawer_pull_open",
  "drawerClose": "drawer_push_close",
  "unlock": "door_unlock_magic",
  "mechanism": "puzzle_device_activate",
  "closetOpen": "closet_wood_open",
  "closetClose": "closet_wood_close",
  "closetRattle": "hide_closet_knocks",
  "closetCreakSlow": "closet_slow_handle",
  "doorSlam": "door_heavy_slam",
  "doorOpen": "door_wood_creak_open",
  "flicker": "light_flicker",
  "rushDistant": "rush_light_warning",
  "rushApproach": "rush_fast_approach",
  "rushPass": "rush_corridor_pass",
  "rushReturn": "rush_return_growl",
  "rushAttack": "rush_attack_shriek",
  "ambushWarn": "ambush_glitch_warning",
  "ambushPass": "ambush_bypass",
  "ambushReturn": "ambush_turn_back",
  "psst": "screech_corner_whisper",
  "screechGiggle": "screech_airy_giggle",
  "screechWince": "screech_spotted_hiss",
  "screechBanish": "screech_light_repel",
  "screechAttack": "screech_attack_scream",
  "figureStep": "figure_step",
  "figureGrowl": "figure_breath_growl",
  "figureAlert": "figure_alert_roar",
  "jackStartle": "jack_jumpscare_sting",
  "jackLaugh": "jack_creepy_laugh",
  "hideKnock": "hide_closet_knocks",
  "hideEject": "hide_force_eject",
  "hitImpact": "player_hit_dizzy",
  "playerRecover": "player_breath_recover",
  "win": "puzzle_correct",
  "puzzleCorrect": "puzzle_correct",
  "puzzleWrong": "puzzle_wrong",
  "batteryWarning": "battery_warning",
  "flashlightOn": "flashlight_on",
  "flashlightOff": "flashlight_off",
  "keyPickup": "key_pickup",
  "dupeDistortion": "dupe_door_distortion",
  "dupeAttack": "dupe_lunge_attack",
  "seekRoar": "seek_chase_roar",
  "seekEmerge": "seek_emerge",
  "bridge": "bridge_deploy",
  "doorLocked": "door_rattle_locked",
  "heartbeat": "ambient_heartbeat",
  "pipeKnock": "ambient_pipe_knock",
  "hotelWhisper": "ambient_hotel_whisper",
  "breath": "player_breath_recover"
};
const BASE = 'assets/audio/';
const limits = {step:130,crouchStep:170,key:55,figureStep:220,hideKnock:900,psst:1500,rushDistant:1300,ambushWarn:1300,heartbeat:300,doorLocked:600,figureAlert:900};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
function readSettings(){
 try {const v=JSON.parse(localStorage.getItem('mathDoorsAudioSettings_v1')||'{}');
 return {bgm:clamp(v.bgm??0.38),sfx:clamp(v.sfx??0.75),muted:!!v.muted};}
 catch(_){return {bgm:0.38,sfx:0.75,muted:false};}
}
class SoundManager{
 constructor(){
  this.settings=readSettings(); this.mode=null;this.track=null;this.fading=[];
  this.effects=new Set();this.lastEffect=new Map();this.pausedForVisibility=false;
  this.available=true;this.ready=false;this.unlocked=false;
  this._onPageHidden=()=>{
   if(document.hidden){this.pausedForVisibility=true;for(const t of this.fading)t.el.pause();if(this.track)this.track.el.pause();}
   else if(this.pausedForVisibility){this.pausedForVisibility=false;if(!this.settings.muted && this.track)this.track.el.play().catch(()=>{});}
  };
  document.addEventListener('visibilitychange',this._onPageHidden);
 }
 save(){try{localStorage.setItem('mathDoorsAudioSettings_v1',JSON.stringify(this.settings));}catch(_){} }
 applyVolume(){
  if(this.track)this.track.el.volume=clamp(this.track.gain*this.settings.bgm*(this.settings.muted?0:1));
  for(const t of this.fading)t.el.volume=clamp(t.gain*this.settings.bgm*(this.settings.muted?0:1));
  for(const fx of this.effects)fx.el.volume=clamp(fx.gain*this.settings.sfx*(this.settings.muted?0:1));
 }
 setVolume(kind,value){if(kind!=='bgm'&&kind!=='sfx')return;this.settings[kind]=clamp(value);this.save();this.applyVolume();this.refreshControls();}
 setMuted(value){this.settings.muted=!!value;this.save();this.applyVolume();if(!this.settings.muted)this.unlock();this.refreshControls();}
 unlock(){
  this.unlocked=true;
  if(this.track && !this.settings.muted && !document.hidden)this.track.el.play().catch(()=>{});
 }
 init(){this.ready=true;this.refreshControls();}
 refreshControls(){
  const m=document.getElementById('audio-muted-checkbox');if(m)m.checked=this.settings.muted;
  for(const kind of ['bgm','sfx']){
   const s=document.getElementById('audio-'+kind+'-volume');
   const txt=document.getElementById('audio-'+kind+'-value');
   const val=Math.round(this.settings[kind]*100);
   if(s)s.value=val;if(txt)txt.textContent=val+'%';
  }
  const l=document.getElementById('lobby-sound-btn');if(l)l.textContent=this.settings.muted?'🔇 소리 OFF':'🔊 소리 ON';
  const h=document.getElementById('hud-sound-btn');if(h)h.textContent=this.settings.muted?'🔇':'🔊';
 }
 setScene(mode){
  this.mode=mode;
  const trackName=TRACKS[mode]||TRACKS.explore;
  if(this.track && this.track.name===trackName){this.unlock();return;}
  const url=BASE+'bgm/'+trackName+'.mp3';
  const el=new Audio(url); el.loop=true;el.preload='auto'; el.volume=0;
  const next={el,name:trackName,gain:0};
  const prev=this.track;this.track=next;
  if(prev){this.fading.push(prev);}
  if(!this.settings.muted && !document.hidden && this.unlocked)el.play().catch(()=>{});
  const start=performance.now(),dur=850;
  const tick=(now)=>{
   const r=clamp((now-start)/dur);
   if(this.track!==next){el.pause();el.src='';return;}
   next.gain=r;
   if(prev)prev.gain=1-r;
   this.applyVolume();
   if(r<1)requestAnimationFrame(tick);
   else if(prev){prev.el.pause();prev.el.removeAttribute('src');prev.el.load();this.fading=this.fading.filter(x=>x!==prev);}
  };
  requestAnimationFrame(tick);
 }
 playSfx(type, volume=1){
  if(this.settings.muted || document.hidden || !this.unlocked)return;
  const name=EFFECTS[type];if(!name)return;
  const now=performance.now(), last=this.lastEffect.get(type)||-1e9;
  if(now-last < (limits[type]||65))return;
  this.lastEffect.set(type,now);
  if(this.effects.size>=18){const first=this.effects.values().next().value;first?.el.pause();first?.el.removeAttribute('src');this.effects.delete(first);}
  const el=new Audio(BASE+'sfx/'+name+'.mp3');el.preload='auto';
  const gain=clamp(volume,0,1.3)*(type==='step'?0.45:type==='crouchStep'?0.26:1);
  const fx={el,gain};this.effects.add(fx);
  el.volume=clamp(gain*this.settings.sfx);
  const clean=()=>{this.effects.delete(fx);el.removeAttribute('src');};
  el.addEventListener('ended',clean,{once:true});el.addEventListener('error',clean,{once:true});
  el.play().catch(clean);
 }
 stopEffects(){for(const v of this.effects){v.el.pause();v.el.removeAttribute('src');}this.effects.clear();}
}
window.MathDoorsAudio=new SoundManager();
window.MathDoorsAudio.init();
})();
