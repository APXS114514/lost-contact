(function(){
"use strict";
var $ = function(id){ return document.getElementById(id); };
var S = { evidence:{}, decoded:false, stage:1, stage2done:false, wins:{}, zTop:100, wxUnlocked:false, zipDownloaded:false, ending:null };
var ST = window.STORY;
var SAVE_KEY = "shilian_save_v1";
function saveState(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify({ evidence:S.evidence, wx:S.wxUnlocked, dec:S.decoded, stage:S.stage, stage2done:S.stage2done, zip:S.zipDownloaded, ending:S.ending })); }catch(e){} }
function loadState(){ try{ var s=JSON.parse(localStorage.getItem(SAVE_KEY)); if(s){ if(s.evidence){ for(var k in s.evidence) S.evidence[k]=1; } if(s.wx) S.wxUnlocked=true; if(s.dec) S.decoded=true; if(s.stage) S.stage=parseInt(s.stage,10)||1; else if(s.pseudo) S.stage=2; if(s.stage2done) S.stage2done=true; if(s.zip) S.zipDownloaded=true; if(s.ending) S.ending=s.ending; } }catch(e){} }

/* ============ 通用 ============ */
function el(html){ var d=document.createElement("div"); d.innerHTML=html; return d.firstElementChild; }
function toast(msg, ms){ var w=$("toast-wrap"); var t=el('<div class="toast">'+msg+'</div>'); w.appendChild(t); setTimeout(function(){ t.style.opacity="0"; t.style.transition="opacity .4s"; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 450); }, ms||2600); }
function flash(ms, dark){ var f=$("flash-overlay"); f.style.opacity=dark?"0.85":"0.6"; f.style.background=dark?"#000":"#fff"; setTimeout(function(){ f.style.opacity="0"; f.style.transition="opacity .5s"; }, ms||120); setTimeout(function(){ f.style.transition=""; }, 700); }
function playTone(freq, dur, vol, when){ try{ var ctx=S.actx||(S.actx=new (window.AudioContext||window.webkitAudioContext)()); var o=ctx.createOscillator(); var g=ctx.createGain(); o.type="sine"; o.frequency.value=freq; g.gain.setValueAtTime(0, ctx.currentTime+(when||0)); g.gain.linearRampToValueAtTime(vol||0.08, ctx.currentTime+(when||0)+0.02); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+(when||0)+dur); o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime+(when||0)); o.stop(ctx.currentTime+(when||0)+dur+0.1); }catch(e){} }
function playChime(){ try{ var a=new Audio("assets/startup.mp3"); a.volume=0.5; a.play(); S._chime=a; }catch(e){ [523.25,659.25,783.99,1046.5].forEach(function(f,i){ playTone(f, 1.4, 0.05, i*0.12); }); } }
function playWhisper(){ playTone(220, 0.5, 0.03, 0); playTone(180, 0.6, 0.02, 0.3); }

/* ============ 证据 ============ */
function mark(ev, msg){ if(S.evidence[ev]) return; S.evidence[ev]=1; saveState(); if(msg) toast(msg); }

loadState();

/* ============ 开机 → 登录 ============ */
function boot(){ var fill=$("boot-fill"); var p=0; var iv=setInterval(function(){ p+=3+Math.random()*4; if(p>=100){ p=100; clearInterval(iv); setTimeout(glitchBoot, 350); } fill.style.width=p+"%"; }, 60); }
function glitchBoot(){ var g=$("boot-glitch"); g.style.opacity="0"; g.style.display="flex"; setTimeout(function(){ g.style.transition="opacity .08s"; g.style.opacity="1"; }, 30); setTimeout(function(){ g.style.opacity="0"; }, 300); setTimeout(function(){ g.style.display="none"; g.style.transition=""; $("screen-boot").classList.add("hidden"); $("screen-login").classList.remove("hidden"); setTimeout(function(){ $("login-pass").focus(); }, 300); }, 700); }
function tryLogin(){ var v=$("login-pass").value.trim().toLowerCase(); if(v==="limingze"){ $("screen-login").classList.add("hidden"); $("screen-desktop").classList.remove("hidden"); playChime(); showStageDesktop(); } else { var e=$("login-err"); e.classList.remove("hidden"); var h=$("login-hint"); if(h) h.classList.remove("hidden"); var c=$("login-pass"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); c.select(); } }

/* ============ 窗口系统 ============ */
function toggleLaunchpad(){
  var lp=$("launchpad");
  if(lp.classList.contains("open")){ lp.classList.remove("open"); return; }
  var grid=lp.querySelector(".lp-grid");
  if(!grid.childNodes.length){
    var items=[
      {id:"wechat", name:"微信", icon:"assets/icons/wechat.webp"},
      {id:"xhs", name:"小红书", icon:"assets/icons/xhs.webp"},
      {id:"safari", name:"Safari", icon:"assets/icons/safari.webp"},
      {id:"notes", name:"备忘录", icon:"assets/icons/notes.webp"},
      {id:"photos", name:"照片", icon:"assets/icons/photos.webp"},
      {id:"voice", name:"语音备忘录", icon:"assets/icons/voice.webp"},
      {id:"finder", name:"访达", icon:"assets/icons/finder.webp"},
      {id:"news", name:"新闻", icon:"assets/icons/news.webp"},
      {id:"trash", name:"废纸篓", icon:"assets/icons/trash.webp"},
      {id:"report", name:"报警", emoji:"\uD83D\uDEA8"},
      {id:"settings", name:"系统设置", icon:"assets/icons/settings.webp"}
    ];
    items.forEach(function(it){
      var d=document.createElement("div"); d.className="lp-item";
      d.innerHTML=it.icon?'<img src="'+it.icon+'" alt=""><span>'+it.name+'</span>':'<div class="lp-emoji">'+it.emoji+'</div><span>'+it.name+'</span>';
      d.addEventListener("click", function(){ lp.classList.remove("open"); openApp(it.id); });
      grid.appendChild(d);
    });
  }
  lp.classList.add("open");
  var q=$("lp-q");
  if(q){ q.value=""; q.focus(); filterLaunchpad(""); }
}
function filterLaunchpad(txt){
  var items=document.querySelectorAll(".lp-item");
  var n=0;
  for(var i=0;i<items.length;i++){
    var show = !txt || items[i].textContent.toLowerCase().indexOf(txt.toLowerCase())>-1;
    items[i].style.display = show ? "" : "none";
    if(show) n++;
  }
  var empty=$("lp-empty");
  if(empty){ empty.style.display = n===0 && txt ? "" : "none"; }
}

function openDesktopNote(){
  var id="note-wx";
  if(S.wins[id]){ S.wins[id].el.style.display="flex"; focusWin(id); return; }
  var win=el('<div class="win" id="win-'+id+'"><div class="win-titlebar"><div class="traffic"><span class="tl-close"></span><span class="tl-min"></span><span class="tl-max"></span></div><div class="win-title">微信.txt</div></div><div class="win-body"></div></div>');
  win.style.width="400px"; win.style.height="250px"; win.style.left="340px"; win.style.top="150px";
  $("windows").appendChild(win); S.wins[id]={el:win, body:win.querySelector(".win-body")};
  win.querySelector(".win-titlebar").addEventListener("pointerdown", function(e){ focusWin(id); dragWin(win, e); });
  win.querySelector(".tl-close").addEventListener("click", function(e){ e.stopPropagation(); closeWin(id); });
  win.querySelector(".tl-min").addEventListener("click", function(e){ e.stopPropagation(); win.style.display="none"; });
  win.querySelector(".tl-max").addEventListener("click", function(e){ e.stopPropagation(); });
  win.addEventListener("mousedown", function(){ focusWin(id); });
  var b=win.querySelector(".win-body");
  b.style.cssText="padding:26px 30px;background:#fff7d6;font-family:'Songti SC','SimSun',serif;font-size:15px;line-height:2.1;color:#333;overflow:auto";
  b.innerHTML="微信密码是：<b>limingze666</b>";
  focusWin(id);
}

function openUnknownExe(){
  var id="unknown";
  if(S.wins[id]){ S.wins[id].el.style.display="flex"; focusWin(id); return; }
  var win=el('<div class="win" id="win-'+id+'"><div class="win-titlebar" style="background:#1d1d1f"><div class="traffic"><span class="tl-close"></span><span class="tl-min"></span><span class="tl-max"></span></div><div class="win-title" style="color:#bbb">管理员: unknown.exe</div></div><div class="win-body" style="background:#000"></div></div>');
  win.style.width="440px"; win.style.height="270px"; win.style.left="300px"; win.style.top="180px";
  $("windows").appendChild(win); S.wins[id]={el:win, body:win.querySelector(".win-body")};
  win.querySelector(".win-titlebar").addEventListener("pointerdown", function(e){ focusWin(id); dragWin(win, e); });
  win.querySelector(".tl-close").addEventListener("click", function(e){ e.stopPropagation(); closeWin(id); });
  win.querySelector(".tl-min").addEventListener("click", function(e){ e.stopPropagation(); win.style.display="none"; });
  win.querySelector(".tl-max").addEventListener("click", function(e){ e.stopPropagation(); });
  win.addEventListener("mousedown", function(){ focusWin(id); });
  var b=win.querySelector(".win-body");
  b.style.cssText="padding:16px 18px;background:#000;color:#7dffa8;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.9;overflow:auto;white-space:pre-wrap";
  b.textContent="";
  var lines=["> unknown.exe", "", "正在运行……", "", "别信。", "", "（进程已结束。它只输出了这两个字。）"];
  var i=0;
  function typeLine(){
    if(i>=lines.length){ return; }
    var pre=document.createElement("div"); pre.textContent=lines[i];
    b.appendChild(pre);
    i++;
    setTimeout(typeLine, 520);
  }
  setTimeout(typeLine, 400);
  focusWin(id);
}

