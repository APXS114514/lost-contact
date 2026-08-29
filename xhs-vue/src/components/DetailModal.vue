
<script setup>
import { ref, computed } from 'vue'
import { XHS_COMMENTS } from '../data/extras'
import { assetUrl, fmtLikes, esc } from '../utils'

const props = defineProps({
  post: { type: Object, required: true },
  likedMap: { type: Object, required: true },
  followedMap: { type: Object, required: true },
  starredMap: { type: Object, required: true }
})
const emit = defineEmits(['close', 'toast', 'plot', 'toggle-like', 'toggle-follow', 'toggle-star'])

const imgIdx = ref(0)
const commentText = ref('')
const commentCount = ref(24 + props.post.idx * 7)
const myComments = ref([]) // 玩家自己提交的评论

const imgs = computed(() => {
  const list = (props.post.imgs && props.post.imgs.length) ? props.post.imgs : [props.post.imgs[0] || '']
  return list
})
const multi = computed(() => imgs.value.length > 1)
const cmts = computed(() => {
  const idxs = props.post.extra.cmts || [(props.post.idx * 2) % XHS_COMMENTS.length, (props.post.idx * 2 + 1) % XHS_COMMENTS.length]
  return idxs.map(i => XHS_COMMENTS[i % XHS_COMMENTS.length])
})

function prevImg() { if (imgIdx.value > 0) imgIdx.value-- }
function nextImg() { if (imgIdx.value < imgs.value.length - 1) imgIdx.value++ }

function toggleLike() {
  emit('toggle-like', props.post.idx)
}
function toggleFollow() {
  emit('toggle-follow', props.post.idx)
}
function toggleStar() {
  emit('toggle-star', props.post.idx)
}
function submitComment() {
  const v = commentText.value.trim()
  if (!v) return
  commentCount.value++
  myComments.value.push({ name: '我', text: v, time: '刚刚', likes: 0, replies: [] })
  commentText.value = ''
  emit('toast', '评论已发布。……他会不会也刷到过这条？', 3000)
}
</script>

