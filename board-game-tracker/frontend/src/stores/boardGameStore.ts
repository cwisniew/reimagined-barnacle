import { defineStore } from "pinia";
import type { BoardGame } from "../types";

// Define the store
export const useBoardGameStore = defineStore("boardGame", {
  state: () => ({
    games: [] as BoardGame[],
    loading: false,
    error: null as string | null,
  }),
  getters: {
    gameCount: (state) => state.games.length,
  },
  actions: {
    async fetchGames() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch("/api/boardgames"); // Proxied by Vite
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to fetch games" }));
          throw new Error(errorData.message || "Failed to fetch games");
        }
        this.games = await response.json();
      } catch (e: any) {
        this.error = e.message;
        this.games = []; // Clear games on error or set to a default state
      } finally {
        this.loading = false;
      }
    },
    async addGame(newGameData: Omit<BoardGame, "id">) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch("/api/boardgames", { // Proxied by Vite
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newGameData),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to add game" }));
          throw new Error(errorData.message || "Failed to add game");
        }
        const addedGame = await response.json();
        this.games.push(addedGame);
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