function openApp(id){
  var w=S.wins[id]; if(w){ w.el.style.display="flex"; focusWin(id); return; }
  var cfg=APPS[id]; if(!cfg) return;
  var win=el('<div class="win" id="win-'+id+'"><div class="win-titlebar"><div class="traffic"><span class="tl-close"></span><span class="tl-min"></span><span class="tl-max"></span></div><div class="win-title">'+cfg.title+'</div></div><div class="win-body"></div></div>');
  win.style.width=cfg.w+"px"; win.style.height=cfg.h+"px";
  var cw=Math.min(cfg.w, window.innerWidth-16), chh=Math.min(cfg.h, window.innerHeight-96);
  win.style.width=cw+"px"; win.style.height=chh+"px";
  win.style.left=Math.max(8, Math.min(window.innerWidth-cw-8, cfg.x||100))+"px";
  win.style.top=Math.max(26, Math.min(window.innerHeight-chh-70, cfg.y||50))+"px";
  $("windows").appendChild(win); S.wins[id]={el:win, body:win.querySelector(".win-body")};
  win.querySelector(".win-titlebar").addEventListener("mousedown", function(e){ focusWin(id); dragWin(win, e); });
  win.querySelector(".tl-close").addEventListener("click", function(e){ e.stopPropagation(); closeWin(id); });
  win.querySelector(".tl-min").addEventListener("click", function(e){ e.stopPropagation(); win.style.display="none"; });
  win.querySelector(".tl-max").addEventListener("click", function(e){ e.stopPropagation(); win.style.width=(parseInt(win.style.width)>900?"720px":"min(96vw, 1100px)"); });
  win.addEventListener("mousedown", function(){ focusWin(id); });
  focusWin(id); cfg.build(win, win.querySelector(".win-body"));
  refreshDockDots();
}
function focusWin(id){ var w=S.wins[id]; if(!w) return; S.zTop+=1; w.el.style.zIndex=S.zTop; w.el.classList.add("focused"); for(var k in S.wins){ if(k!==id) S.wins[k].el.classList.remove("focused"); } }
function closeWin(id){ var w=S.wins[id]; if(w){ w.el.parentNode.removeChild(w.el); delete S.wins[id]; refreshDockDots(); } }
function refreshDockDots(){
  var items=document.querySelectorAll(".dock-item");
  for(var i=0;i<items.length;i++){
    var a=items[i].getAttribute("data-app");
    if(a && a!=="launchpad" && S.wins[a]) items[i].classList.add("running");
    else items[i].classList.remove("running");
  }
}
function dragWin(win, e){ if(e.target.classList.contains("tl-close")||e.target.classList.contains("tl-min")||e.target.classList.contains("tl-max")) return; var sx=e.clientX, sy=e.clientY, lx=win.offsetLeft, ly=win.offsetTop; function mv(ev){ win.style.left=Math.max(-160, Math.min(window.innerWidth-120, lx+ev.clientX-sx))+"px"; win.style.top=Math.max(0, Math.min(window.innerHeight-60, ly+ev.clientY-sy))+"px"; } function up(){ document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); } document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); }