<template>
  <div class="xhs-modal open" @click.self="emit('close')">
    <div class="xhs-modal-card">
      <button class="xhs-modal-close" @click="emit('close')">✕</button>

      <div class="xhs-modal-img">
        <div class="xhs-img-slider" :style="{ transform: 'translateX(-' + imgIdx * 100 + '%)' }">
          <img v-for="(s, i) in imgs" :key="i" :src="assetUrl(s)" @error="$event.target.src = 'assets/xhs/xhs-loading.png'">
        </div>
        <template v-if="multi">
          <button class="xhs-img-nav prev" @click.stop="prevImg" :disabled="imgIdx === 0">‹</button>
          <button class="xhs-img-nav next" @click.stop="nextImg" :disabled="imgIdx === imgs.length - 1">›</button>
          <div class="xhs-img-count">{{ imgIdx + 1 }}/{{ imgs.length }}</div>
        </template>
      </div>

      <div class="xhs-modal-detail">
        <div class="xhs-m-author">
          <div class="xhs-avatar">
            <span v-if="post.avatar && post.avatar.length === 1">{{ post.avatar }}</span>
            <img v-else :src="assetUrl(post.avatar)">
          </div>
          <div class="xhs-m-author-name">
            {{ post.author }}
            <svg v-if="post.extra.verified" class="xhs-verified" viewBox="0 0 16 16" width="16" height="16"><path fill="#ff2442" d="M8 1l1.8 1.2 2.2-.2.6 2.1 1.9 1.1-.8 2 .8 2-1.9 1.1-.6 2.1-2.2-.2L8 14.5 6.2 13.3l-2.2.2-.6-2.1L1.5 10.2l.8-2-.8-2 2-1.1.6-2.1 2.2.2z"/><path fill="#fff" d="M6.6 10.4L4.8 8.6l.9-.9 1 1 2.6-2.7.9.9z"/></svg>
          </div>
          <span class="xhs-follow" :class="{ followed: followedMap[post.idx] }" @click="toggleFollow">{{ followedMap[post.idx] ? '已关注' : '关注' }}</span>
        </div>

        <div class="xhs-m-scroll">
          <div class="xhs-m-title">{{ post.title }}</div>
          <div class="xhs-m-body">{{ post.body }}</div>
          <div class="xhs-tags">
            <span v-for="t in post.tags" :key="t">#{{ t }}</span>
          </div>
          <div class="xhs-m-meta">
            <span>{{ post.date }}</span>
            <span v-if="post.extra.loc" class="xhs-m-loc">📍 {{ post.extra.loc }}</span>
          </div>

          <div class="xhs-divider"></div>
          <div class="xhs-cmt-h">共 {{ commentCount }} 条评论</div>
          <div class="xhs-cmts">
            <div v-for="(c, i) in myComments" :key="'my'+i" class="xhs-cmt">
              <div class="xhs-cmt-av"><img :src="'assets/avatar.png'" alt=""></div>
              <div class="xhs-cmt-b">
                <div class="xhs-cmt-name">我</div>
                <div class="xhs-cmt-text">{{ c.text }}</div>
                <div class="xhs-cmt-foot"><span class="xhs-cmt-time">刚刚</span><span class="xhs-cmt-like">💜 0</span><span class="xhs-cmt-reply">回复</span></div>
              </div>
            </div>
            <div v-for="(c, i) in cmts" :key="i" class="xhs-cmt">
              <div class="xhs-cmt-av">
                <span v-if="c.avatar && c.avatar.length === 1">{{ c.avatar }}</span>
                <img v-else :src="assetUrl(c.avatar)">
              </div>
              <div class="xhs-cmt-b">
                <div class="xhs-cmt-name">{{ c.name }}</div>
                <div class="xhs-cmt-text">{{ c.text }}</div>
                <div class="xhs-cmt-foot">
                  <span class="xhs-cmt-time">{{ c.time }}</span>
                  <span class="xhs-cmt-like">💜 {{ fmtLikes(c.likes) }}</span>
                  <span class="xhs-cmt-reply">回复</span>
                </div>
                <div v-if="c.replies && c.replies.length" class="xhs-replies">
                  <div v-for="(r, ri) in c.replies" :key="ri" class="xhs-reply">
                    <span class="xhs-reply-name">{{ r.name }}：</span>
                    <span class="xhs-reply-text">{{ r.text }}</span>
                    <span class="xhs-reply-like">{{ fmtLikes(r.likes) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="xhs-m-bar">
          <span class="xhs-like" :class="{ liked: likedMap[post.idx] }" @click="toggleLike">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.6 2.5 4.8 6.2 4.3c2.1-.3 4 .7 5.8 2.8 1.8-2.1 3.7-3.1 5.8-2.8 3.7.5 5.7 4.3 4.2 7.4C19.5 16.4 12 21 12 21z"/></svg>
            <em>{{ likedMap[post.idx] ? fmtLikes(post.likes + 1) : fmtLikes(post.likes) }}</em>
          </span>
          <span class="xhs-star" :class="{ starred: starredMap[post.idx] }" @click="toggleStar">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>
            <em>{{ starredMap[post.idx] ? '已收藏' : '收藏' }}</em>
          </span>
          <span class="xhs-cm">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M4 4h16v12H8l-4 4z"/></svg>
            <em>{{ commentCount }}</em>
          </span>
          <span class="xhs-share" @click="emit('toast', '链接已复制。……他会看到吗？', 2600)">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 2l7 7-1.4 1.4L13 6v11h-2V6L6.4 10.4 5 9z"/></svg>
            <em>分享</em>
          </span>
        </div>

        <div class="xhs-m-input-row">
          <input v-model="commentText" class="xhs-cmt-input" placeholder="说点什么..." @keydown.enter="submitComment">
          <span class="xhs-input-send" @click="submitComment">发布</span>
        </div>
      </div>
    </div>
  </div>
</template>
