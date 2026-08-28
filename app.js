(function(){
"use strict";
var $ = function(id){ return document.getElementById(id); };
var S = { evidence:{}, decoded:false, pseudo:false, wins:{}, zTop:100 };
var ST = window.STORY;

/* ============ 通用 ============ */
function el(html){ var d=document.createElement("div"); d.innerHTML=html; return d.firstElementChild; }
function toast(msg, ms){ var w=$("toast-wrap"); var t=el('<div class="toast">'+msg+'</div>'); w.appendChild(t); setTimeout(function(){ t.style.opacity="0"; t.style.transition="opacity .4s"; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 450); }, ms||2600); }
function flash(ms, dark){ var f=$("flash-overlay"); f.style.opacity=dark?"0.85":"0.6"; f.style.background=dark?"#000":"#fff"; setTimeout(function(){ f.style.opacity="0"; f.style.transition="opacity .5s"; }, ms||120); setTimeout(function(){ f.style.transition=""; }, 700); }
function playTone(freq, dur, vol, when){ try{ var ctx=S.actx||(S.actx=new (window.AudioContext||window.webkitAudioContext)()); var o=ctx.createOscillator(); var g=ctx.createGain(); o.type="sine"; o.frequency.value=freq; g.gain.setValueAtTime(0, ctx.currentTime+(when||0)); g.gain.linearRampToValueAtTime(vol||0.08, ctx.currentTime+(when||0)+0.02); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+(when||0)+dur); o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime+(when||0)); o.stop(ctx.currentTime+(when||0)+dur+0.1); }catch(e){} }
function playChime(){ [523.25,659.25,783.99,1046.5].forEach(function(f,i){ playTone(f, 1.4, 0.05, i*0.12); }); }
function playWhisper(){ playTone(220, 0.5, 0.03, 0); playTone(180, 0.6, 0.02, 0.3); }

/* ============ 证据 ============ */
function mark(ev, msg){ if(S.evidence[ev]) return; S.evidence[ev]=1; if(msg) toast(msg+" （证据 "+Object.keys(S.evidence).length+"/8）"); }

/* ============ 开机 → 登录 ============ */
function boot(){ var fill=$("boot-fill"); var p=0; var iv=setInterval(function(){ p+=3+Math.random()*4; if(p>=100){ p=100; clearInterval(iv); setTimeout(glitchBoot, 350); } fill.style.width=p+"%"; }, 60); }
function glitchBoot(){ var g=$("boot-glitch"); g.style.opacity="0"; g.style.display="flex"; setTimeout(function(){ g.style.transition="opacity .08s"; g.style.opacity="1"; }, 30); setTimeout(function(){ g.style.opacity="0"; }, 300); setTimeout(function(){ g.style.display="none"; g.style.transition=""; $("screen-boot").classList.add("hidden"); $("screen-login").classList.remove("hidden"); setTimeout(function(){ $("login-pass").focus(); }, 300); }, 700); }
function tryLogin(){ var v=$("login-pass").value.trim().toLowerCase(); if(v==="limingze"){ $("screen-login").classList.add("hidden"); $("screen-desktop").classList.remove("hidden"); playChime(); setTimeout(function(){ toast("欢迎回来，李铭泽。"); }, 600); setTimeout(function(){ toast("……不对。这是他的电脑。他一个月没回来了。", 3200); }, 2200); setTimeout(function(){ toast("先看看 QQ 和微信吧。", 3600); }, 4200); } else { var e=$("login-err"); e.classList.remove("hidden"); var c=$("login-pass"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); c.select(); } }