/* ============ 聊天渲染 ============ */
function avatarFor(name, m){
  if(m && m.av && m.av.length===1){ return '<div class="mav" style="background:'+(m.color||"#cfd6e6")+'">'+m.av+'</div>'; }
  if(m && m.av && m.av.indexOf("assets/")===0){ return '<div class="mav"><img src="'+m.av+'"></div>'; }
  return '<div class="mav" style="background:#cfd6e6">'+(name||"?").slice(0,1)+'</div>';
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function renderChat(container, msgs, opt){
  opt=opt||{}; container.innerHTML="";
  var lastWho=null;
  msgs.forEach(function(m){
    var who=m.who==="me";
    var row=document.createElement("div"); row.className="mrow";
    if(m.t==="time"){ row.appendChild(el('<div class="mtime2">'+esc(m.text)+'</div>')); container.appendChild(row); return; }
    if(m.t==="sys"){ row.appendChild(el('<div class="msys2">'+esc(m.text)+'</div>')); container.appendChild(row); return; }
    var inner=document.createElement("div"); inner.className="minner"+(who?" me":"");
    var av;
    if(who){ av='<div class="mav"><img src="assets/avatar.png"></div>'; }
    else { var avSrc=(ST.wechat&&ST.wechat.avatars)?ST.wechat.avatars[m.name]:null; av=avSrc?'<div class="mav"><img src="'+avSrc+'"></div>':avatarFor(m.name, m); }
    inner.appendChild(el(av));
    var body=document.createElement("div"); body.className="mbody";
    if(opt.showName && !who && m.name!==lastWho){ body.appendChild(el('<div class="mname">'+esc(m.name)+'</div>')); }
    var bub=document.createElement("div"); bub.className="mbub";
    if(m.t==="text"){ bub.textContent=m.text; }
    else if(m.t==="img"){ var im=document.createElement("img"); im.className="m-img"; im.src=m.src; im.addEventListener("click",function(){ showLightbox(m.src,m.cap||""); }); bub.appendChild(im); }
    else if(m.t==="expired"){ var ex=document.createElement("img"); ex.className="m-expired"; ex.src="assets/expired-photo.png"; ex.addEventListener("click",function(e){ ghostExpired(e.currentTarget); }); bub.appendChild(ex); }
    else if(m.t==="loc"){ var lb=document.createElement("img"); lb.className="m-loc"; lb.src=m.src; lb.addEventListener("click",function(){ showLightbox(m.src,m.label||""); }); bub.appendChild(lb); }
    else if(m.t==="file"){ bub.appendChild(el('<div class="m-file"><span class="f-icon">'+m.ficon+'</span><span class="f-name">'+esc(m.fname)+'</span></div>')); bub.querySelector(".m-file").addEventListener("click",function(){ if(!S.zipDownloaded){ S.zipDownloaded=true; saveState(); } toast("已下载到「下载」文件夹。去访达看看。"); }); }
    else if(m.t==="voice"){ bub.appendChild(el('<div class="m-voice"><span class="v-tri"></span><span class="v-dur">'+m.dur+' 秒</span></div><div class="v-trans">语音转文字：'+esc(m.trans)+'</div>')); bub.querySelector(".m-voice").addEventListener("click",function(){ var vEl=this; if(!vEl._n) vEl._n=0; vEl._n++; var au=vEl._audio||(vEl._audio=new Audio()); if(vEl._n===2 && m.srcB){ au.src=m.srcB; au.play(); toast("等等。这个声音……和刚才的不太一样。", 3600); } else { au.src=m.src; au.play(); } }); }
    else if(m.t==="sticker"){ bub.appendChild(el('<img class="m-sticker" src="'+m.src+'">')); }
    else if(m.t==="redpacket"){
      bub.className="mbub rp-bubble";
      bub.appendChild(el('<div class="m-redpack"><img class="rp-icon" src="assets/redpacket.png" alt=""><div><div class="rp-msg">'+esc(m.text)+'</div><div class="rp-foot">微信红包</div></div></div>'));
      bub.querySelector(".m-redpack").addEventListener("click", function(){ toast("已领取。……她总想给他花钱。", 2600); });
    }
    else { return; }
    body.appendChild(bub);
    if(m.failed && who){ bub.style.opacity="0.55"; body.insertBefore(el('<span class="m-fail" title="未送达">!</span>'), bub); }
    inner.appendChild(body); row.appendChild(inner); container.appendChild(row);
    if(m.t==="text"||m.t==="img"||m.t==="expired"||m.t==="loc"||m.t==="file"||m.t==="voice"||m.t==="sticker"||m.t==="redpacket"){ lastWho = who ? "ME" : (m.name||lastWho); }
  });
  container.scrollTop=container.scrollHeight;
}

/* 灵异点①：过期照片 */
var expiredFlashed=false;
function ghostExpired(img){
  if(!expiredFlashed){
    expiredFlashed=true;
    img.src="assets/blur-source.webp"; img.style.filter="blur(6px) grayscale(.8)";
    setTimeout(function(){ img.src="assets/expired-photo.png"; img.style.filter=""; setTimeout(function(){ toast("……刚才那张脸，是网速卡了，对吧。", 3000); }, 200); }, 700);
  } else { toast("图片已过期或已被清理。无法查看该图片，请尝试重新发送。"); }
}

/* ============ 应用 ============ */
function buildWeChat(win, body){
  if(S.wxUnlocked){ buildWeChatCore(win, body); return; }
  body.innerHTML="";
  var g=el('<div class="wx-login"><img src="assets/avatar.png"><div class="wx-title">微信</div><input id="wx-pwd" type="password" placeholder="输入密码"><button id="wx-go">登 录</button><div class="wx-err hidden" id="wx-err">密码不对。桌面上找找？</div></div>');
  body.appendChild(g);
  function tryWx(){ var v=g.querySelector("#wx-pwd").value.trim(); if(v===ST.wechat.password){ S.wxUnlocked=true; saveState(); buildWeChatCore(win, body); } else { var er=g.querySelector("#wx-err"); er.classList.remove("hidden"); var ip=g.querySelector("#wx-pwd"); ip.classList.remove("shake"); void ip.offsetWidth; ip.classList.add("shake"); ip.select(); } }
  g.querySelector("#wx-go").addEventListener("click", tryWx);
  g.querySelector("#wx-pwd").addEventListener("keydown", function(e){ if(e.key==="Enter") tryWx(); });
}

function buildWeChatCore(win, body){
  var wc=ST.wechat;
  var shell=el('<div class="im-shell"></div>');
  var side=el('<div class="im-side"><div class="im-side-head">微信</div><div id="wc-contacts"></div></div>');
  var main=el('<div class="im-main"><div id="wc-chathead" class="im-chathead">选择一个联系人</div><div id="wc-chat" class="im-chat scroll"></div></div>');
  shell.appendChild(side); shell.appendChild(main); body.appendChild(shell);
  var cList=side.querySelector("#wc-contacts");
  wc.contacts.forEach(function(c){
    var avHtml = (c.av && c.av.indexOf("assets/")===0) ? '<img src="'+c.av+'" style="width:100%;height:100%;object-fit:cover">' : c.av;
    var item=el('<div class="im-contact" data-id="'+c.id+'"><div class="im-avatar" style="background:'+(c.color||"#cfd6e6")+'">'+avHtml+'</div><div><div class="im-cname">'+c.name+'</div><div class="im-clast">'+esc(c.last)+'</div></div></div>');
    item.addEventListener("click", function(){ openChat(c.id); });
    cList.appendChild(item);
  });
  var pyqBtn=el('<div style="padding:12px 12px;border-top:1px solid #e2e2e6;margin-top:auto;cursor:pointer;font-size:13px;color:#576b95">\uD83D\uDCF7 朋友圈</div>');
  side.appendChild(pyqBtn);
  pyqBtn.addEventListener("click", function(){ renderMoments(); });
  function openChat(id){
    var c=null; for(var i=0;i<wc.contacts.length;i++){ if(wc.contacts[i].id===id) c=wc.contacts[i]; }
    var msgs=wc.chats[id]; if(!msgs) return;
    var items=cList.querySelectorAll(".im-contact"); for(var j=0;j<items.length;j++) items[j].classList.remove("active");
    var hit=cList.querySelector('[data-id="'+id+'"]'); if(hit) hit.classList.add("active");
    main.querySelector("#wc-chathead").textContent = id==="group" ? c.name : ("与 "+c.name+" 的聊天");
    var chatEl=main.querySelector("#wc-chat"); renderChat(chatEl, msgs, id==="group"?{showName:true}:{});
    if(id==="group" && S.stage>=2){ chatEl.appendChild(el('<div class="m-sys">（8/25 00:00）铭哥 撤回了一条消息</div>')); }
    if(id==="xibo" && S.stage>=2){ chatEl.appendChild(el('<div class="m-sys">（8/25 00:00）汐泊诺思 撤回了一条消息</div>')); }
  }
  function renderMoments(){
    main.querySelector("#wc-chathead").textContent="朋友圈";
    var chatEl=main.querySelector("#wc-chat"); chatEl.innerHTML="";
    var wrap=el('<div class="pyq scroll"></div>');
    wc.moments.forEach(function(m){
      var avHtml = (m.av && m.av.indexOf("assets/")===0) ? '<img src="'+m.av+'" style="width:100%;height:100%;object-fit:cover">' : m.av;
      var card=el('<div class="pyq-card"><div class="pyq-head"><div class="im-avatar" style="background:'+(m.color||"#cfd6e6")+'">'+avHtml+'</div><div class="pyq-name">'+m.name+'</div><div class="pyq-time">'+m.time+'</div></div><div class="pyq-text">'+esc(m.text)+'</div></div>');
      if(m.img) card.appendChild(el('<img class="pyq-img" src="'+m.img+'">'));
      var com=el('<div class="pyq-com"><span class="gray">'+esc(m.comments)+'</span><br><span class="gray">'+esc(m.comments2)+'</span></div>');
      card.appendChild(com); wrap.appendChild(card);
    });
    chatEl.appendChild(wrap);
  }
  openChat("tuanzi");
}

function buildSafari(win, body){
  var sh=ST.safari;
  body.innerHTML='<div class="safari-bar"><span class="safari-nav">\u2039</span><span class="safari-nav">\u203A</span><input class="safari-url" id="safari-input" placeholder="搜索或输入网址" value=""></div><div class="safari-main"><div id="safari-content" class="safari-page"></div></div>';
  var input=body.querySelector("#safari-input"); var content=body.querySelector("#safari-content");
  function showHistory(){
    content.className="safari-page scroll"; content.innerHTML="<h3 style=\"margin-bottom:10px\">历史记录</h3>";
    sh.history.forEach(function(h){
      var markTxt = (h.deleted?' <span style="color:#c0392b;font-size:11px">（已被删除，又重新收藏）</span>':"") + (h.ghost?' <span style="color:#8e44ad;font-size:11px">（这条不该存在）</span>':"");
      var item=el('<div class="hist-item"><div class="hist-fav">'+h.fav+'</div><div><div class="hist-t">'+esc(h.title)+markTxt+'</div><div class="hist-u">'+esc(h.url)+' · '+h.t+'</div></div></div>');
      item.addEventListener("click", function(){ if(h.ghost) showStreetView(); else content.innerHTML="<h3>"+esc(h.title)+'</h3><p style="color:#999">（历史记录条目 · 演示）</p>'; });
      content.appendChild(item);
    });
  }
  function showStreetView(){
    content.className="safari-page scroll";
    content.innerHTML='<h3>杭州市西湖区文三路 · 街景</h3><p style="color:#999">8/26 00:00 · 这条记录不该存在。他 7/26 就关机了。</p><div class="red-circle"><img src="assets/p-skyline.webp" style="width:100%;border-radius:8px"></div><p>红圈里那栋楼——和照片文件夹里 7/25 夜里拍的是同一栋。</p>';
  }
  input.addEventListener("keydown", function(e){
    if(e.key!=="Enter") return;
    var q=input.value.trim(); if(!q) return;
    var preset=null;
    sh.searchPresets.forEach(function(p){ if(q.indexOf(p.q)>-1 || p.q.indexOf(q)>-1) preset=p; });
    if(preset){
      content.className="safari-page scroll"; content.innerHTML="<h3>"+preset.label+"</h3>";
      preset.results.forEach(function(r){
        content.appendChild(el('<div class="srch-result"><div class="rt">'+esc(r.t)+'</div><div class="ru">'+esc(r.u)+'</div><div class="rs">'+esc(r.s)+'</div></div>'));
      });
      if(q.indexOf("帅气鲨团子")>-1) toast("只有网名。没有任何真实身份信息。");
    } else {
      content.innerHTML="<h3>没有结果</h3><p>（演示范围有限，试试：帅气鲨团子 / 李铭泽 / 文三路）</p>";
    }
  });
  showHistory();
}

function buildNotes(win, body){
  body.innerHTML='<div class="notes-shell"><div class="notes-list" id="notes-list"></div><div class="notes-body" id="notes-body"></div></div>';
  var list=body.querySelector("#notes-list"); var nb=body.querySelector("#notes-body");
  ST.notes.forEach(function(n){
    var item=el('<div class="notes-item" data-id="'+n.id+'"><div class="nt">'+esc(n.title)+'</div><div class="nd">'+n.date+'</div></div>');
    item.addEventListener("click", function(){
      var items=list.querySelectorAll(".notes-item"); for(var i=0;i<items.length;i++) items[i].classList.remove("active");
      item.classList.add("active");
      nb.innerHTML="<h2>"+esc(n.title)+'</h2><div class="n-text">'+esc(n.text)+'</div>';
      if(n.id.indexOf("d")===0) mark(8, "日记里有他要说的话。");
    });
    list.appendChild(item);
  });
  nb.innerHTML="<h2>备忘录</h2><div class=\"n-text\">他走之前，把这些留在了这里。\n\n点左边慢慢看。</div>";
}

function buildPhotos(win, body){
  var grid=el('<div class="photo-grid scroll"></div>');
  ST.photos.forEach(function(p){
    var cell=el('<div class="photo-cell"><img src="'+p.src+'" loading="lazy"><div class="photo-cap">'+esc(p.cap)+'</div></div>');
    cell.querySelector("img").addEventListener("click", function(){ showLightbox(p.src, p.cap); if(p.ev) mark(p.ev, "照片：他在确认那栋楼的位置。"); });
    grid.appendChild(cell);
  });
  body.appendChild(grid);
}
function showLightbox(src, cap){ var lb=$("lightbox"); $("lightbox-img").src=src; $("lightbox-cap").textContent=cap||""; lb.classList.remove("hidden"); }
window.__closeLightbox=function(){ $("lightbox").classList.add("hidden"); };

function buildVoice(win, body){
  var vc=ST.voice.morse;
  var wrap=el('<div class="voice-list scroll"></div>');
  function card(m){
    var c=el('<div class="voice-card"><div class="vc-t">'+m.name+'</div><div class="vc-d">'+m.meta+'</div><audio controls preload="none" src="'+m.src+'"></audio><div class="vc-note" style="font-size:12px;color:#666;margin-top:6px">'+esc(m.note)+'</div></div>');
    wrap.appendChild(c); return c;
  }
  var c1=card(vc);
  var btn=el('<button class="vc-btn">分析滴答声（需要摩斯对照表）</button>');
  c1.appendChild(btn);
  var result=el('<div></div>'); c1.appendChild(result);
  function refreshDecodeBtn(){
    if(S.decoded){ btn.textContent="分析滴答声"; btn.classList.remove("vc-locked"); }
    else { btn.textContent="分析滴答声（需要摩斯对照表）"; btn.classList.add("vc-locked"); }
  }
  refreshDecodeBtn();
  var _di=setInterval(function(){ if(S.decoded){ refreshDecodeBtn(); clearInterval(_di); } }, 400);
  btn.addEventListener("click", function(){
    if(!S.decoded){ toast("需要先找到摩斯对照表——在访达的「2026.07」里。", 3000); return; }
    result.innerHTML=""; result.appendChild(el('<div class="vc-result">'+esc(vc.decode)+'</div>'));
    mark(2, "摩斯信号：救我 + 坐标。");
  });
  if(S.stage>=2){
    var v2=ST.stage2.voiceNote;
    var c2=card(v2);
    c2.querySelector(".vc-d").style.color="#8e44ad";
    var rb=el('<button class="vc-btn">转写（自动）</button>'); c2.appendChild(rb);
    var r2=el('<div></div>'); c2.appendChild(r2);
    rb.addEventListener("click", function(){ r2.innerHTML=""; r2.appendChild(el('<div class="vc-result">'+esc(v2.decode)+'</div>')); r2.appendChild(el('<div class="vc-ghost">'+esc(v2.ghost)+'</div>')); if(!S.stage2done){ S.stage2done=true; saveState(); toast("文三路515……她在等他。", 3400); } });
  }
  body.appendChild(wrap);
  var au=c1.querySelector("audio");
  au.addEventListener("ended", function(){ if(S.stage<2){ c1.appendChild(el('<div class="vc-ghost">'+esc(vc.ghost)+'</div>')); playWhisper(); } });
}

function buildNews(win, body){
  body.innerHTML='<div class="news-shell"><div class="news-col"><div id="news-list"></div><div id="news-detail" class="hidden"></div></div></div>';
  var list=body.querySelector("#news-list");
  var detail=body.querySelector("#news-detail");
  function ntime(n){ var m=(n.src||"").match(/\d{4}-\d{2}-\d{2}/); return m?m[0]:""; }
  function showList(){ list.classList.remove("hidden"); detail.classList.add("hidden"); }
  function showDetail(n){
    list.classList.add("hidden"); detail.classList.remove("hidden");
    var paras=esc(n.body).split("\n").join("</p><p>");
    detail.innerHTML='<div class="n-back">\u2039 返回列表</div>'+
      '<div class="n-dtag">'+esc(n.tag||"")+'</div>'+
      '<h2 class="n-dtitle">'+esc(n.title)+'</h2>'+
      '<div class="n-dmeta">'+esc(n.src)+'</div>'+
      (n.img?'<img class="n-detail-img" src="'+n.img+'" alt="">':'')+
      '<p>'+paras+'</p>';
    detail.querySelector(".n-back").addEventListener("click", showList);
    if(n.ghost){ setTimeout(function(){ flash(100); setTimeout(function(){ toast("你的电脑闪了一下屏。……可能是显卡的问题。", 3000); }, 400); }, 600); }
    if(n.ev) mark(n.ev, "新闻：他可能就是那个「受害者」。");
  }
  ST.news.forEach(function(n){
    var item=el('<div class="n-item">'+
      '<div class="n-row"><div class="n-t">'+(n.tag?'<span class="n-tag'+(n.tag==="置顶"?' hot':'')+'">'+esc(n.tag)+'</span>':'')+esc(n.title)+'</div></div>'+
      '<div class="n-meta">'+esc(n.src)+' · 评论 '+(99+n.id*17)+'</div>'+
      (n.img?'<img class="n-thumb" src="'+n.img+'" alt="">':'')+
    '</div>');
    item.addEventListener("click", function(){ showDetail(n); });
    list.appendChild(item);
  });
  showList();
}

function buildFinder(win, body){
  var f=ST.finder;
  var shell=el('<div class="finder-shell"><div class="finder-side"><div class="fs-h">个人收藏</div><div class="fs-i active" data-loc="root">\uD83D\uDDC2\uFE0F 李铭泽的MacBook</div><div class="fs-i" data-loc="download">\u2B07\uFE0F 下载</div><div class="fs-i" data-loc="documents">\uD83D\uDCC4 文稿</div><div class="fs-i" data-loc="pictures">\uD83D\uDDBC\uFE0F 图片</div><div class="fs-i" data-loc="encrypted">\uD83D\uDD12 2026.07</div></div><div class="finder-main"><div class="finder-toolbar"><span class="ft-btn" id="f-back">\u2190 返回</span><span class="ft-btn" id="f-hidden">显示隐藏文件</span><span class="finder-path" id="f-path">访达</span></div><div id="f-content" class="finder-files"></div></div></div>');
  body.appendChild(shell);
  var content=body.querySelector("#f-content"); var pathEl=body.querySelector("#f-path");
  var hiddenOn=false; var encOpen=false;
  function clearFiles(){ content.innerHTML=""; content.className="finder-files"; }
  function fileTile(icon, name, fn){ var t=el('<div class="finder-file"><div class="ff-icon">'+icon+'</div><div class="ff-name">'+esc(name)+'</div></div>'); if(fn) t.addEventListener("click", fn); content.appendChild(t); return t; }
  function showRoot(){ pathEl.textContent="李铭泽的MacBook"; clearFiles(); fileTile("\uD83D\uDCC1","下载",showDownload); fileTile("\uD83D\uDCC4","文稿",showDocuments); fileTile("\uD83D\uDDBC\uFE0F","图片",showPictures); fileTile("\uD83D\uDD12","2026.07",showEncrypted); }
  function showDownload(){
    pathEl.textContent="下载"; clearFiles();
    if(S.zipDownloaded){ fileTile(f.zip.icon, f.zip.name, showZip); }
    else { content.appendChild(el('<div style="padding:20px;color:#999;font-size:13px;text-align:center;width:100%">下载文件夹是空的。<br><br>微信里，好像有人给他发过一个文件……</div>')); }
  }
  function showZip(){ pathEl.textContent="下载 / 到时候再看"; clearFiles(); content.appendChild(el('<div style="padding:2px 10px 12px;font-size:11px;color:#8a6d3b;line-height:1.7">这个文件夹的名字，本来是留给他到杭州看的。\\n没想到，一个月后打开它的人是你。</div>')); f.zipFiles.forEach(function(zf){ fileTile(zf.icon, zf.name, function(){ showZipFile(zf); }); }); if(!S.zipSeen){ S.zipSeen=true; toast("「到时候再看」……原来是留给他自己的。", 2600); } }
  function showZipFile(zf){
    content.className="finder-detail"; content.innerHTML="<h3>"+esc(zf.name)+"</h3>";
    if(zf.t==="img"){
      content.appendChild(el('<img class="fd-img'+(zf.blur?" fd-blur":"")+'" src="'+zf.src+'">'));
      content.appendChild(el('<div class="fd-note">'+esc(zf.desc)+'</div>'));
      if(zf.ev) mark(zf.ev, "照片文件还在（时间戳 7/23）。但照片本身——和聊天记录里那张一样，过期了。");
    } else if(zf.t==="voice"){
      content.appendChild(el('<div class="fd-note">'+esc(zf.desc)+'</div>'));
      var au=document.createElement("audio");
      au.controls=true; au.preload="none"; au.style.cssText="width:100%;margin-top:12px"; au.src=zf.src||"";
      content.appendChild(au);
    } else if(zf.t==="txt"){
      content.appendChild(el('<div class="fd-text">'+esc(zf.desc)+'</div>'));
    }
  }
  function showDocuments(){
    pathEl.textContent="文稿"; clearFiles();
    fileTile(f.plan.icon, f.plan.name, function(){
      content.className="finder-detail"; content.innerHTML="<h3>"+esc(f.plan.name)+'</h3><div class="fd-text">杭州行程 7.25\nG189 德州东 07:52 \u2192 杭州东 12:41\n酒店：西湖区文三路 XX 酒店（团子订的，报她名字）\n她说在文三路 515 号那栋楼下等我\n16 号出口，别走错\n回来车票先不买，看她安排</div>';
      mark(f.plan.ev, "行程：文三路 515 号。她给的地址。");
    });
    fileTile(f.psych.icon, f.psych.name, function(){
      content.className="finder-detail"; content.innerHTML="<h3>"+esc(f.psych.name)+'</h3><div class="fd-text">德州市XX医院 · 心理科\n就诊人：李铭泽（男，22岁）\n主诉：失眠、情绪低落、注意力下降，有退学念头\n建议：规律作息，适度运动，必要时复诊\n（医生签名字迹潦草）\n\n——半年前的事。他没跟任何人说。</div>';
    });
    if(S.stage>=2){
      fileTile(ST.stage2.file.icon, ST.stage2.file.name, function(){
        content.className="finder-detail"; content.innerHTML="<h3>"+esc(ST.stage2.file.name)+'</h3><div class="fd-text">'+esc(ST.stage2.file.desc)+'</div>';
      });
    }
  }
  function showPictures(){
    pathEl.textContent="图片"; clearFiles();
    ST.photos.forEach(function(p){
      fileTile("\uD83D\uDCF7", p.cap.split(" ")[0], function(){
        content.className="finder-detail"; content.innerHTML="<h3>"+esc(p.cap)+'</h3><img class="fd-img" src="'+p.src+'">';
        if(p.ev) mark(p.ev, "照片：他在确认那栋楼的位置。");
      });
    });
    if(hiddenOn){
      fileTile(f.imgGhost.icon, f.imgGhost.name, function(){
        content.className="finder-detail"; content.innerHTML="<h3>"+esc(f.imgGhost.name)+'</h3><img class="fd-img" src="'+f.imgGhost.src+'"><div class="fd-note">'+esc(f.imgGhost.desc)+(S.stage>=2?"<br>"+esc(ST.stage2.ghostImgNote):"")+'</div>';
      });
    }
  }
  function showEncrypted(){
    if(!encOpen){
      content.className="finder-files"; content.innerHTML="";
      var box=el('<div class="pwd-prompt"><div style="font-size:13px;color:#555">「2026.07」已加密</div><input id="enc-pwd" type="password" placeholder="密码？"><div class="pwd-err" id="enc-err"></div><button id="enc-go">解锁</button></div>');
      content.appendChild(box);
      box.querySelector("#enc-go").addEventListener("click", function(){
        var v=box.querySelector("#enc-pwd").value.trim().toLowerCase();
        if(v===f.encPassword){ encOpen=true; showEncInside(); }
        else box.querySelector("#enc-err").textContent="密码不对。（提示：日记里写过——见面的日子，加她的猫。）";
      });
      box.querySelector("#enc-pwd").addEventListener("keydown", function(e){ if(e.key==="Enter") box.querySelector("#enc-go").click(); });
      return;
    }
    showEncInside();
  }
  function showEncInside(){
    pathEl.textContent="2026.07"; clearFiles();
    f.encFiles.forEach(function(ef){
      fileTile(ef.icon, ef.name, function(){
        content.className="finder-detail"; content.innerHTML="<h3>"+esc(ef.name)+'</h3>';
        if(ef.t==="diary"){
          content.appendChild(el('<div class="fd-note">'+esc(ef.desc)+'</div>'));
          if(ef.ev) mark(ef.ev, "手写日记：如果她骗我，我认了。但如果她没有——我不能再让她一个人。");
        } else if(ef.t==="morse"){
          mark(ef.ev, "摩斯对照表：他为了听那段录音准备的。"); S.decoded=true; saveState();
          var tb=el('<table class="morse-table"><tr><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th><th>I</th><th>J</th></tr><tr><td>.-</td><td>-...</td><td>-.-.</td><td>-..</td><td>.</td><td>..-.</td><td>--.</td><td>....</td><td>..</td><td>.---</td></tr><tr><th>K</th><th>L</th><th>M</th><th>N</th><th>O</th><th>P</th><th>Q</th><th>R</th><th>S</th><th>T</th></tr><tr><td>-.-</td><td>.-..</td><td>--</td><td>-.</td><td>---</td><td>.--.</td><td>--.-</td><td>.-.</td><td>...</td><td>-</td></tr><tr><th>U</th><th>V</th><th>W</th><th>X</th><th>Y</th><th>Z</th><th>0</th><th>1</th><th>2</th><th>3</th></tr><tr><td>..-</td><td>...-</td><td>.--</td><td>-..-</td><td>-.--</td><td>--..</td><td>-----</td><td>.----</td><td>..---</td><td>...--</td></tr></table>');
          content.appendChild(tb);
          content.appendChild(el('<div class="fd-note">'+esc(ef.desc)+'</div>'));
          toast("语音备忘录的「分析」按钮解锁了。");
        } else if(ef.t==="folder"){
          content.appendChild(el('<div class="fd-note">'+esc(ef.desc)+'</div>'));
        } else if(ef.t==="exe"){
          content.appendChild(el('<div class="fd-note">unknown.exe · 1.2 MB · 创建时间未知\\n一个你从未见过的程序。要不要运行它？</div>'));
          var rn=el('<button class="vc-btn" style="margin-top:10px">运行 unknown.exe</button>');
          content.appendChild(rn);
          rn.addEventListener("click", openUnknownExe);
        }
      });
    });
  }
  body.querySelector("#f-back").addEventListener("click", showRoot);
  body.querySelector("#f-hidden").addEventListener("click", function(){
    hiddenOn=!hiddenOn;
    body.querySelector("#f-hidden").textContent=hiddenOn?"隐藏隐藏文件":"显示隐藏文件";
    if(hiddenOn){ toast("……有一个文件，不该出现在这里。"); if(pathEl.textContent==="图片") showPictures(); }
  });
  var sideItems=body.querySelectorAll(".fs-i");
  for(var i=0;i<sideItems.length;i++){
    (function(it){ it.addEventListener("click", function(){
      var items=body.querySelectorAll(".fs-i"); for(var j=0;j<items.length;j++) items[j].classList.remove("active");
      it.classList.add("active");
      var loc=it.getAttribute("data-loc");
      if(loc==="root") showRoot(); else if(loc==="download") showDownload(); else if(loc==="documents") showDocuments(); else if(loc==="pictures") showPictures(); else if(loc==="encrypted") showEncrypted();
    }); })(sideItems[i]);
  }
  showRoot();
}

function buildTrash(win, body){
  body.innerHTML='<div class="scroll" style="height:100%"></div>';
  var wrap=body.firstChild;
  ST.trash.forEach(function(t){
    var row=el('<div class="trash-item"><div class="t-icon">'+t.icon+'</div><div><div class="t-name">'+esc(t.name)+'</div><div class="t-del">'+esc(t.del)+'</div></div><button>恢复</button></div>');
    row.querySelector("button").addEventListener("click", function(){
      var b=row.querySelector("button");
      if(t.restoreText){
        b.disabled=true; b.textContent="已恢复";
        mark(t.ev, "她的资料：人设是假的。她本人是真的。");
        wrap.appendChild(el('<div style="padding:14px 16px;border-bottom:1px solid #f0f0f2"><div class="fd-text" style="font-size:13px">'+esc(t.restoreText)+'</div></div>'));
      } else {
        b.disabled=true; b.textContent="已恢复（只是截图/缩略图）"; toast("已恢复到原位置。但没什么可看的。");
      }
    });
    wrap.appendChild(row);
  });
}

function rebootComputer(nextStage){
  S.stage=nextStage; saveState();
  for(var k in S.wins){ try{ closeWin(k); }catch(e){} }
  $("launchpad").classList.remove("open");
  ["screen-desktop","screen-login","screen-boot","screen-ending"].forEach(function(x){ var e=$(x); if(e) e.classList.add("hidden"); });
  var c=$("screen-crash"); if(c) c.classList.remove("hidden");
  setTimeout(function(){
    if(c) c.classList.add("hidden");
    $("screen-boot").classList.remove("hidden");
    setTimeout(boot, 250);
  }, 3400);
}

function showStageDesktop(){
  $("screen-desktop").classList.remove("hidden");
  refreshStageDesktop();
  if(S.stage>=2){
    setTimeout(function(){ toast("电脑自己重启了。", 3000); }, 800);
    setTimeout(function(){ toast("……有些东西，好像不一样了。", 3200); }, 3000);
    setTimeout(function(){ toast("去微信和访达看看。", 3200); }, 5600);
  } else {
    setTimeout(function(){ toast("欢迎回来，李铭泽。", 2600); }, 700);
    setTimeout(function(){ toast("……不对。这是他的电脑。他一个月没回来了。", 3200); }, 2400);
    setTimeout(function(){ toast("先看看微信吧。", 3200); }, 4400);
    if(!S.wxUnlocked){ setTimeout(function(){ toast("微信要密码。桌面上好像有个文件……", 3200); }, 6600); }
  }
}

function refreshStageDesktop(){
  var dl=$("di-letter");
  if(dl){ if(S.stage>=3) dl.classList.remove("hidden"); else dl.classList.add("hidden"); }
  var dt=document.querySelector('[data-app="terminal"]');
  if(dt){ if(S.stage>=1) dt.classList.remove("hidden"); }
}

function openLetter(){
  var id="letter";
  if(S.wins[id]){ S.wins[id].el.style.display="flex"; focusWin(id); return; }
  var win=el('<div class="win" id="win-'+id+'"><div class="win-titlebar"><div class="traffic"><span class="tl-close"></span><span class="tl-min"></span><span class="tl-max"></span></div><div class="win-title">求救信.txt</div></div><div class="win-body"></div></div>');
  win.style.width="480px"; win.style.height="340px"; win.style.left="300px"; win.style.top="150px";
  $("windows").appendChild(win); S.wins[id]={el:win, body:win.querySelector(".win-body")};
  win.querySelector(".win-titlebar").addEventListener("pointerdown", function(e){ focusWin(id); dragWin(win, e); });
  win.querySelector(".tl-close").addEventListener("click", function(e){ e.stopPropagation(); closeWin(id); });
  win.querySelector(".tl-min").addEventListener("click", function(e){ e.stopPropagation(); win.style.display="none"; });
  win.querySelector(".tl-max").addEventListener("click", function(e){ e.stopPropagation(); });
  win.addEventListener("mousedown", function(){ focusWin(id); });
  var b=win.querySelector(".win-body");
  b.style.cssText="padding:28px 32px;background:#fdfbf5;font-family:'Songti SC','SimSun',serif;font-size:15px;line-height:2.15;color:#333;overflow:auto;white-space:pre-wrap";
  b.textContent=ST.stage3.letter;
  focusWin(id);
  toast("这是他自己写的求救信。", 2600);
}

function buildTerminal(win, body){
  body.innerHTML='<div class="term-shell"><div class="term-out" id="term-out"></div><div class="term-in-row"><span class="term-prompt">limingze@MacBook ~ %</span><input id="term-in" autocomplete="off" spellcheck="false"></div></div>';
  var out=body.querySelector("#term-out"), inp=body.querySelector("#term-in");
  var hist=[], hi=-1;
  function print(html){ var d=document.createElement("div"); d.className="term-line"; d.innerHTML=html; out.appendChild(d); out.scrollTop=out.scrollHeight; }
  function line(t, cls){ print(esc(t)); }
  function banner(){
    print('<span class="term-dim">Last login: 8月25日 23:53 on ttys000</span>');
    if(S.stage>=2) print('<span class="term-dim">（上一次登录：8月25日 23:53。但那不是刚才的你。）</span>');
    if(S.stage>=3) print('<span class="term-dim">（命令控制台里，好像多了一样东西……）</span>');
  }
  function help(){
    line("可用指令：");
    line("  help        查看帮助");
    line("  clear       清屏");
    line("  whoami      当前用户");
    line("  date        当前日期");
    line("  ls          列出文件");
    if(S.stage>=3) line("  cat <文件>  查看文件内容");
    if(S.stage===1 && S.decoded) line("  sos         发送求救信号（已解锁）");
    if(S.stage===2 && S.stage2done) line("  515         前往文三路515（已解锁）");
    if(S.stage>=3){ line("  报警        提交报警（可附坐标：报警 30.283,120.133）"); line("  shutdown    关闭电脑"); }
    if(S.stage===1 && !S.decoded) print('<span class="term-dim">（提示：先解码语音备忘录里的摩斯信号。）</span>');
    if(S.stage===2 && !S.stage2done) print('<span class="term-dim">（提示：先转写语音备忘录里那段新录音。）</span>');
  }
  function ls(){
    if(S.stage>=3){ line("求救信.txt  她的资料-补充.txt  …"); }
    else if(S.stage>=2){ line("她的资料-补充.txt  微信.txt  …"); }
    else { line("微信.txt  行程规划.txt  图片  …"); }
  }
  function cat(name){
    if(S.stage>=3 && String(name).indexOf("求救信")>-1){
      print('<span class="term-letter">'+esc(ST.stage3.letter)+'</span>');
      print('<span class="term-dim">（这封信……是你从没见过的。他留的。）</span>');
      return;
    }
    line("cat: "+name+": No such file or directory");
  }
  function run(cmd){
    var c=String(cmd||"").trim();
    print('<span class="term-cmd">limingze@MacBook ~ % '+esc(c)+'</span>');
    if(!c) return;
    var lower=c.toLowerCase();
    if(lower==="help") help();
    else if(lower==="clear"){ out.innerHTML=""; banner(); }
    else if(lower==="whoami") line("limingze");
    else if(lower==="date") line("8月25日 23:53 星期二");
    else if(lower==="ls") ls();
    else if(lower.indexOf("cat ")==0) cat(c.slice(4).trim());
    else if(lower==="sos"){
      if(S.stage===1 && S.decoded){
        line(ST.stage3.terminal.sosOut);
        playWhisper(); flash(150);
        setTimeout(function(){ rebootComputer(2); }, 2200);
      } else if(S.stage===1){ line("坐标未知。先去语音备忘录解码。"); }
      else line("没有这个指令。");
    }
    else if(lower==="515"){
      if(S.stage===2 && S.stage2done){
        line(ST.stage3.terminal.goto515Out);
        playWhisper(); flash(120);
        setTimeout(function(){ rebootComputer(3); }, 2200);
      } else if(S.stage===2){ line("位置未知。先去转写那段新录音。"); }
      else line("没有这个指令。");
    }
    else if(lower.indexOf("报警")===0){
      if(S.stage<3){ line("报警功能不可用。"); return; }
      var coord = c.indexOf("30.283")>-1 || c.indexOf("120.133")>-1;
      line(coord ? "坐标已确认：N30.283, E120.133。正在提交……" : "正在提交报警……");
      setTimeout(function(){ showEnding(coord?"true":"open"); }, 1600);
    }
    else if(lower==="shutdown"){
      line("正在关机……");
      setTimeout(function(){ showEnding("bad"); }, 1400);
    }
    else { line("zsh: command not found: "+c.split(/\s+/)[0]); }
  }
  banner();
  inp.addEventListener("keydown", function(e){
    if(e.key==="Enter"){ var v=inp.value; inp.value=""; if(v.trim()){ hist.push(v); hi=hist.length; } run(v); }
    else if(e.key==="ArrowUp"){ if(hi>0){ hi--; inp.value=hist[hi]||""; } }
    else if(e.key==="ArrowDown"){ if(hi<hist.length-1){ hi++; inp.value=hist[hi]||""; } else { hi=hist.length; inp.value=""; } }
  });
  setTimeout(function(){ inp.focus(); }, 120);
}

function buildSettings(win, body){
  body.innerHTML="";
  var shell=el('<div class="set-shell"><div class="set-side"><div class="set-search"><input id="set-q" placeholder="搜索"></div><div class="set-nav active" data-p="about">关于本机</div><div class="set-nav" data-p="storage">存储空间</div><div class="set-nav" data-p="general">通用</div><div class="set-nav" data-p="reset">重置游戏</div></div><div id="set-main" class="set-main"></div></div>');
  body.appendChild(shell);
  var main=shell.querySelector("#set-main");
  function showAbout(){
    main.innerHTML='<div class="about-row"><div class="about-icon">\uD83D\uDCBB</div><div class="about-info"><div style="font-size:16px;font-weight:600;color:#1d1d1f">李铭泽的 MacBook</div><div style="font-size:13px;color:#666;margin-top:6px">芯片&nbsp; M5 PRO</div><div style="font-size:13px;color:#666">内存&nbsp;&nbsp; 128GB</div><div style="font-size:13px;color:#666">存储&nbsp;&nbsp; 8TB</div><div style="font-size:13px;color:#666">系统&nbsp;&nbsp; macOS 失联版 1.0</div></div></div>'+
      '<div style="font-size:12px;color:#999;margin-top:14px">序列号 &nbsp;MZ2026-0825-2353 &nbsp;·&nbsp; 这台电脑，是他走之前留下的。</div>'+
      '<div style="margin-top:20px;border-top:1px solid #eee;padding-top:14px;font-size:13px;color:#555">当前进度：<br><br>· 章节：第 '+S.stage+' 幕 / 共 3 幕<br>· 微信：'+(S.wxUnlocked?"已解锁":"未解锁")+'<br>· 摩斯对照表：'+(S.decoded?"已找到":"未找到")+'<br>· 深夜录音：'+(S.stage2done?"已转写":"未转写")+'</div>';
  }
  function showStorage(){
    var total=8192; // 8TB in GB
    var items=[["系统", 42, "#8e8e93"],["应用", 6, "#34c759"],["照片", 3, "#ff9500"],["其他", 1, "#af52de"]];
    var sum=52;
    var bars='<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;margin:12px 0">';
    for(var i=0;i<items.length;i++){ bars+='<div style="width:'+(items[i][1]/total*100)+'%;background:'+items[i][2]+'"></div>'; }
    bars+='</div>';
    var rows='';
    for(var i=0;i<items.length;i++){ rows+='<div style="display:flex;justify-content:space-between;font-size:13px;color:#333;padding:7px 0;border-bottom:1px solid #f2f2f4"><span>'+items[i][0]+'</span><span style="color:#999">'+items[i][1]+' GB</span></div>'; }
    main.innerHTML='<h3 style="font-size:15px;margin-bottom:4px">存储空间</h3><div style="font-size:12px;color:#999;margin-bottom:4px">已用 52 GB · 共 8 TB（8,192 GB）——8TB 的电脑，只装得下他一个人。</div>'+bars+rows;
  }
  function showGeneral(){
    main.innerHTML='<h3 style="font-size:15px;margin-bottom:14px">通用</h3>'+
      '<div style="font-size:13px;color:#333;padding:10px 0;border-bottom:1px solid #f2f2f4;display:flex;justify-content:space-between"><span>自动保存进度</span><span style="color:#34c759">已开启</span></div>'+
      '<div style="font-size:13px;color:#333;padding:10px 0;border-bottom:1px solid #f2f2f4;display:flex;justify-content:space-between"><span>开机声音</span><span style="color:#999">已静音（本该如此）</span></div>'+
      '<div style="font-size:13px;color:#333;padding:10px 0;border-bottom:1px solid #f2f2f4;display:flex;justify-content:space-between"><span>时间</span><span style="color:#999">8月25日 23:53（改不动）</span></div>'+
      '<div style="font-size:13px;color:#333;padding:10px 0;display:flex;justify-content:space-between"><span>这台电脑的主人在哪</span><span style="color:#999">未知</span></div>';
  }
  function showReset(){
    main.innerHTML='<h3 style="font-size:15px;margin-bottom:6px">重置游戏</h3>'+
      '<div style="font-size:12px;color:#999;margin-bottom:14px">将删除当前全部进度（章节、已解锁内容、深夜状态），回到最开始的开机画面。</div>'+
      '<button id="set-reset" style="background:#ff3b30;color:#fff;border:none;border-radius:6px;padding:9px 20px;font-size:13px;cursor:pointer">抹掉所有内容和设置</button>'+
      '<div id="set-confirm" class="hidden" style="margin-top:14px;background:#fdf0ef;border:1px solid #ffd4d1;border-radius:8px;padding:12px 14px;font-size:13px;color:#8a2b24">确定要删除当前进度吗？所有章节进度、已解锁内容都将清空，回到最开始。<div style="margin-top:10px;display:flex;gap:10px"><button id="set-cancel" style="background:#fff;border:1px solid #ccc;border-radius:6px;padding:6px 16px;font-size:12px;cursor:pointer">取消</button><button id="set-do" style="background:#ff3b30;color:#fff;border:none;border-radius:6px;padding:6px 16px;font-size:12px;cursor:pointer">删除并重新开始</button></div></div>';
    var rb=main.querySelector("#set-reset");
    var cf=main.querySelector("#set-confirm");
    rb.addEventListener("click", function(){ cf.classList.remove("hidden"); });
    main.querySelector("#set-cancel").addEventListener("click", function(){ cf.classList.add("hidden"); });
    main.querySelector("#set-do").addEventListener("click", function(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} location.reload(); });
  }
  function showSearch(p){
    if(p==="关于"||p==="本机") showAbout();
    else if(p==="存储") showStorage();
    else if(p==="通用") showGeneral();
    else if(p==="重置"||p==="抹掉"||p==="删除") showReset();
    else { showAbout(); }
  }
  shell.querySelectorAll(".set-nav").forEach(function(nv){
    nv.addEventListener("click", function(){
      shell.querySelectorAll(".set-nav").forEach(function(x){ x.classList.remove("active"); });
      nv.classList.add("active");
      var p=nv.getAttribute("data-p");
      if(p==="about") showAbout(); else if(p==="storage") showStorage(); else if(p==="general") showGeneral(); else showReset();
    });
  });
  var sq=shell.querySelector("#set-q");
  sq.addEventListener("input", function(){
    var v=sq.value.trim(); if(!v) return;
    showSearch(v);
  });
  showAbout();
}

