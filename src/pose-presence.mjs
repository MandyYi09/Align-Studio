// Acquire once, then keep practice open until an explicit dismissal or reset.
// Tracking loss only rearms a user-dismissed session; it never closes an active one.
export class PosePresence {
 constructor(){this.reset()}
 reset(){this.active=false;this.seenSince=null;this.lostSince=null;this.dismissed=false}
 update(detected,now){
  if(detected){this.lostSince=null;this.seenSince??=now;if(!this.dismissed&&now-this.seenSince>=600)this.active=true;}
  else{this.seenSince=null;this.lostSince??=now;if(now-this.lostSince>=4000){this.dismissed=false;}}
  return this.active;
 }
 dismiss(){this.active=false;this.dismissed=true}
}
