"use strict";
(() => {
const $ = id => document.getElementById(id);
const storageKey = "simo-b2-first-five-clips-v3";
const reportApi = "https://formsubmit.co/ajax/6fb9c839342d08b12e0889243652a8f4";
const parts = EXAM.parts;
const total = parts.reduce((n, p) => n + p.questions.length, 0);
let state = {name:"Simone",email:"",consent:false,answers:{},startedAt:0,endAt:0,finishedAt:0,reportStatus:"",reportError:"",part:0};
let interval = null;
const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = value => String(value == null ? "" : value).trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]/g," ").replace(/\s+/g," ").trim();
const save = () => { try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(e){} };
const stored = () => {try {let s=JSON.parse(localStorage.getItem(storageKey)||"null");return s&&s.startedAt&&s.answers&&typeof s.answers==="object"?s:null;}catch(e){return null;}};
const validAnswer = q => q.type==="gap"?String(state.answers[q.id]||"").trim().length>0:Number.isInteger(state.answers[q.id]);
const correct = q => q.type==="gap"?q.answers.map(norm).includes(norm(state.answers[q.id])):state.answers[q.id]===q.correct;
const all = parts.flatMap(p=>p.questions);
const answered = () => all.filter(validAnswer).length;
const got = () => all.filter(correct).length;
const scoreParts = () => parts.map(p=>({part:p.title,got:p.questions.filter(correct).length,total:p.questions.length}));
function expectedText(p,q){if(q.type==="gap")return q.answers[0];if(q.type==="match")return p.options[q.correct];return q.options[q.correct];}
function actualText(p,q){let v=state.answers[q.id];if(!validAnswer(q))return "(not answered)";if(q.type==="gap")return String(v);if(q.type==="match")return p.options[v]||"(invalid option)";return q.options[v]||"(invalid option)";}
function report(){
 const detail=parts.flatMap(p=>p.questions.map(q=>({part:p.title,id:q.id,task:q.q,answer:actualText(p,q),correctAnswer:expectedText(p,q),isCorrect:correct(q),explanation:q.why})));
 return {name:state.name,email:state.email,score:got(),total,percent:Math.round(got()*100/total),answered:answered(),minutes:Math.round(((state.finishedAt||Date.now())-state.startedAt)/60000),finishedAt:state.finishedAt,byPart:scoreParts(),detail};
}
function reportText(){
 const r=report();
 return ["B2 LISTENING: 5 CLIPS / 30 QUESTIONS — SIMO","Student: "+r.name,"Email: "+(r.email||"not provided"),
 "Finished: "+new Date(r.finishedAt).toISOString(),"Score: "+r.score+"/"+r.total+" ("+r.percent+"%)",
 "Completed: "+r.answered+"/"+r.total,"Minutes: "+r.minutes,"","CLIP SCORES",...r.byPart.map((s,i)=>(i+1)+". "+s.part+" "+s.got+"/"+s.total),
 "","QUESTION DETAIL",...r.detail.map(a=>a.id+". "+a.task+"\nStudent: "+a.answer+"\nCorrect: "+a.correctAnswer+"\n"+(a.isCorrect?"CORRECT":"INCORRECT")+"\nReason: "+a.explanation+"\n")].join("\n");
}
function updateProgress(){
 $("answeredLabel").textContent=answered()+" of "+total+" questions answered";
 $("sideCount").textContent=answered()+" / "+total;
 $("progressFill").style.width=(answered()*100/total)+"%";
 $("sectionList").innerHTML=parts.map((p,i)=>'<div><span>Part '+(i+1)+' · '+esc(p.title)+'</span><strong>'+p.questions.filter(validAnswer).length+'/'+p.questions.length+'</strong></div>').join("");
 $("partNav").querySelectorAll("button").forEach((b,i)=>{
  b.classList.toggle("done",parts[i].questions.every(validAnswer));
  b.classList.toggle("active",i===state.part);
 });
}
function questionHtml(p,q,index){
 let options="";
 if(q.type==="gap"){
  options='<input class="gap-input" autocomplete="off" spellcheck="false" aria-label="Question '+q.id+' answer" data-gap="'+q.id+'" placeholder="Type one or two words" maxlength="70" value="'+esc(state.answers[q.id]||"")+'"><p class="gap-tip">Write the exact information you hear. Spelling counts, but capitalisation does not.</p>';
 }else if(q.type==="match"){
  options='<select class="match-select" aria-label="Match '+esc(q.q)+'" data-match="'+q.id+'"><option value="">Choose statement A–H…</option>'+p.options.map((label,j)=>'<option value="'+j+'" '+(state.answers[q.id]===j?'selected':'')+'>'+('ABCDEFGH'[j])+'. '+esc(label)+'</option>').join('')+'</select>';
 }else{
  options='<div class="choices">'+q.options.map((label,j)=>'<label class="choice"><input type="radio" name="choice-'+q.id+'" data-choice="'+q.id+'" value="'+j+'" '+(state.answers[q.id]===j?'checked':'')+'><span class="letter">'+("ABC"[j])+'.</span><span>'+esc(label)+'</span></label>').join("")+'</div>';
 }
 const qText=q.type==="gap"?q.q.replace("__________","<span class=\"blank\">__________</span>"):esc(q.q);
 return '<section class="question"><div class="question-head"><span class="question-index">'+q.id.padStart(2,"0")+'</span><h3>'+qText+'</h3></div>'+options+'</section>';
}
function renderPart(){
 const p=parts[state.part];
 $("partKicker").textContent="CLIP "+(state.part+1)+" OF 5 · "+p.questions.length+" QUESTIONS · "+p.time+" MIN RECOMMENDED";
 $("partTitle").textContent=p.title;
 $("partSubtitle").textContent=p.subtitle;
 const player=$("groupAudio");player.pause();player.src="./"+p.audio;player.load();
 const prefix=p.type==="matching" ? '<div class="matching-guidance"><strong>Statements A–H</strong><p>Use each statement at most once; three statements are extra.</p><ol class="statements-list">'+p.options.map((v,i)=>'<li><strong>'+('ABCDEFGH'[i])+'.</strong> '+esc(v)+'</li>').join('')+'</ol></div>':"";
 $("questions").innerHTML=prefix+p.questions.map((q,i)=>questionHtml(p,q,i)).join("");

 $("questions").querySelectorAll("input[data-gap]").forEach(input=>input.addEventListener("input",()=>{state.answers[input.dataset.gap]=input.value;save();updateProgress();}));
 $("questions").querySelectorAll("input[data-choice],select[data-match]").forEach(input=>input.addEventListener("change",()=>{const id=input.dataset.choice||input.dataset.match;if(input.value==="")delete state.answers[id];else state.answers[id]=Number(input.value);save();updateProgress();}));
 $("backButton").disabled=state.part===0;
 $("nextButton").textContent=state.part===parts.length-1?"Return to Part 1 ↻":"Next part →";
 updateProgress();
}
function navigate(i){
 state.part=Math.max(0,Math.min(parts.length-1,i));save();renderPart();
 window.scrollTo({top:Math.max(0,document.querySelector("main").offsetTop-8),behavior:"smooth"});
}
function showExam(){
 $("welcome").classList.add("hidden");$("exam").classList.remove("hidden");$("results").classList.add("hidden");
 $("examHeading").textContent=state.name+"'s B2 Listening";
 $("partNav").innerHTML=parts.map((p,i)=>'<button type="button" data-part="'+i+'">Part '+(i+1)+' · '+esc(p.title)+'</button>').join("");
 $("partNav").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>navigate(Number(b.dataset.part))));
 renderPart();tick();if(interval)clearInterval(interval);interval=setInterval(tick,1000);
}
function tick(){
 if(!state.startedAt||state.finishedAt)return;
 let left=Math.max(0,state.endAt-Date.now()),seconds=Math.ceil(left/1000);
 $("timer").textContent=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
 document.querySelector(".clock").classList.toggle("warning",seconds<=180);
 if(!left)finish(true);
}
function start(){
 const n=$("studentName").value.trim(),email=$("studentEmail").value.trim();
 if(!n){$("studentName").focus();$("studentName").reportValidity();return;}
 if(email&&!$("studentEmail").checkValidity()){$("studentEmail").reportValidity();return;}
 if(!$("consent").checked){alert("Please agree to your teacher receiving your exam results before starting.");return;}
 state={name:n,email,consent:true,answers:{},startedAt:Date.now(),endAt:Date.now()+EXAM.durationMinutes*60000,finishedAt:0,reportStatus:"",reportError:"",part:0};
 save();showExam();
}
function finish(expired){
 if(state.finishedAt)return;
 if(!expired&&!window.confirm("Submit your B2 listening test? You have answered "+answered()+" of "+total+" questions. You cannot change your answers afterwards."))return;
 state.finishedAt=expired?state.endAt:Date.now();save();if(interval)clearInterval(interval);
 document.querySelectorAll("audio").forEach(a=>a.pause());showResults();sendReport();
}
function showResults(){
 $("welcome").classList.add("hidden");$("exam").classList.add("hidden");$("results").classList.remove("hidden");
 const r=report();
 $("resultTitle").textContent=r.name+"'s Listening results";
 $("scoreNumber").textContent=r.score;
 $("resultBand").textContent=r.percent>=80?"Excellent B2 listening":r.percent>=65?"Good B2 preparation":r.percent>=50?"Developing listening confidence":"Areas to work on";
 $("resultHeadline").textContent=r.percent>=80?"You handled this practice paper very well.":r.percent>=65?"A good result — review the finer details.":r.percent>=50?"A useful start — work on inference and detail.":"Keep building your listening skills.";
 $("resultMessage").textContent=r.score+" correct out of "+total+" ("+r.percent+"%). You answered "+r.answered+" questions in "+r.minutes+" minutes. Check the answer review to see why each option was right or wrong.";
 $("scoreBreakdown").innerHTML=r.byPart.map((s,i)=>'<div class="breakdown"><span>Part '+(i+1)+' · '+esc(s.part)+'</span><b>'+s.got+' / '+s.total+'</b></div>').join("");
 $("answerReview").innerHTML=parts.map((p,i)=>'<h4>Part '+(i+1)+' · '+esc(p.title)+'</h4>'+p.questions.map(q=>'<div class="review-item"><h4>'+esc(q.id)+'. '+esc(q.q)+'</h4><p class="'+(correct(q)?"good":"bad")+'">Your answer: '+esc(actualText(p,q))+' — '+(correct(q)?"Correct":"Incorrect")+'</p><p>Expected: <strong>'+esc(expectedText(p,q))+'</strong></p><small>'+esc(q.why)+'</small></div>').join("")).join("");
 if(state.reportStatus==="sending"){state.reportStatus="failed";state.reportError="The previous email attempt could not be verified after a page refresh.";}
 delivery();
 window.scrollTo({top:Math.max(0,document.querySelector("main").offsetTop-8),behavior:"smooth"});
}
function delivery(){
 const msg={sending:"Sending the full answer report to your teacher…",sent:"The email service accepted the report. Delivery may require teacher-side FormSubmit activation; please save a CSV backup.",failed:"The email report could not be confirmed. Your full results are saved in this browser: download a CSV now or try again."};
 $("deliveryStatus").textContent=(msg[state.reportStatus]||"Exam results saved on this device; preparing teacher email.")+(state.reportError?" "+state.reportError:"");
 $("retrySend").classList.toggle("hidden",state.reportStatus!=="failed");
}
async function sendReport(){
 if(!state.finishedAt||!state.consent||state.reportStatus==="sent"||state.reportStatus==="sending")return;
 state.reportStatus="sending";state.reportError="";save();delivery();
 const r=report(),payload={_subject:"B2 FIRST Listening · "+r.name+" · "+r.score+"/30",_template:"table",_captcha:"false",
 Student:r.name,Student_Email:r.email||"Not supplied",Score:r.score+"/30",Percentage:r.percent+"%",
 Answered:r.answered+"/30",Duration:r.minutes+" minutes",Finished:new Date(r.finishedAt).toISOString(),
 Part_Scores:r.byPart.map((p,i)=>"Part "+(i+1)+": "+p.got+"/"+p.total).join(" | "),Complete_Answer_Report:reportText()};
 if(r.email)payload._replyto=r.email;
 try{
  const ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),20000);
  let response;
  try{response=await fetch(reportApi,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload),signal:ac.signal});}
  finally{clearTimeout(timeout);}
  const reply=await response.json();
  if(!response.ok||!(reply.success===true||reply.success==="true"))throw new Error(String(reply.message||"Report rejected by email service").slice(0,180));
  state.reportStatus="sent";
 }catch(e){state.reportStatus="failed";state.reportError=String(e.message||"Connection error").slice(0,180);}
 save();delivery();
}
function downloadCsv(){
 const r=report(),rows=[["Student","Date","Score","Total","Percentage","Time (minutes)"],[r.name,new Date(r.finishedAt).toISOString(),r.score,r.total,r.percent,r.minutes],[],["Part","Question","Prompt","Student answer","Correct answer","Result","Explanation"]];
 r.detail.forEach(a=>rows.push([a.part,a.id,a.task,a.answer,a.correctAnswer,a.isCorrect?"Correct":"Incorrect",a.explanation]));
 const output="\uFEFF"+rows.map(row=>row.map(x=>'"'+String(x??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const u=URL.createObjectURL(new Blob([output],{type:"text/csv;charset=utf-8"})),link=document.createElement("a");
 link.href=u;link.download="simo-b2-first-listening-"+new Date(r.finishedAt).toISOString().slice(0,10)+".csv";
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);
}
$("startButton").addEventListener("click",start);
$("resumeButton").addEventListener("click",()=>state.finishedAt?showResults():showExam());
$("backButton").addEventListener("click",()=>navigate(state.part-1));
$("nextButton").addEventListener("click",()=>navigate(state.part===parts.length-1?0:state.part+1));
$("finishButton").addEventListener("click",()=>finish(false));
$("retrySend").addEventListener("click",sendReport);
$("downloadCsv").addEventListener("click",downloadCsv);
$("printReport").addEventListener("click",()=>window.print());
$("copyReport").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText(reportText());$("copyReport").textContent="✓ Report copied";}
 catch(e){alert("Could not copy. Please download the CSV instead.");}
});
$("restartButton").addEventListener("click",()=>{if(!confirm("Start a new attempt? Download or copy your last score first, because the previous attempt will be overwritten on this device."))return;localStorage.removeItem(storageKey);location.reload();});
$("sampleButton").addEventListener("click",()=>{const audio=$("sampleAudio");audio.currentTime=0;audio.play().catch(()=>alert("Audio playback failed. Check audio output and try again."));});
$("sampleAudio").addEventListener("timeupdate",()=>{if($("sampleAudio").currentTime>9)$("sampleAudio").pause();});
let prior=stored();
if(prior){
 state={...state,...prior};$("studentName").value=state.name;$("studentEmail").value=state.email||"";$("consent").checked=!!state.consent;
 if(state.finishedAt){showResults();}
 else{$("resumeButton").classList.remove("hidden");if(Date.now()>=state.endAt){state.finishedAt=state.endAt;save();showResults();sendReport();}}
}
})();