function buildXHS(win, body){
  body.innerHTML='<div class="xhs-shell">'+
    '<div class="xhs-topbar"><span class="xhs-brand">小红书</span><div class="xhs-top-tabs"><span class="xhs-tab active">推荐</span><span class="xhs-tab">发现</span></div><div class="xhs-search"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#999" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg><input placeholder="搜索你感兴趣的内容" id="xhs-q"></div></div>'+
    '<div class="xhs-main">'+
      '<div class="xhs-side"><div class="xhs-side-h">分类</div><div class="xhs-nav active">\uD83C\uDFE0 首页</div><div class="xhs-nav">\uD83D\uDD0D 发现</div><div class="xhs-nav">\u2615 生活</div><div class="xhs-nav">\uD83D\uDECF 装修</div><div class="xhs-nav">\uD83C\uDF54 美食</div><div class="xhs-nav">\uD83D\uDC56 时尚</div><div class="xhs-nav">\u2708\uFE0F 旅行</div><div class="xhs-side-h" style="margin-top:18px">热门话题</div><div class="xhs-side-tags" id="xhs-side-tags"></div></div>'+
      '<div class="xhs-feed-wrap"><div class="xhs-feed" id="xhs-feed"></div></div>'+
    '</div>'+
    '<div class="xhs-modal" id="xhs-modal"></div>'+
  '</div>';
  var sideTags=body.querySelector("#xhs-side-tags");
  ["#杭州","#文三路","#杀猪盘","#网恋","#灵异","#减脂","#探店","#游戏"].forEach(function(t){
    var chip=el('<span class="xhs-chip">'+t+'</span>');
    chip.addEventListener("click", function(){ toast("搜索「"+t+"」……（演示）", 2000); });
    sideTags.appendChild(chip);
  });
  var feed=body.querySelector("#xhs-feed");
  var modal=body.querySelector("#xhs-modal");
  var q=body.querySelector("#xhs-q");
  q.addEventListener("input", function(){
    var v=q.value.trim();
    var cards=feed.querySelectorAll(".xhs-card");
    for(var i=0;i<cards.length;i++){
      cards[i].style.display = (!v || cards[i].textContent.indexOf(v)>-1) ? "" : "none";
    }
  });
  function fmtLikes(n){ return n>=10000 ? (n/10000).toFixed(1)+"万" : String(n); }
  ST.xhs.posts.forEach(function(p, idx){
    var card=el('<div class="xhs-card" data-i="'+idx+'">'+
      '<img class="xhs-card-img" src="'+p.imgs[0]+'" loading="lazy" onerror="this.src=\'assets/img-fallback.jpg\'">'+
      '<div class="xhs-card-title">'+esc(p.title)+'</div>'+
      '<div class="xhs-card-meta"><div class="xhs-avatar small">'+(p.avatar.length===1?'<span>'+p.avatar+'</span>':'<img src="'+p.avatar+'">')+'</div><span class="xhs-card-author">'+esc(p.author)+'</span><span class="xhs-card-likes">\u2764 '+fmtLikes(p.likes)+'</span></div>'+
      '<div class="xhs-card-tags">'+p.tags.slice(0,2).map(function(t){ return '#'+esc(t); }).join(' ')+'</div>'+
    '</div>');
    card.addEventListener("click", function(){ openXhsModal(p, idx, modal); });
    feed.appendChild(card);
  });
  body.querySelectorAll(".xhs-top-tabs .xhs-tab").forEach(function(t){
    t.addEventListener("click", function(){
      body.querySelectorAll(".xhs-top-tabs .xhs-tab").forEach(function(x){ x.classList.remove("active"); });
      t.classList.add("active");
    });
  });
  body.querySelectorAll(".xhs-nav").forEach(function(n){
    n.addEventListener("click", function(){
      body.querySelectorAll(".xhs-nav").forEach(function(x){ x.classList.remove("active"); });
      n.classList.add("active");
    });
  });
  modal.addEventListener("click", function(e){ if(e.target===modal) modal.classList.remove("open"); });
}
var XHS_COMMENTS=[
  ["爱吃西柚","真的九十三平嘛为啥看起来这么大","07-25 21:02"],
  ["一颗小汤圆","呜呜呜好温馨，我也想有自己的家了","07-24 22:41"],
  ["干饭王","收藏了，谢谢分享！","07-23 19:15"],
  ["小鹿乱撞","这也太好看了吧","07-22 14:33"],
  ["清醒的雯","姐妹们看清楚，这种话术要警惕","07-21 23:58"],
  ["阿绿在杭州","文三路那边吗？我上次也去了，感觉最近人变少了","07-24 20:17"],
  ["热心市民陈","7月底那边好像出了点事，街上都没什么人","07-26 01:20"],
  ["网管小李","这个我熟，别说了","07-28 03:47"]
];
function openXhsModal(p, idx, modal){
  if(!S.xhsLikes) S.xhsLikes={};
  if(!S.xhsFw) S.xhsFw={};
  if(!S.xhsStar) S.xhsStar={};
  var avHtml = (p.avatar && p.avatar.length===1) ? '<span style="color:#fff">'+p.avatar+'</span>' : '<img src="'+p.avatar+'" alt="">';
  var cmts = [XHS_COMMENTS[(idx*2)%XHS_COMMENTS.length], XHS_COMMENTS[(idx*2+1)%XHS_COMMENTS.length]];
  var cmtHtml = cmts.map(function(c){
    return '<div class="xhs-cmt"><div class="xhs-cmt-av">'+c[0].slice(0,1)+'</div><div class="xhs-cmt-b"><div class="xhs-cmt-name">'+c[0]+'</div><div class="xhs-cmt-text">'+c[1]+'</div><div class="xhs-cmt-time">'+c[2]+'</div></div></div>';
  }).join('');
  modal.innerHTML='<div class="xhs-modal-inner">'+
    '<div class="xhs-m-head"><div class="xhs-avatar">'+avHtml+'</div><div class="xhs-author">'+esc(p.author)+'</div><span class="xhs-follow'+(S.xhsFw[idx]?' followed':'')+'" id="xhs-m-follow">'+(S.xhsFw[idx]?'已关注':'关注')+'</span><span class="xhs-m-date">'+p.date+'</span></div>'+
    '<div class="xhs-m-title">'+esc(p.title)+'</div>'+
    (p.imgs.length?'<div class="xhs-m-imgs">'+p.imgs.map(function(s){ return '<img src="'+s+'">'; }).join('')+'</div>':'')+
    '<div class="xhs-m-body">'+esc(p.body)+'</div>'+
    '<div class="xhs-tags">'+p.tags.map(function(t){ return '<span>#'+esc(t)+'</span>'; }).join('')+'</div>'+
    '<div class="xhs-cmt-h">共 '+(9+idx*3)+' 条评论</div>'+
    '<div class="xhs-cmts">'+cmtHtml+'</div>'+
    '<div class="xhs-m-bar"><span class="xhs-like'+(S.xhsLikes[idx]?' liked':'')+'" id="xhs-m-like">\u2764 '+(S.xhsLikes[idx]?p.likes+1:p.likes)+'</span><span class="xhs-star'+(S.xhsStar[idx]?' starred':'')+'" id="xhs-m-star">'+(S.xhsStar[idx]?'\u2B50 已收藏':'\u2B50 收藏')+'</span><span class="xhs-cm">\uD83D\uDCAC '+(321+idx*137%900)+'</span><input class="xhs-cmt-input" placeholder="说点什么..."><span class="xhs-share">\uD83D\uDD17 分享</span></div>'+
    '<div class="xhs-m-close">\u2715</div>'+
  '</div>';
  modal.classList.add("open");
  modal.querySelector("#xhs-m-close").addEventListener("click", function(){ modal.classList.remove("open"); });
  modal.querySelector("#xhs-m-like").addEventListener("click", function(){
    S.xhsLikes[idx]=!S.xhsLikes[idx];
    this.textContent="\u2764 "+(S.xhsLikes[idx]?p.likes+1:p.likes);
    this.classList.toggle("liked", !!S.xhsLikes[idx]);
  });
  modal.querySelector("#xhs-m-star").addEventListener("click", function(){
    S.xhsStar[idx]=!S.xhsStar[idx];
    this.textContent=S.xhsStar[idx]?"\u2B50 已收藏":"\u2B50 收藏";
    this.classList.toggle("starred", !!S.xhsStar[idx]);
  });
  modal.querySelector("#xhs-m-follow").addEventListener("click", function(){
    S.xhsFw[idx]=!S.xhsFw[idx];
    this.textContent=S.xhsFw[idx]?"已关注":"关注";
    this.classList.toggle("followed", !!S.xhsFw[idx]);
  });
  var ci=modal.querySelector(".xhs-cmt-input");
  ci.addEventListener("keydown", function(e){
    if(e.key==="Enter" && ci.value.trim()){
      var cmt=el('<div class="xhs-cmt"><div class="xhs-cmt-av">我</div><div class="xhs-cmt-b"><div class="xhs-cmt-name">我</div><div class="xhs-cmt-text">'+esc(ci.value.trim())+'</div><div class="xhs-cmt-time">刚刚</div></div></div>');
      modal.querySelector(".xhs-cmts").appendChild(cmt);
      ci.value="";
      var h=modal.querySelector(".xhs-cmt-h");
      h.textContent="共 "+((9+idx*3)+1)+" 条评论";
      toast("评论已发布。……他会不会也刷到过这条？", 3000);
    }
  });
  if(p.plotHint){ setTimeout(function(){ toast(p.plotHint, 3400); }, 600); }
}

