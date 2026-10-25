import {prepareLandmarks,isSidePose} from '../src/tracking-view.mjs';
import assert from 'node:assert/strict';
import {poses} from '../src/exercises.mjs';
import {getReference,landmarkIds} from '../src/reference.mjs';
import {comparePose,normalizedLive} from '../src/comparison.mjs';
import {evaluate} from '../src/pose-rules.mjs';
import {matchQuality} from '../src/match-quality.mjs';
import {PosePresence} from '../src/pose-presence.mjs';
assert.equal(poses.length,32);assert.equal(new Set(poses.map(p=>p.id)).size,32);
for(const pose of poses)for(const flipped of [false,true]){
 const ref=getReference(pose.id,flipped);assert.equal(ref.length,12);
 let p=Array.from({length:33},()=>({x:.5,y:.5,visibility:.99}));
 ref.forEach((v,i)=>p[landmarkIds[i]]={x:.5-v[0]*.18,y:.85-v[1]*.18,visibility:.99});
 p=prepareLandmarks(pose.id,p);
 const r=comparePose(pose.id,p,1000,1000,flipped);assert.ok(r,pose.id);assert.equal(r.quality.band,'green',pose.id);assert.ok(r.metrics.every(m=>m.delta<.001),pose.id);
 assert.notEqual(evaluate(pose.id,p).state,'unknown',pose.id);
 assert.ok(normalizedLive(pose.id,p,1000,1000).filter(Boolean).flat().every(Number.isFinite));
 const elbow=r.metrics.find(m=>m.label==='Left elbow'||m.label==='Right elbow'); const side=elbow.label.startsWith('Left')?0:1;const wrist=15+side,shoulder=11+side,joint=13+side;
 p[wrist]=elbow.actual>90?{...p[shoulder]}:{x:2*p[joint].x-p[shoulder].x,y:2*p[joint].y-p[shoulder].y,visibility:.99};
 assert.notEqual(comparePose(pose.id,p,1000,1000,flipped)?.quality.band,'green',pose.id);
 p[wrist].visibility=.1;assert.equal(evaluate(pose.id,p).state,'unknown');
}
assert.equal(matchQuality([{delta:0,close:true}]).band,'green');assert.equal(matchQuality([{delta:25,close:false}]).band,'orange');assert.equal(matchQuality([{delta:80,close:false}]).band,'red');assert.equal(matchQuality([{delta:NaN,close:false}]),null);
const presence=new PosePresence();assert.equal(presence.update(true,0),false);assert.equal(presence.update(true,600),true);assert.equal(presence.update(false,700),true);assert.equal(presence.update(false,2200),true);assert.equal(presence.update(false,4700),true);presence.update(true,4800);assert.equal(presence.update(true,5400),true);presence.dismiss();assert.equal(presence.update(true,5500),false);
console.log('PASS: 32 unique movements, 64 mirrored references, confidence gating, changed-limb corrections, color states, and fullscreen acquisition/loss.');
// Side-on tracking accepts one clear body side but never invents visible far-side joints.
let sidePose=Array.from({length:33},()=>({x:.5,y:.5,visibility:0}));
getReference('plank').forEach((v,i)=>sidePose[landmarkIds[i]]={x:.5-v[0]*.18,y:.8-v[1]*.18,visibility:i%2===0?.95:.1});
sidePose=prepareLandmarks('plank',sidePose);
assert.notEqual(evaluate('plank',sidePose).state,'unknown');
assert.equal(comparePose('plank',sidePose,1000,1000).quality.band,'green');
assert.equal(normalizedLive('plank',sidePose,1000,1000).filter(Boolean).length,6);
sidePose[13].visibility=.1;assert.equal(evaluate('plank',sidePose).state,'unknown');

