import { createApp } from 'vue'
import App from './App.vue'
import 'reset-css'
import './utils/requestInit'
import './assets/index.scss'
import router from './router'
import { createPinia } from 'pinia'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
