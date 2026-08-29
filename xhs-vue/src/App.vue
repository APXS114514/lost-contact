
<script setup>
import { ref, computed, onMounted } from 'vue'
import { XHS_EXTRA, CHANNELS } from './data/extras'
import { assetUrl, fmtLikes, esc } from './utils'
import DetailModal from './components/DetailModal.vue'

const props = defineProps({
  mountOpts: { type: Object, default: () => ({}) }
})

// 从原生外壳读取剧情数据（单一数据源 story.js）
const posts = ref([])
const activeCat = ref('推荐')
const search = ref('')
const selected = ref(null)   // 当前打开的帖子 { post, idx }
const likedMap = ref({})     // idx -> bool
const followedMap = ref({})  // idx -> bool
const starredMap = ref({})   // idx -> bool

function loadPosts() {
  const raw = (window.STORY && window.STORY.xhs && window.STORY.xhs.posts) || []
  posts.value = raw.map((p, idx) => ({ ...p, idx, extra: XHS_EXTRA[idx] || {} }))
}

const filtered = computed(() => {
  let list = posts.value
  if (activeCat.value !== '推荐' && activeCat.value !== '关注') {
    list = list.filter(p => p.cat === activeCat.value)
  }
  const q = search.value.trim()
  if (q) {
    list = list.filter(p => (p.title + ' ' + (p.body || '') + ' ' + p.tags.join(' ')).toLowerCase().indexOf(q.toLowerCase()) > -1)
  }
  return list
})

function openPost(p) { selected.value = p }
function closePost() { selected.value = null }
function toast(msg, ms) {
  if (props.mountOpts.toast) props.mountOpts.toast(msg, ms)
}

function notifyPlotHint(p) {
  if (p.plotHint && props.mountOpts.plotHint) props.mountOpts.plotHint(p.plotHint)
}

onMounted(() => {
  loadPosts()
})
</script>

<template>
  <div class="xhs-shell">
    <div class="xhs-topbar">
      <div class="xhs-logo"><span class="xhs-brand">小红书</span></div>
      <div class="xhs-search">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#999" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
        <input v-model="search" placeholder="搜索你感兴趣的内容">
      </div>
      <div class="xhs-user"><img :src="'assets/avatar.png'" alt=""></div>
    </div>

    <div class="xhs-channels">
      <span v-for="c in CHANNELS" :key="c" class="xhs-channel" :class="{ active: activeCat === c }" @click="activeCat = c">{{ c }}</span>
    </div>

    <div class="xhs-feed-wrap">
      <div class="xhs-feed">
        <div v-for="p in filtered" :key="p.idx" class="xhs-card" :data-i="p.idx" @click="openPost(p)">
          <div class="xhs-card-imgwrap" :style="{ paddingBottom: (100 / [1.25,0.8,1.05,1.4,0.95,1.15,1.3,0.85,1.0,1.2,0.9,1.35,1.1][p.idx % 13]) + '%' }">
            <img class="xhs-card-img" :src="assetUrl(p.imgs[0])" loading="lazy" @error="$event.target.src = 'assets/xhs/xhs-loading.png'">
          </div>
          <div class="xhs-card-title">{{ p.title }}</div>
          <div class="xhs-card-meta">
            <div class="xhs-avatar small">
              <span v-if="p.avatar && p.avatar.length === 1">{{ p.avatar }}</span>
              <img v-else :src="assetUrl(p.avatar)">
            </div>
            <span class="xhs-card-author">{{ p.author }}</span>
            <span class="xhs-card-likes">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.6 2.5 4.8 6.2 4.3c2.1-.3 4 .7 5.8 2.8 1.8-2.1 3.7-3.1 5.8-2.8 3.7.5 5.7 4.3 4.2 7.4C19.5 16.4 12 21 12 21z"/></svg>
              {{ fmtLikes(p.likes) }}
            </span>
          </div>
        </div>
        <div v-if="filtered.length === 0" class="xhs-empty">没有找到相关内容</div>
      </div>
    </div>

    <DetailModal
      v-if="selected"
      :post="selected"
      :liked-map="likedMap"
      :followed-map="followedMap"
      :starred-map="starredMap"
      @close="closePost"
      @toast="toast"
      @plot="notifyPlotHint"
      @toggle-like="i => likedMap[i] = !likedMap[i]"
      @toggle-follow="i => followedMap[i] = !followedMap[i]"
      @toggle-star="i => starredMap[i] = !starredMap[i]"
    />
  </div>
</template>
