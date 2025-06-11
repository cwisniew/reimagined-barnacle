import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css"; // Or your main css file

const app = createApp(App);

app.use(createPinia());
app.mount("#app");
