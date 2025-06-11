import { defineStore } from "pinia";
import type { BoardGame, PlaySession } from "../types"; // Import PlaySession

export const useBoardGameStore = defineStore("boardGame", {
  state: () => ({ games: [] as BoardGame[], loading: false, error: null as string | null }),
  getters: { gameCount: (state) => state.games.length },
  actions: {
    async fetchGames() { this.loading=true;this.error=null;try{const r=await fetch("/api/boardgames");if(!r.ok)throw new Error("Failed to fetch games");this.games=await r.json()}catch(e:any){this.error=e.message;this.games=[]}finally{this.loading=false}},
    async addGame(newGameData: Omit<BoardGame, "id">) {
      this.loading=true;this.error=null;
      const payload = { ...newGameData, plays: newGameData.plays || [] };
      try{const r=await fetch("/api/boardgames",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!r.ok)throw new Error("Failed to add game");const added=await r.json();this.games.push(added)}catch(e:any){this.error=e.message}finally{this.loading=false}
    },

    async addPlaySession(gameId: string, playData: Omit<PlaySession, "id">) {
      try {
        const response = await fetch(`/api/boardgames/${gameId}/plays`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(playData),
        });
        if (!response.ok) { const errData = await response.json().catch(()=>({message:"Failed to add play session"})); throw new Error(errData.message); }
        const newPlaySession = await response.json() as PlaySession;
        const gameIndex = this.games.findIndex(g => g.id === gameId);
        if (gameIndex !== -1) {
          if (!this.games[gameIndex].plays) this.games[gameIndex].plays = [];
          this.games[gameIndex].plays!.push(newPlaySession);
          this.games[gameIndex].plays!.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return true;
      } catch (e: any) { console.error("Error adding play session:", e.message); this.error = e.message; return false; }
    },

    async deletePlaySession(gameId: string, playId: string) {
      try {
        const response = await fetch(`/api/boardgames/${gameId}/plays/${playId}`, { method: "DELETE" });
        if (!response.ok) { const errData = await response.json().catch(()=>({message:"Failed to delete play session"})); throw new Error(errData.message); }
        const gameIndex = this.games.findIndex(g => g.id === gameId);
        if (gameIndex !== -1 && this.games[gameIndex].plays) {
          this.games[gameIndex].plays = this.games[gameIndex].plays!.filter(p => p.id !== playId);
        }
        return true;
      } catch (e: any) { console.error("Error deleting play session:", e.message); this.error = e.message; return false; }
    },
  },
});