/* ============ 窗口系统 ============ */
function openApp(id){
  var w=S.wins[id]; if(w){ w.el.style.display="flex"; focusWin(id); return; }
  var cfg=APPS[id]; if(!cfg) return;
  var win=el('<div class="win" id="win-'+id+'"><div class="win-titlebar"><div class="traffic"><span class="tl-close"></span><span class="tl-min"></span><span class="tl-max"></span></div><div class="win-title">'+cfg.title+'</div></div><div class="win-body"></div></div>');
  win.style.width=cfg.w+"px"; win.style.height=cfg.h+"px"; win.style.left=(cfg.x||100)+"px"; win.style.top=(cfg.y||50)+"px";
  $("windows").appendChild(win); S.wins[id]={el:win, body:win.querySelector(".win-body")};
  win.querySelector(".win-titlebar").addEventListener("mousedown", function(e){ focusWin(id); dragWin(win, e); });
  win.querySelector(".tl-close").addEventListener("click", function(e){ e.stopPropagation(); closeWin(id); });
  win.querySelector(".tl-min").addEventListener("click", function(e){ e.stopPropagation(); win.style.display="none"; });
  win.querySelector(".tl-max").addEventListener("click", function(e){ e.stopPropagation(); win.style.width=(parseInt(win.style.width)>900?"720px":"min(96vw, 1100px)"); });
  win.addEventListener("mousedown", function(){ focusWin(id); });
  focusWin(id); cfg.build(win, win.querySelector(".win-body"));
}
function focusWin(id){ var w=S.wins[id]; if(!w) return; S.zTop+=1; w.el.style.zIndex=S.zTop; w.el.classList.add("focused"); for(var k in S.wins){ if(k!==id) S.wins[k].el.classList.remove("focused"); } }
function closeWin(id){ var w=S.wins[id]; if(w){ w.el.parentNode.removeChild(w.el); delete S.wins[id]; } }
function dragWin(win, e){ if(e.target.classList.contains("tl-close")||e.target.classList.contains("tl-min")||e.target.classList.contains("tl-max")) return; var sx=e.clientX, sy=e.clientY, lx=win.offsetLeft, ly=win.offsetTop; function mv(ev){ win.style.left=Math.max(-160, Math.min(window.innerWidth-120, lx+ev.clientX-sx))+"px"; win.style.top=Math.max(0, Math.min(window.innerHeight-60, ly+ev.clientY-sy))+"px"; } function up(){ document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); } document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up); }

