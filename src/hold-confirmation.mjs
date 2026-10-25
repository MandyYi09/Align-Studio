// Recognition is separate from a completed hold. Never count missing frames.
export class HoldConfirmation {
 constructor(){this.reset();}
 reset(){this.since=null;this.lastFrame=null;this.lostSince=null;this.complete=false;}
 update(qualified, detected, now){
  if(detected)this.lostSince=null;
  else {this.lostSince??=now;if(now-this.lostSince>=4000)this.reset();}
  if(this.complete)return {phase:'complete',seconds:0};
  if(!qualified || (this.lastFrame!==null && now-this.lastFrame>500))this.since=null;
  this.lastFrame=now;
  if(!qualified)return {phase:'adjusting',seconds:3};
  this.since??=now;
  const elapsed=now-this.since;
  if(elapsed>=5000){this.complete=true;return {phase:'complete',seconds:0};}
  if(elapsed>=3000)return {phase:'confirmed',seconds:Math.ceil((5000-elapsed)/1000)};
  return {phase:'holding',seconds:Math.ceil((3000-elapsed)/1000)};
 }
}
export function qualifiesForHold(assessment, comparison){
 return !!comparison && comparison.quality.band==='green' && ['good','ready'].includes(assessment.state);
}
