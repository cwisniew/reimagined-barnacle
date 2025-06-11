import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import BoardGameList from "../components/BoardGameList.vue"; // Adjusted path
import GameDetailView from "../views/GameDetailView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: BoardGameList,
  },
  {
    path: "/game/:id",
    name: "GameDetail",
    component: GameDetailView,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
