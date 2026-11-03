const BASE_SPEED=100;
const tickerSpeed=(speed:number)=>Math.max(30,Math.min(600,Number.isFinite(speed)&&speed>0?speed:160));

/** Keep the current position when the speed, fonts or screen dimensions change. */
export function createTickerMotion(rail:HTMLElement){
 let animation:Animation|null=null,distance=0,speed=0;
 return {
  update(nextDistance:number,nextSpeed:number){
   if(!Number.isFinite(nextDistance)||nextDistance<=0)return;
   const rate=tickerSpeed(nextSpeed);
   const resized=Math.abs(nextDistance-distance)>.25;
   if(!resized&&rate===speed)return;
   if(typeof rail.animate!=='function'){
    rail.classList.add('ticker-css-fallback');
    rail.style.setProperty('--ticker-distance',`${-nextDistance}px`);
    rail.style.setProperty('--ticker-duration',`${nextDistance/rate}s`);
   }else if(resized||!animation){
    const offset=animation&&distance>0?Number(animation.currentTime||0)*BASE_SPEED/1000%distance:0;
    const previous=animation;
    animation=rail.animate([{transform:'translate3d(0,0,0)'},{transform:`translate3d(${-nextDistance}px,0,0)`}],{duration:nextDistance/BASE_SPEED*1000,iterations:Infinity,easing:'linear'});
    animation.currentTime=offset%nextDistance/BASE_SPEED*1000;
    animation.playbackRate=rate/BASE_SPEED;
    previous?.cancel();
   }else {
    // Updating playback rate preserves the playhead; changing duration does not.
    if(typeof animation.updatePlaybackRate==='function')animation.updatePlaybackRate(rate/BASE_SPEED);
    else animation.playbackRate=rate/BASE_SPEED;
   }
   distance=nextDistance;speed=rate;
  },
  destroy(){animation?.cancel();animation=null;}
 };
}
