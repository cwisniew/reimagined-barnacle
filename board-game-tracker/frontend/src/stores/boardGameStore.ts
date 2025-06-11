import { defineStore } from "pinia";
import type { BoardGame } from "../types";

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
      this.loading = true; this.error = null;
      try {
        const response = await fetch("/api/boardgames");
        if (!response.ok) { const ed = await response.json().catch(()=>({message:"Fetch failed"})); throw new Error(ed.message||"Failed to fetch");}
        this.games = await response.json();
      } catch (e: any) { this.error = e.message; this.games = []; } finally { this.loading = false; }
    },
    async addGame(newGameData: Omit<BoardGame, "id">) {
      this.loading = true; this.error = null;
      try {
        const response = await fetch("/api/boardgames", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newGameData),
        });
        if (!response.ok) { const ed = await response.json().catch(()=>({message:"Add failed"})); throw new Error(ed.message||"Failed to add");}
        const addedGame = await response.json();
        this.games.push(addedGame);
      } catch (e: any) { this.error = e.message; } finally { this.loading = false; }
    },
    // New action to log a play
    async logPlay(gameId: string) {
      // No global loading indicator for this, could be component-specific
      // this.error = null; // Clear previous general errors
      try {
        const response = await fetch(`/api/boardgames/${gameId}/played`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to log play for game ${gameId}` }));
          throw new Error(errorData.message || `Failed to log play for game ${gameId}`);
        }
        const updatedGame = await response.json() as BoardGame;
        // Update the local store
        const gameIndex = this.games.findIndex(g => g.id === gameId);
        if (gameIndex !== -1) {
          this.games[gameIndex] = updatedGame;
        }
        return true; // Indicate success
      } catch (e: any) {
        // Handle error specifically for this action, maybe set a specific error state or log
        console.error("Error logging play:", e.message);
        // this.error = e.message; // Or a more specific error state
        return false; // Indicate failure
      }
    },
  },
});
