const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const moduleValue={exports:{}};
vm.runInNewContext(ts.transpile(fs.readFileSync('app/ticker-motion.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{exports:moduleValue.exports});
const {createTickerMotion}=moduleValue.exports;
const animations=[];
const rail={animate(frames,options){const animation={frames,options,currentTime:0,playbackRate:1,cancelled:false,updatePlaybackRate(rate){this.playbackRate=rate;},cancel(){this.cancelled=true;}};animations.push(animation);return animation;}};
const motion=createTickerMotion(rail);
motion.update(0,160);assert.equal(animations.length,0);
motion.update(1000,160);assert.equal(animations.length,1);let animation=animations[0];
assert.equal(animation.options.duration,10000);assert.equal(animation.options.easing,'linear');assert.equal(animation.options.iterations,Infinity);assert.equal(animation.playbackRate,1.6);assert.equal(animation.frames[1].transform,'translate3d(-1000px,0,0)');
animation.currentTime=2500;
motion.update(1000,240);assert.equal(animations.length,1);assert.equal(animation.currentTime,2500);assert.equal(animation.playbackRate,2.4);
motion.update(1000,240);assert.equal(animations.length,1);
motion.update(1600,240);assert.equal(animations.length,2);assert.equal(animation.cancelled,true);animation=animations[1];assert.equal(animation.currentTime,2500);assert.equal(animation.options.duration,16000);
motion.update(1600.1,240);assert.equal(animations.length,2);assert.equal(animation.currentTime,2500);
animation.currentTime=25000; // 2500 px travelled: 900 px into this 1600 px cycle.
motion.update(400,240);animation=animations[2];assert.equal(animation.currentTime,1000); // Same repeating content: 900 % 400 = 100 px.
motion.update(400,6000);assert.equal(animation.playbackRate,6);assert.equal(animation.currentTime,1000);
motion.update(400,NaN);assert.equal(animation.playbackRate,1.6);
motion.destroy();assert.equal(animation.cancelled,true);
const properties={},classes=[];const fallback=createTickerMotion({classList:{add:name=>classes.push(name)},style:{setProperty:(name,value)=>properties[name]=value}});
fallback.update(960,160);assert.equal(properties['--ticker-duration'],'6s');assert.equal(properties['--ticker-distance'],'-960px');assert(classes.includes('ticker-css-fallback'));
fallback.destroy();
console.log('Passed ticker speed changes without restarts, constant pixels/second, position preservation across screen/font changes, fractional measurement tolerance, seamless cycle wrapping and CSS fallback.');
