import { createApp } from 'vue';
import { createPinia } from 'pinia'; // Import createPinia
import App from './App.vue';
// import './assets/main.css'; // Or any other global CSS. Original project had `import './assets/main.css'`

const app = createApp(App);

// Create and use Pinia instance
const pinia = createPinia();
app.use(pinia);

app.mount('#app');
