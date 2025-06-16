import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import BoardGameList from "../components/BoardGameList.vue";
import GameDetailView from "../views/GameDetailView.vue";
import DashboardView from "../views/DashboardView.vue"; // Import new Dashboard view

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
  { // New Dashboard Route
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
