'use strict';
(function(root){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function poolTrace(start,angle,distance){
  const bounds={l:73,r:827,t:73,b:427},pockets=[{x:64,y:64},{x:450,y:64},{x:836,y:64},{x:64,y:436},{x:450,y:436},{x:836,y:436}];
  let p={...start},vx=Math.cos(angle*Math.PI/180),vy=-Math.sin(angle*Math.PI/180),left=distance,total=0,segments=[],bounces=[],pocket=-1;
  for(let n=0;n<30&&left>1e-6;n++){
   const tx=vx>1e-9?(bounds.r-p.x)/vx:vx<-1e-9?(bounds.l-p.x)/vx:Infinity;
   const ty=vy>1e-9?(bounds.b-p.y)/vy:vy<-1e-9?(bounds.t-p.y)/vy:Infinity;
   let wall=Math.min(tx,ty),len=Math.min(left,wall),hit=-1;
   for(let i=0;i<pockets.length;i++){
    const dx=p.x-pockets[i].x,dy=p.y-pockets[i].y,b=dx*vx+dy*vy,c=dx*dx+dy*dy-22**2,disc=b*b-c;
    if(disc>=0){const t=-b-Math.sqrt(disc);if(t>=0&&t<=len){len=t;hit=i;}}
   }
   const end={x:p.x+len*vx,y:p.y+len*vy};segments.push({a:{...p},b:end,length:len,start:total});total+=len;left-=len;p=end;
   if(hit>=0){pocket=hit;break;}if(len<wall-1e-6)break;
   const vertical=Math.abs(tx-wall)<1e-6,horizontal=Math.abs(ty-wall)<1e-6;
   const incidence=Math.atan2(vertical?Math.abs(vy):Math.abs(vx),vertical?Math.abs(vx):Math.abs(vy))*180/Math.PI;
   bounces.push({x:p.x,y:p.y,vertical,incidence});if(vertical)vx=-vx;if(horizontal)vy=-vy;
  }
  return {segments,bounces,pocket,total,end:p};
 }
 function dcSolve(voltage,closed,branches){
  if(!closed)return {current:0,status:'open',branches:branches.map(()=>({current:0,state:'open',message:'The switch breaks the return path. No steady current flows.'}))};
  const sign=Math.sign(voltage)||1,v=Math.abs(voltage);
  const results=branches.map(parts=>{
   const R=parts.filter(p=>p.type==='resistor').reduce((s,p)=>s+p.value,0),diodes=parts.filter(p=>p.type!=='resistor');
   const blocked=diodes.some(p=>(p.forward?1:-1)!==sign),drop=diodes.reduce((s,p)=>s+(p.type==='led'?2:.7),0);
   if(!v)return {R,drop,current:0,state:'off',message:'The source is 0 V, so this model has no driven current.'};
   if(blocked)return {R,drop,current:0,state:'blocked',message:'At least one diode is reverse-biased for this source polarity. It blocks this branch in the model.'};
   if(v<=drop)return {R,drop,current:0,state:'threshold',message:`The source magnitude ${v} V does not exceed the combined forward drop ${drop.toFixed(1)} V. This fixed-drop model predicts no current.`};
   if(R<=0)return {R,drop,current:null,state:'short',message:diodes.length?'Forward diodes with no series resistance do not give a finite current in this model. Add a resistor.':'An ideal wire shorts the ideal source. Current is not finite; add resistance or remove this branch.'};
   const current=sign*(v-drop)/R;return {R,drop,current,state:'on',message:`I = (${v.toFixed(2)} − ${drop.toFixed(2)}) / ${R} = ${(Math.abs(current)*1000).toFixed(3)} mA. ${sign<0?'Current runs from right to left.':'Current runs from left to right.'}`};
  });
  const short=results.some(r=>r.current===null);return {current:short?null:results.reduce((s,r)=>s+r.current,0),status:short?'short':results.some(r=>r.state==='on')?'on':'off',branches:results};
 }
 function ampSolve({vin,rail,rg,rf,inverting,power,ground,feedback}){
  if(!power)return {state:'unpowered',output:null,message:'The op amp has no power rails. The signal input does not power it. Restore its supply; output is undefined in this model.'};
  if(!ground)return {state:'floating',output:null,message:'The signal and feedback network have no shared 0 V reference. Restore the reference connection; this model cannot assign an output voltage.'};
  if(![vin,rail,rg,rf].every(Number.isFinite)||rg<=0||rf<=0||rail<=0)return {state:'invalid',output:null,message:'Use positive resistor values for this amplifier template.'};
  if(!feedback){const differential=inverting?-vin:vin;if(Math.abs(differential)<1e-12)return {state:'threshold',output:null,message:'Feedback is open and both inputs are equal. The ideal open-loop model cannot choose an output; real offsets and noise would matter.'};return {state:'openloop',output:Math.sign(differential)*rail,plus:inverting?0:vin,minus:inverting?vin:0,message:`Feedback is open. V+ ${differential>0?'>':'<'} V−, so the ideal open-loop amplifier saturates at ${Math.sign(differential)*rail} V. Reconnect negative feedback to control gain.`};}
  const gain=inverting?-rf/rg:1+rf/rg,target=gain*vin,output=clamp(target,-rail,rail),saturated=Math.abs(target)>rail;
  const plus=inverting?0:vin,minus=inverting?(vin/rg+output/rf)/(1/rg+1/rf):output*rg/(rg+rf);
  return {state:saturated?'saturated':'linear',gain,target,output,plus,minus,message:saturated?`The gain requests ${target.toFixed(3)} V, beyond the ±${rail} V rails. Output clips at ${output.toFixed(3)} V. The equal-input approximation no longer holds.`:`Negative feedback gives gain ${gain.toFixed(3)}. Vout = gain × Vin = ${output.toFixed(3)} V. In this ideal linear region, V+ = V− and input currents are zero.`};
 }
 const api={poolTrace,dcSolve,ampSolve};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MathLabEngines=api;
})(globalThis);
