
import { createApp } from 'vue'
import App from './App.vue'

// 挂载函数：原生外壳调用 window.__XHSApp.mount(container, { toast, plotHint })
function mountXhs(container, opts) {
  const app = createApp(App, { mountOpts: opts || {} })
  app.mount(container)
  return app
}

window.__XHSApp = { mount: mountXhs }