/* ============ 结局 ============ */
function showEnding(type){
  window.__curEnding=type; S.voicePlayed=false;
  S.ending=type; saveState();
  ["screen-desktop","screen-login","screen-boot"].forEach(function(s){ $(s).classList.add("hidden"); });
  var e=ST.endings[type];
  $("screen-ending").classList.remove("hidden");
  var t=$("ending-title"), b=$("ending-body"), a=$("ending-actions");
  var img=$("ending-img");
  var imgMap={bad:"assets/wallpaper.webp", open:"assets/p-skyline.webp", true:"assets/p-park.webp"};
  img.src=imgMap[type]||""; img.style.opacity="0";
  t.textContent=e.title; b.textContent=e.text; a.innerHTML="";
  var rst=document.createElement("button"); rst.textContent="重新开始";
  rst.addEventListener("click", function(){ location.reload(); });
  a.appendChild(rst);
  if(type!=="true"){
    var nw=document.createElement("button");
    nw.textContent="深夜 23:53，电脑自己亮起";
    nw.addEventListener("click", function(){
      S.ending=null; saveState();
      $("screen-ending").classList.add("hidden");
      $("screen-desktop").classList.remove("hidden");
      refreshStageDesktop();
      toast("电脑自己亮了起来。", 2500);
      setTimeout(function(){ toast("菜单栏的时间，还是 8 月 25 日 23:53。", 3000); }, 2000);
      setTimeout(function(){ toast("去命令控制台，把坐标报上去。", 3200); }, 4600);
    });
    a.appendChild(nw);
  }
  setTimeout(function(){ t.style.opacity="1"; }, 400);
  setTimeout(function(){ b.style.opacity="1"; }, 1400);
  setTimeout(function(){ a.style.opacity="1"; var h=$("ending-hint"); h.textContent="——点击屏幕任意处继续——"; h.style.opacity=".55"; }, 3400);
}

