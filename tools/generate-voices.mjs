// 用小米 MiMo TTS 生成《失联》的全部语音
// 用法: MIMO_API_KEY=xxx node generate-voices.mjs [--all|--one 名字]
// 输出: 素材库/ (或 --out 指定目录)
import fs from "node:fs";
import path from "node:path";

const KEY = (function(){ var cands = [".mimo-key", "../API.mimo-key", "../../API.mimo-key", "../../../API.mimo-key"]; for(var c of cands){ if(fs.existsSync(c)) return fs.readFileSync(c,"utf8").trim(); } return null; })();
if(!KEY){ console.error("缺少 API Key：设置环境变量 MIMO_API_KEY 或在工作区创建 .mimo-key 文件"); process.exit(1); }

const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out")+1] : path.join("..","..","素材库");
fs.mkdirSync(OUT, { recursive: true });

const BASE = "https://api.xiaomimimo.com/v1";

const JOBS = [
  { name: "xibo-final.wav", voice: "白桦", out: "语音-末尾.mp3",
    user: "两个二十出头的男生刚刚还在笑着打闹，忽然安静下来。现在只有一个人说话，声音里带着收住笑意后的认真，语速放缓，压低了声音，有点紧张但坚定。像深夜站在阳台上给老朋友打电话说心里话。",
    text: "(大笑)哈哈哈哈哈——别笑，别笑！(笑声渐止，安静下来，轻声)……其实我有点怕。但万一她真的需要我呢。她一个小孩，在杭州，谁都不认识。万一那些劝我的人是对的呢。可万一她说的都是真的呢。那我就得去。" },
  { name: "tuanzi-voice.wav", voice: "冰糖", out: "帅气鲨团子-语音.mp3",
    user: "十七八岁的女孩，撒娇又带着一点害羞，语气软软的，尾音微微上扬，声音清亮甜美，像在哄人。",
    text: "人家就是想见你嘛～" },
  { name: "tuanzi-voice-b.wav", voice: "茉莉", out: "帅气鲨团子-语音B.mp3",
    user: "同一个女孩，但声音明显更哑、更成熟，像熬夜熬了很久的嗓子，语速稍快，语气带着一丝敷衍和不耐烦。",
    text: "人家就是想见你嘛。" },
  { name: "ending-lmz.wav", voice: "白桦", out: "真结局-铭泽.mp3",
    user: "二十出头的男生，经历了很大的事之后回到朋友中间，声音平静、疲惫又释然，带着一点笑意，语速慢。像劫后余生给老友报平安。",
    text: "兄弟们，我回来了。……带回来一个人。" },
  { name: "ending-girl.wav", voice: "冰糖", out: "真结局-女孩.mp3",
    user: "十九岁的女孩，轻轻的、怯怯的，声音很小，像第一次在很多人面前开口，尾音有点抖。",
    text: "AP 哥哥好。" },
  { name: "ap-whisper.wav", voice: "冰糖", out: "灵异-低语AP.mp3",
    user: "极轻的气声低语，像贴着耳边说话，只说一个名字，几乎听不见，带着一点模仿男生说话的腔调。",
    text: "（气声，极轻）AP。" },
];

async function synth(job){
  const res = await fetch(BASE + "/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mimo-v2.5-tts",
      messages: [
        { role: "user", content: job.user },
        { role: "assistant", content: job.text }
      ],
      audio: { format: "wav", voice: job.voice }
    })
  });
  if(!res.ok){ const t = await res.text(); throw new Error("HTTP " + res.status + ": " + t.slice(0, 300)); }
  const data = await res.json();
  const b64 = data.choices?.[0]?.message?.audio?.data;
  if(!b64) throw new Error("响应中没有 audio.data: " + JSON.stringify(data).slice(0, 300));
  return Buffer.from(b64, "base64");
}

const only = process.argv.indexOf("--one");
const jobs = only > -1 ? JOBS.filter(j => j.name === process.argv[only+1]) : JOBS;

for(const job of jobs){
  try{
    const wav = await synth(job);
    const tmp = path.join(OUT, job.name);
    fs.writeFileSync(tmp, wav);
    // wav -> mp3 (如有 ffmpeg)
    const outFile = path.join(OUT, job.out);
    try{
      const { execSync } = await import("node:child_process");
      execSync('ffmpeg -y -i "' + tmp + '" -codec:a libmp3lame -qscale:a 4 "' + outFile + '"', { stdio: "pipe" });
      fs.unlinkSync(tmp);
      console.log("OK", job.out, fs.statSync(outFile).size + " bytes");
    }catch(e){
      fs.renameSync(tmp, outFile);
      console.log("OK(wav)", job.out, fs.statSync(outFile).size + " bytes (无 ffmpeg，保留 wav)");
    }
  }catch(e){ console.error("FAIL", job.name, e.message); }
}
