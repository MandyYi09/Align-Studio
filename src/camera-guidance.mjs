import {t, getLanguage} from './i18n.mjs';
import {requiredLandmarks, isSidePose} from './tracking-view.mjs';

export const guidanceMessages = {
 permission: ['◉', 'Allow camera access', 'Choose Allow in your browser to start.'],
 loading: ['◌', 'Preparing tracking…', 'Loading the pose model. The first visit may take a moment.'],
 slow: ['↻', 'Still loading…', 'Check your connection. The pose model needs to download before tracking can start.'],
 searching: ['◎', 'Step into the frame', 'Start about 2–3 m away, then adjust until your whole body fits.'],
 back: ['↔', 'Step back a little', 'Leave space around your hands and feet. Keep your whole body inside the frame.'],
 closer: ['→ ←', 'Move a little closer', 'Your body is too small in the frame. Take one small step towards the camera.'],
 visible: ['◐', 'Make your joints visible', 'Keep hands and feet visible. Add light in front of you and avoid overlapping limbs.'],
 angle: ['↶', 'Adjust your camera angle', 'Some limbs overlap. Reposition the camera slightly so the joints are visible.'],
 settling: ['◷', 'Hold there…', 'Your body is visible. Keep your position briefly while tracking settles.'],
 adjusting: ['↗', 'In view · adjust your pose', 'Follow the movement guide. The hold starts once your alignment matches.'],
 holding: ['◷', 'Hold this position', 'Keep your alignment steady for three seconds.'],
 confirmed: ['✓', 'Hold confirmed', 'Keep breathing. Rest when ready; hide these cues whenever you choose.'],
 ready: ['✓', 'Hold complete', 'Rest when you’re ready.'],
 stalled: ['↻', 'Waiting for camera frames', 'If this continues, stop and restart the camera.'],
 error: ['!', 'Camera needs attention', 'Check the message below, then try again.'],
};

// Distances are framing heuristics, never a metre estimate from a monocular image.
export function framingState(id, p, width, height, comparable) {
 if (!p?.length) return 'searching';
 const required = requiredLandmarks(id, p);
 const points = required.map(i => p[i]);
 const finite = v => v && Number.isFinite(v.x) && Number.isFinite(v.y);
 if (points.some(v => finite(v) && (v.visibility ?? 0) >= .65 && (v.x < .02 || v.x > .98 || v.y < .02 || v.y > .98))) return 'back';
 if (points.some(v => !finite(v) || (v.visibility ?? 0) < .65)) return 'visible';
 const shoulder = [(p[11].x+p[12].x)/2, (p[11].y+p[12].y)/2];
 const hip = [(p[23].x+p[24].x)/2, (p[23].y+p[24].y)/2];
 if (Math.hypot((shoulder[0]-hip[0])*width/height, shoulder[1]-hip[1]) < .08) return 'closer';
 return comparable ? 'ready' : 'angle';
}

// Do not let a single missed frame replace a useful instruction.
export class GuidanceStability {
 constructor() { this.reset(); }
 reset() { this.state = 'searching'; this.pending = null; this.since = 0; }
 update(next, now) {
  if (next !== this.pending) { this.pending = next; this.since = now; }
  const delay = next === 'ready' ? 600 : this.state === 'ready' ? 1500 : 450;
  if (now-this.since >= delay) this.state = next;
  return next === 'ready' && this.state !== 'ready' ? 'settling' : this.state;
 }
}

// A visible body is not a correct pose. No recognition state compacts the cue.
export function guidanceForHold(framing, hold = {phase:'adjusting'}) {
 if(framing !== 'ready')return framing;
 return {adjusting:'adjusting',holding:'holding',confirmed:'confirmed',complete:'confirmed'}[hold.phase] || 'adjusting';
}

export function createCameraGuidance(stage) {
 const panel = document.getElementById('camera-guidance');
 const stability = new GuidanceStability();
 const toggle=document.getElementById('toggle-guidance');
 toggle.onclick=()=>{
  const collapsed=stage.dataset.guidanceCollapsed!=='true';
  stage.dataset.guidanceCollapsed=String(collapsed);
  toggle.textContent=collapsed?'Show cues':'Hide cues';
  toggle.setAttribute('aria-expanded',String(!collapsed));
 };
 let active = false, state = '', voice = false, lastSpeech = -Infinity, spoken = '', pose = '', lastDetail = '';
 let lastDetailAt = -Infinity;
 const synth = window.speechSynthesis;
 window.addEventListener('languagechange', () => { synth?.cancel(); spoken = ''; lastSpeech = -Infinity; });
 const voiceButton = document.getElementById('voice-guidance');
 voiceButton.disabled = !synth || !window.SpeechSynthesisUtterance;
 if (voiceButton.disabled) voiceButton.textContent = 'Voice unavailable';
 function speak(force = false) {
  if (!voice || !active || !state) return;
  const now = performance.now();
  if (!force && (now-lastSpeech < 8000 || spoken === state)) return;
  synth.cancel();
  const message = guidanceMessages[state];
  const utterance = new SpeechSynthesisUtterance(`${t(message[1])}. ${t(message[2])} ${state === 'searching' ? document.getElementById('guidance-angle').textContent : ''}`);
  utterance.lang = getLanguage() === 'zh' ? 'zh-CN' : 'en-US'; utterance.rate = .9;
  synth.speak(utterance); lastSpeech = now; spoken = state;
 }
 voiceButton.onclick = () => {
  voice = !voice;
  voiceButton.setAttribute('aria-pressed', String(voice));
  voiceButton.textContent = voice ? '♪ Voice on' : '♪ Voice off';
  if (voice) speak(true); else synth?.cancel();
 };
 function show(next, id, detail) {
  active = true; panel.hidden = false; toggle.hidden=false;
  stage.dataset.guidance = next;
  const message = guidanceMessages[next];
  if (next !== state || pose !== id || (detail !== lastDetail && performance.now()-lastDetailAt>=650)) {
   lastDetail=detail; lastDetailAt=performance.now();
   state = next; pose = id;
   for(const [id,text] of [['guidance-icon',message[0]],['guidance-title',message[1]],['guidance-copy',detail || message[2]]]){
    const el=document.getElementById(id);if(el.textContent!==text)el.textContent=text;
   }
   document.getElementById('guidance-angle').textContent = isSidePose(id) ? '↶ Turn side-on · Camera low enough to see the whole mat' : '↔ Face the camera · Keep hands and feet in view';
   panel.classList.toggle('side-on', isSidePose(id));
  }
  speak();
 }
 return {
  show,
  update(id, p, w, h, comparable, now, hold, feedback) {
   const next=guidanceForHold(stability.update(framingState(id,p,w,h,comparable),now),hold);
   const detail=next==='adjusting' ? feedback?.text : next==='holding' ? `Keep steady · ${hold.seconds} seconds remaining` : undefined;
   show(next,id,detail);
  },
  reset() { delete stage.dataset.guidanceCollapsed; toggle.textContent='Hide cues'; toggle.setAttribute('aria-expanded','true'); stability.reset(); spoken = ''; lastSpeech = -Infinity; },
  hide() { active = false; state = ''; panel.hidden = true; toggle.hidden=true; delete stage.dataset.guidance; synth?.cancel(); stability.reset(); },
 };
}