/* ============ 绑定 ============ */
document.addEventListener("DOMContentLoaded", function(){
  var qs={};
  location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function(a,k,v){ qs[k]=decodeURIComponent(v); });
  var want = window.__DEMO_SCREEN || qs.screen;
  var hasSave = false;
  try{ hasSave = !!localStorage.getItem(SAVE_KEY); }catch(e){}
  var pendingEnding = S.ending;
  if(want==="desktop"){ $("screen-oobe").classList.add("hidden"); $("screen-boot").classList.add("hidden"); $("screen-login").classList.add("hidden"); $("screen-desktop").classList.remove("hidden"); }
  else if(want==="login"){ $("screen-oobe").classList.add("hidden"); $("screen-boot").classList.add("hidden"); $("screen-login").classList.remove("hidden"); }
  else if(hasSave){
    $("screen-oobe").classList.add("hidden");
    $("screen-boot").classList.add("hidden");
    $("screen-login").classList.add("hidden");
    $("screen-desktop").classList.remove("hidden");
    setTimeout(function(){ toast("已恢复上次进度（第 "+S.stage+" 幕）", 3000); }, 900);
  } else if(!hasSave){
    $("screen-oobe").classList.remove("hidden");
    $("screen-boot").classList.add("hidden");
    $("screen-login").classList.add("hidden");
    $("screen-desktop").classList.add("hidden");
  } else {
    setTimeout(boot, 500);
  }
  var og=$("oobe-go");
  if(og){ og.addEventListener("click", function(){ $("screen-oobe").classList.add("hidden"); $("screen-boot").classList.remove("hidden"); setTimeout(boot, 300); }); }
  if(pendingEnding && hasSave){ setTimeout(function(){ showEnding(pendingEnding); }, 1200); }
  $("login-pass").addEventListener("keydown", function(e){ if(e.key==="Enter") tryLogin(); });
  var di=document.getElementById("di-note"); if(di) di.addEventListener("click", openDesktopNote);
  var di2=document.getElementById("di-mac"); if(di2) di2.addEventListener("click", function(){ openApp("finder"); });
  var di3=document.getElementById("di-letter"); if(di3) di3.addEventListener("click", openLetter);
  refreshStageDesktop();
  var dockItems=document.querySelectorAll(".dock-item");
  for(var i=0;i<dockItems.length;i++){
    (function(item){ item.addEventListener("click", function(){ var a=item.getAttribute("data-app"); if(a==="launchpad") toggleLaunchpad(); else openApp(a); }); })(dockItems[i]);
  }
  document.addEventListener("click", function(e){
    if(e.target.id==="lightbox" || e.target.classList.contains("lb-close")){ $("lightbox").classList.add("hidden"); }
    if(e.target.id==="launchpad"){ $("launchpad").classList.remove("open"); }
  });
  document.addEventListener("keydown", function(e){ if(e.key==="Escape"){ $("launchpad").classList.remove("open"); } });
  var lpq=$("lp-q"); if(lpq){ lpq.addEventListener("input", function(){ filterLaunchpad(lpq.value.trim()); }); }
  document.getElementById("launchpad").addEventListener("pointerdown", function(e){ if(e.target.id==="launchpad"){ $("launchpad").classList.remove("open"); } });
  $("screen-ending").addEventListener("click", function(){
    var a=$("ending-actions");
    if(a.style.opacity!=="1"){
      var bb=$("ending-body"); if(bb){ bb.style.transition="opacity 1.2s ease"; bb.style.opacity="0"; }
      var im=$("ending-img"); if(im && im.src){ im.style.opacity="1"; }
      a.style.opacity="1"; var h=$("ending-hint"); h.style.opacity="0";
    }
    if(!S.voicePlayed && window.__curEnding==="true"){
      S.voicePlayed=true;
      var a1=new Audio("assets/voice-ending-lmz.mp3"); a1.play();
      a1.addEventListener("ended", function(){ var a2=new Audio("assets/voice-ending-girl.mp3"); a2.play(); });
    }
  });
  var wantOpen = window.__DEMO_OPEN || (qs.open ? qs.open.split(",") : null);
  if(wantOpen){ wantOpen.forEach(function(a){ setTimeout(function(){ openApp(String(a).trim()); }, 500); }); }
  if(window.__DEMO_END){ setTimeout(function(){ showEnding(String(window.__DEMO_END)); }, 1200); }
});

/* ============ 应用表 ============ */
var APPS = {
  finder: { title:"访达", w:760, h:540, x:70, y:46, build:buildFinder },
  wechat: { title:"微信", w:860, h:600, x:170, y:60, build:buildWeChat },
  safari: { title:"Safari", w:860, h:580, x:90, y:58, build:buildSafari },
  xhs: { title:"小红书", w:1024, h:640, x:100, y:50, build:buildXHS },
  notes: { title:"备忘录", w:660, h:520, x:200, y:70, build:buildNotes },
  photos: { title:"照片", w:720, h:540, x:140, y:64, build:buildPhotos },
  voice: { title:"语音备忘录", w:560, h:470, x:210, y:84, build:buildVoice },
  news: { title:"新闻", w:700, h:560, x:110, y:66, build:buildNews },
  trash: { title:"废纸篓", w:620, h:440, x:240, y:96, build:buildTrash },
  terminal: { title:"终端", w:680, h:460, x:150, y:80, build:buildTerminal },
  settings: { title:"系统设置", w:660, h:480, x:130, y:66, build:buildSettings }
};

})();