/* ============ 聊天渲染 ============ */
function avatarFor(name, m){
  if(m && m.av && m.av.length===1){ return '<div class="im-avatar" style="background:'+(m.color||"#cfd6e6")+'">'+m.av+'</div>'; }
  if(m && m.av && m.av.indexOf("assets/")===0){ return '<div class="im-avatar"><img src="'+m.av+'"></div>'; }
  return '<div class="im-avatar" style="background:#cfd6e6">'+(name||"?").slice(0,1)+'</div>';
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function renderChat(container, msgs, opt){
  opt=opt||{}; container.innerHTML="";
  msgs.forEach(function(m){
    var row, who=m.who==="me";
    if(m.t==="time"){ row=el('<div class="m-time">'+esc(m.text)+'</div>'); }
    else if(m.t==="sys"){ row=el('<div class="m-sys">'+esc(m.text)+'</div>'); }
    else if(m.t==="text"){
      var av=who?'<div class="m-av"><img src="assets/avatar.png"></div>':avatarFor(m.name,m);
      var nm=(opt.showName&&!who)?'<div class="m-name">'+esc(m.name)+'</div>':"";
      row=el('<div class="msg '+(who?"me":"")+'">'+av+'<div><div class="m-bubble">'+nm+esc(m.text)+'</div></div></div>');
    }
    else if(m.t==="img"){
      var avi=who?'<div class="m-av"><img src="assets/avatar.png"></div>':avatarFor(m.name,m);
      row=el('<div class="msg '+(who?"me":"")+'">'+avi+'<div><div class="m-bubble"><img class="m-img" src="'+m.src+'"></div></div></div>');
      row.querySelector("img").addEventListener("click", function(){ showLightbox(m.src, m.cap||""); });
    }
    else if(m.t==="expired"){
      var ave=who?'<div class="m-av"><img src="assets/avatar.png"></div>':avatarFor(m.name,m);
      row=el('<div class="msg '+(who?"me":"")+'">'+ave+'<div><div class="m-bubble"><img class="m-expired" src="assets/expired-photo.png"></div></div></div>');
      row.querySelector("img").addEventListener("click", function(e){ ghostExpired(e.currentTarget); });
    }
    else if(m.t==="loc"){
      var avl=who?'<div class="m-av"><img src="assets/avatar.png"></div>':avatarFor(m.name,m);
      row=el('<div class="msg '+(who?"me":"")+'">'+avl+'<div><div class="m-bubble">'+esc(m.label||"")+'<img class="m-loc" src="'+m.src+'"></div></div></div>');
      row.querySelector("img").addEventListener("click", function(){ showLightbox(m.src, m.label||""); });
    }
    else if(m.t==="file"){
      var avf=who?'<div class="m-av"><img src="assets/avatar.png"></div>':avatarFor(m.name,m);
      row=el('<div class="msg '+(who?"me":"")+'">'+avf+'<div><div class="m-bubble"><div class="m-file"><span class="f-icon">'+m.ficon+'</span><span class="f-name">'+esc(m.fname)+'</span></div></div></div></div>');
      row.querySelector(".m-file").addEventListener("click", function(){ toast("已下载到「下载」文件夹。去访达看看。"); });
    }
    else if(m.t==="voice"){
      var avv=who?'<div class="m-av"><img src="assets/avatar.png"></div>':avatarFor(m.name,m);
      row=el('<div class="msg '+(who?"me":"")+'">'+avv+'<div><div class="m-bubble"><div class="m-voice"><span class="v-tri"></span><span class="v-dur">'+m.dur+' 秒</span></div><div class="v-trans">语音转文字：'+esc(m.trans)+'</div></div></div></div>');
      row.querySelector(".m-voice").addEventListener("click", function(){ toast("已播放语音（"+m.dur+" 秒）"); });
    }
    else if(m.t==="sticker"){
      var avs=who?'<div class="m-av"><img src="assets/avatar.png"></div>':avatarFor(m.name,m);
      row=el('<div class="msg '+(who?"me":"")+'">'+avs+'<div><img class="m-sticker" src="'+m.src+'"></div></div>');
    }
    else { return; }
    container.appendChild(row);
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
function buildQQ(win, body){
  var qq=ST.qq; var msgs=qq.messages.slice();
  if(S.pseudo){ msgs.unshift({t:"sys", text:"（系统）8/25 00:00 铭哥 撤回了一条消息"}); }
  var shell=el('<div class="im-shell"></div>');
  var side=el('<div class="im-side"><div class="im-side-head">消息</div><div class="im-contact active"><div class="im-avatar" style="background:#ffd700">\uD83D\uDC39</div><div><div class="im-cname">无畏契约开黑群</div><div class="im-clast">走了</div></div></div><div class="im-side-head">群成员</div><div class="im-contact"><div class="im-avatar" style="background:#5b8def">A</div><div class="im-cname">AP</div></div><div class="im-contact"><div class="im-avatar" style="background:#9b6de8">汐</div><div class="im-cname">汐泊诺思</div></div><div class="im-contact"><div class="im-avatar" style="background:#e86d9b">满</div><div class="im-cname">小满</div></div><div class="im-contact"><div class="im-avatar" style="background:#6d8a9b">熊</div><div class="im-cname">大熊</div></div></div>');
  var main=el('<div class="im-main"><div class="im-chathead">无畏契约开黑群 · 最后消息 7/24 22:58</div><div class="im-chat scroll"></div></div>');
  shell.appendChild(side); shell.appendChild(main); body.appendChild(shell);
  renderChat(main.querySelector(".im-chat"), msgs, {showName:true});
}

function buildWeChat(win, body){
  var wc=ST.wechat;
  var shell=el('<div class="im-shell"></div>');
  var side=el('<div class="im-side"><div class="im-side-head">微信</div><div id="wc-contacts"></div></div>');
  var main=el('<div class="im-main"><div id="wc-chathead" class="im-chathead">选择一个联系人</div><div id="wc-chat" class="im-chat scroll"></div></div>');
  shell.appendChild(side); shell.appendChild(main); body.appendChild(shell);
  var cList=side.querySelector("#wc-contacts");
  wc.contacts.forEach(function(c){
    var item=el('<div class="im-contact" data-id="'+c.id+'"><div class="im-avatar" style="background:'+(c.color||"#cfd6e6")+'">'+c.av+'</div><div><div class="im-cname">'+c.name+'</div><div class="im-clast">'+esc(c.last)+'</div></div></div>');
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
    main.querySelector("#wc-chathead").textContent="与 "+c.name+" 的聊天";
    var chatEl=main.querySelector("#wc-chat"); renderChat(chatEl, msgs, {showName:true});
    if(id==="xibo" && S.pseudo){ chatEl.appendChild(el('<div class="m-sys">（8/25 00:00）汐泊诺思 撤回了一条消息</div>')); }
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
  var btn=el('<button class="vc-btn" disabled>分析滴答声（需要摩斯对照表）</button>');
  c1.appendChild(btn);
  var result=el('<div></div>'); c1.appendChild(result);
  btn.addEventListener("click", function(){
    if(!S.decoded) return;
    result.innerHTML=""; result.appendChild(el('<div class="vc-result">'+esc(vc.decode)+'</div>'));
    mark(2, "摩斯信号：救我 + 坐标。");
  });
  if(S.pseudo){
    var v2=ST.pseudo.voiceNote;
    var c2=card(v2);
    c2.querySelector(".vc-d").style.color="#8e44ad";
    var rb=el('<button class="vc-btn">转写（自动）</button>'); c2.appendChild(rb);
    var r2=el('<div></div>'); c2.appendChild(r2);
    rb.addEventListener("click", function(){ r2.innerHTML=""; r2.appendChild(el('<div class="vc-result">'+esc(v2.decode)+'</div>')); r2.appendChild(el('<div class="vc-ghost">'+esc(v2.ghost)+'</div>')); });
  }
  body.appendChild(wrap);
  var au=c1.querySelector("audio");
  au.addEventListener("ended", function(){ if(!S.pseudo){ c1.appendChild(el('<div class="vc-ghost">'+esc(vc.ghost)+'</div>')); playWhisper(); } });
}

function buildNews(win, body){
  var list=el('<div class="news-list scroll"></div>');
  ST.news.forEach(function(n){
    var item=el('<div class="news-item" data-id="'+n.id+'"><div class="n-t">'+esc(n.title)+'</div><div class="n-m">'+esc(n.src)+'</div></div>');
    item.addEventListener("click", function(){ openNews(n); });
    list.appendChild(item);
  });
  body.appendChild(list);
  function openNews(n){
    body.innerHTML="";
    var paras=esc(n.body).split("\n").join("</p><p>");
    body.appendChild(el('<div class="news-body scroll"><h2>'+esc(n.title)+'</h2><div class="n-src">'+esc(n.src)+'</div><p>'+paras+'</p></div>'));
    if(n.ev) mark(n.ev, "新闻：他可能就是那个「受害者」。");
    if(n.ghost){ setTimeout(function(){ flash(100); setTimeout(function(){ toast("你的电脑闪了一下屏。……可能是显卡的问题。", 3000); }, 400); }, 600); }
  }
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
  function showDownload(){ pathEl.textContent="下载"; clearFiles(); fileTile(f.zip.icon, f.zip.name, showZip); }
  function showZip(){ pathEl.textContent="下载 / 到时候再看"; clearFiles(); f.zipFiles.forEach(function(zf){ fileTile(zf.icon, zf.name, function(){ showZipFile(zf); }); }); }
  function showZipFile(zf){
    content.className="finder-detail"; content.innerHTML="<h3>"+esc(zf.name)+"</h3>";
    if(zf.t==="img"){
      content.appendChild(el('<img class="fd-img'+(zf.blur?" fd-blur":"")+'" src="'+zf.src+'">'));
      content.appendChild(el('<div class="fd-note">'+esc(zf.desc)+'</div>'));
      if(zf.ev) mark(zf.ev, "她真实存在。她不是网图。");
    } else if(zf.t==="voice"){
      content.appendChild(el('<div class="fd-note">'+esc(zf.desc)+'</div>'));
      var b=el('<button class="vc-btn" style="margin-top:10px">播放语音</button>');
      content.appendChild(b);
      b.addEventListener("click", function(){ if(!b.dataset.done){ b.dataset.done="1"; b.textContent="已播放"; toast("（播放中）……末尾，铭泽的声音安静下来。", 2000); setTimeout(function(){ toast("「其实我有点怕。但万一她真的需要我呢。」", 3200); }, 1800); } });
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
    if(S.pseudo){
      fileTile(ST.pseudo.file.icon, ST.pseudo.file.name, function(){
        content.className="finder-detail"; content.innerHTML="<h3>"+esc(ST.pseudo.file.name)+'</h3><div class="fd-text">'+esc(ST.pseudo.file.desc)+'</div>';
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
        content.className="finder-detail"; content.innerHTML="<h3>"+esc(f.imgGhost.name)+'</h3><img class="fd-img" src="'+f.imgGhost.src+'"><div class="fd-note">'+esc(f.imgGhost.desc)+(S.pseudo?"<br>"+esc(ST.pseudo.ghostImgNote):"")+'</div>';
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
          mark(ef.ev, "摩斯对照表：他为了听那段录音准备的。"); S.decoded=true;
          var tb=el('<table class="morse-table"><tr><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th><th>I</th><th>J</th></tr><tr><td>.-</td><td>-...</td><td>-.-.</td><td>-..</td><td>.</td><td>..-.</td><td>--.</td><td>....</td><td>..</td><td>.---</td></tr><tr><th>K</th><th>L</th><th>M</th><th>N</th><th>O</th><th>P</th><th>Q</th><th>R</th><th>S</th><th>T</th></tr><tr><td>-.-</td><td>.-..</td><td>--</td><td>-.</td><td>---</td><td>.--.</td><td>--.-</td><td>.-.</td><td>...</td><td>-</td></tr><tr><th>U</th><th>V</th><th>W</th><th>X</th><th>Y</th><th>Z</th><th>0</th><th>1</th><th>2</th><th>3</th></tr><tr><td>..-</td><td>...-</td><td>.--</td><td>-..-</td><td>-.--</td><td>--..</td><td>-----</td><td>.----</td><td>..---</td><td>...--</td></tr></table>');
          content.appendChild(tb);
          content.appendChild(el('<div class="fd-note">'+esc(ef.desc)+'</div>'));
          toast("语音备忘录的「分析」按钮解锁了。");
        } else if(ef.t==="folder"){
          content.appendChild(el('<div class="fd-note">'+esc(ef.desc)+'</div>'));
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

function buildReport(win, body){
  body.innerHTML="";
  var shell=el('<div class="report-shell scroll"></div>');
  shell.innerHTML='<h3>报警</h3><div class="report-sub">把找到的证据交给警方。\n\n冷静。\n\n（收集越多，警方越可能找到他。）</div>';
  var list=el('<div></div>'); shell.appendChild(list);
  var cnt=el('<div class="ev-count"></div>'); shell.appendChild(cnt);
  var btn=el('<button class="report-btn">提交报警</button>'); btn.addEventListener("click", submitReport); shell.appendChild(btn);
  function refresh(){
    list.innerHTML=""; var n=0;
    ST.evidence.forEach(function(ev){
      var got=!!S.evidence[ev.id]; if(got) n++;
      list.appendChild(el('<div class="ev-item'+(got?" collected":"")+'"><div class="ev-box">'+(got?"\u2713":"")+'</div><div class="ev-t'+(got?"":" miss")+'">'+esc(ev.t)+'</div></div>'));
    });
    cnt.innerHTML="已收集 "+n+" / "+ST.evidence.length+(S.pseudo?' <span style="color:#8e44ad">（深夜，电脑自己亮起来之后，你知道了更多。）</span>':"");
    btn.disabled=(n===0);
  }
  function submitReport(){
    var n=Object.keys(S.evidence).length;
    if(S.pseudo){ showEnding("true"); return; }
    if(n<5) showEnding("bad");
    else if(n<8) showEnding("open");
    else showEnding("true");
  }
  refresh();
  body.appendChild(shell);
}

/* ============ 结局 ============ */
function showEnding(type){
  ["screen-desktop","screen-login","screen-boot"].forEach(function(s){ $(s).classList.add("hidden"); });
  var e=ST.endings[type];
  $("screen-ending").classList.remove("hidden");
  var t=$("ending-title"), b=$("ending-body"), a=$("ending-actions");
  t.textContent=e.title; b.textContent=e.text; a.innerHTML="";
  var rst=document.createElement("button"); rst.textContent="重新开始";
  rst.addEventListener("click", function(){ location.reload(); });
  a.appendChild(rst);
  if(type!=="true"){
    var nw=document.createElement("button");
    nw.textContent="深夜 23:53，电脑自己亮起";
    nw.addEventListener("click", function(){
      S.pseudo=true;
      $("screen-ending").classList.add("hidden");
      $("screen-desktop").classList.remove("hidden");
      toast("电脑自己亮了起来。", 2500);
      setTimeout(function(){ toast("菜单栏的时间，还是 8 月 25 日 23:53。", 3000); }, 2000);
      setTimeout(function(){ toast("群聊里，有一条撤回的消息。去看看吧。", 3200); }, 4600);
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
  if(want==="desktop"){ $("screen-boot").classList.add("hidden"); $("screen-login").classList.add("hidden"); $("screen-desktop").classList.remove("hidden"); }
  else if(want==="login"){ $("screen-boot").classList.add("hidden"); $("screen-login").classList.remove("hidden"); }
  setTimeout(boot, 500);
  $("login-pass").addEventListener("keydown", function(e){ if(e.key==="Enter") tryLogin(); });
  var dockItems=document.querySelectorAll(".dock-item");
  for(var i=0;i<dockItems.length;i++){
    (function(item){ item.addEventListener("click", function(){ openApp(item.getAttribute("data-app")); }); })(dockItems[i]);
  }
  document.addEventListener("click", function(e){
    if(e.target.id==="lightbox" || e.target.classList.contains("lb-close")){ $("lightbox").classList.add("hidden"); }
  });
  $("screen-ending").addEventListener("click", function(){
    var a=$("ending-actions");
    if(a.style.opacity!=="1"){ a.style.opacity="1"; var h=$("ending-hint"); h.style.opacity="0"; }
  });
  var wantOpen = window.__DEMO_OPEN || (qs.open ? qs.open.split(",") : null);
  if(wantOpen){ wantOpen.forEach(function(a){ setTimeout(function(){ openApp(String(a).trim()); }, 500); }); }
  if(window.__DEMO_END){ setTimeout(function(){ showEnding(String(window.__DEMO_END)); }, 1200); }
});

/* ============ 应用表 ============ */
var APPS = {
  finder: { title:"访达", w:760, h:540, x:70, y:46, build:buildFinder },
  qq: { title:"QQ", w:780, h:560, x:120, y:52, build:buildQQ },
  wechat: { title:"微信", w:860, h:600, x:170, y:60, build:buildWeChat },
  safari: { title:"Safari", w:860, h:580, x:90, y:58, build:buildSafari },
  notes: { title:"备忘录", w:660, h:520, x:200, y:70, build:buildNotes },
  photos: { title:"照片", w:720, h:540, x:140, y:64, build:buildPhotos },
  voice: { title:"语音备忘录", w:560, h:470, x:210, y:84, build:buildVoice },
  news: { title:"新闻", w:700, h:560, x:110, y:66, build:buildNews },
  trash: { title:"废纸篓", w:620, h:440, x:240, y:96, build:buildTrash },
  report: { title:"报警", w:640, h:580, x:160, y:72, build:buildReport }
};

})();