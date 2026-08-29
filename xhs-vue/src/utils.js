
export function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
export function fmtLikes(n) {
  return n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n)
}
// 相对路径补 assets/ 前缀（story.js 存的是相对路径）
export function assetUrl(u) {
  if (!u) return u
  if (u.indexOf('assets/') === 0 || /^(https?:|data:|blob:)/.test(u)) return u
  return 'assets/' + u
}