// Acquisition feedback must work before any pose comparison succeeds.
const {framingState, GuidanceStability} = await import('../src/camera-guidance.mjs');
const framed = Array.from({length:33},()=>({x:.5,y:.5,visibility:.99}));
getReference('mountain').forEach((v,i)=>framed[landmarkIds[i]]={x:.5-v[0]*.18,y:.85-v[1]*.18,visibility:.99});
assert.equal(framingState('mountain',null,1280,720,false),'searching');
assert.equal(framingState('mountain',framed,1280,720,true),'ready');
assert.equal(framingState('mountain',framed,1280,720,false),'angle');
const clipped=structuredClone(framed);clipped[27].y=1.02;
assert.equal(framingState('mountain',clipped,1280,720,false),'back');
const obscured=structuredClone(framed);obscured[15].visibility=.1;
assert.equal(framingState('mountain',obscured,1280,720,false),'visible');
const distant=framed.map(p=>({...p,x:.5+(p.x-.5)*.1,y:.5+(p.y-.5)*.1}));
assert.equal(framingState('mountain',distant,1280,720,false),'closer');
const invalid=structuredClone(framed);invalid[15].x=NaN;
assert.equal(framingState('mountain',invalid,1280,720,false),'visible');
const oneSide=Array.from({length:33},()=>({x:.5,y:.5,visibility:.1}));
getReference('plank').forEach((v,i)=>oneSide[landmarkIds[i]]={x:.5-v[0]*.18,y:.8-v[1]*.18,visibility:i%2===0?.95:.1});
assert.equal(framingState('plank',prepareLandmarks('plank',oneSide),1000,1000,true),'ready');
const guidanceTiming=new GuidanceStability();
assert.equal(guidanceTiming.update('ready',0),'settling');
assert.equal(guidanceTiming.update('ready',599),'settling');
assert.equal(guidanceTiming.update('ready',600),'ready');
assert.equal(guidanceTiming.update('searching',700),'ready');
assert.equal(guidanceTiming.update('ready',800),'ready');
guidanceTiming.update('searching',900);
assert.equal(guidanceTiming.update('searching',2400),'searching');
guidanceTiming.reset();assert.equal(guidanceTiming.state,'searching');
console.log('PASS: framing cues, side-view occlusion, invalid landmarks, stable acquisition and tracking-loss recovery.');

const {HoldConfirmation,qualifiesForHold}=await import('../src/hold-confirmation.mjs');
assert.equal(qualifiesForHold({state:'warning'},{quality:{band:'green'}}),false);
assert.equal(qualifiesForHold({state:'good'},{quality:{band:'orange'}}),false);
assert.equal(qualifiesForHold({state:'ready'},{quality:{band:'green'}}),true);
const hold=new HoldConfirmation();
for(let t=0;t<3000;t+=100)assert.equal(hold.update(true,true,t).phase,'holding');
assert.equal(hold.update(true,true,3000).phase,'confirmed');
assert.equal(hold.update(false,true,3100).phase,'adjusting');
for(let t=3200;t<8200;t+=100)hold.update(true,true,t);
assert.equal(hold.update(true,true,8200).phase,'complete');
assert.equal(hold.update(true,true,8300).phase,'complete');
hold.update(false,false,8400);assert.equal(hold.update(false,false,12400).phase,'adjusting');
hold.reset();hold.update(true,true,0);
assert.equal(hold.update(true,true,1000).seconds,3);
assert.equal(hold.update(false,false,1100).phase,'adjusting');
console.log('PASS: strict qualification, continuous 3-second hold, 2-second confirmation, deviation reset, frame gaps and repeat prevention.');

// Regression: neither sustained tracking loss nor a completed hold may close practice.
const stickyPresence=new PosePresence();
assert.equal(stickyPresence.update(true,0),false);
assert.equal(stickyPresence.update(true,600),true);
assert.equal(stickyPresence.update(false,700),true);
assert.equal(stickyPresence.update(false,10000),true);
assert.equal(stickyPresence.update(true,10100),true);
const completedHold=new HoldConfirmation();
for(let t=10200;t<=16200;t+=100){
 completedHold.update(true,true,t);
 assert.equal(stickyPresence.update(true,t),true);
}
assert.equal(completedHold.complete,true);
stickyPresence.dismiss();assert.equal(stickyPresence.update(true,16300),false);
stickyPresence.reset();assert.equal(stickyPresence.active,false);
console.log('PASS: practice remains open through completed holds and extended tracking loss; explicit exit still works.');

// Regression for the user-visible body panel: detection alone must not compact it.
const {guidanceForHold}=await import('../src/camera-guidance.mjs');
const cueHold=new HoldConfirmation();
const cueStability=new GuidanceStability();
for(let t=0;t<=10000;t+=100){
 const frame=cueStability.update('ready',t);
 const cue=guidanceForHold(frame,cueHold.update(false,true,t));
 assert.notEqual(cue,'ready');
 if(t>=600)assert.equal(cue,'adjusting');
}
for(let t=10100;t<15100;t+=100){
 const cue=guidanceForHold('ready',cueHold.update(true,true,t));
 assert.equal(cue,t<13100?'holding':'confirmed');
}
assert.equal(guidanceForHold('ready',cueHold.update(true,true,15100)),'confirmed');
assert.equal(guidanceForHold('visible',{phase:'complete'}),'visible');
assert.equal(guidanceForHold('ready'),'adjusting');
console.log('PASS: body panel persists through detected-but-incorrect poses, a 3-second hold and a 2-second confirmation.');

for(const phase of ['adjusting','holding','confirmed','complete'])assert.notEqual(guidanceForHold('ready',{phase}),'ready');
console.log('PASS: no detection or completion phase automatically compacts the body guidance panel.');

assert.equal(qualifiesForHold(evaluate('reach',framed,1000,1000),comparePose('reach',framed,1000,1000)),false,'Arms down must not qualify as overhead reach');
