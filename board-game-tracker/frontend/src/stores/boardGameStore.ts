import { defineStore } from "pinia";
import type { BoardGame, PlaySession } from "../types";

export const useBoardGameStore = defineStore("boardGame", {
  state: () => ({ games: [] as BoardGame[], loading: false, error: null as string | null }),
  getters: { gameCount: (state) => state.games.length },
  actions: {
    async fetchGames() { this.loading=true;this.error=null;try{const r=await fetch("/api/boardgames");if(!r.ok)throw new Error("Failed to fetch games");this.games=await r.json()}catch(e:any){this.error=e.message;this.games=[]}finally{this.loading=false}},
    async addGame(newGameData: Omit<BoardGame, "id">) {
      this.loading=true;this.error=null; const payload={...newGameData,plays:newGameData.plays||[]};
      try{const r=await fetch("/api/boardgames",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!r.ok)throw new Error("Failed to add game");const added=await r.json();this.games.push(added)}catch(e:any){this.error=e.message}finally{this.loading=false}
    },
    async updateGame(gameId: string, gameData: Partial<BoardGame>) {
      this.loading = true; this.error = null;
      try {
        const response = await fetch(`/api/boardgames/${gameId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gameData),
        });
        if (!response.ok) { const errData = await response.json().catch(()=>({message:"Update failed"})); throw new Error(errData.message); }
        const updatedGame = await response.json() as BoardGame;
        const index = this.games.findIndex(g => g.id === gameId);
        if (index !== -1) this.games[index] = updatedGame;
        return true;
      } catch (e: any) { this.error = e.message; console.error("Error updating game:", e); return false; }
      finally { this.loading = false; }
    },
    async deleteGame(gameId: string) {
      this.loading = true; this.error = null;
      try {
        const response = await fetch(`/api/boardgames/${gameId}`, { method: "DELETE" });
        if (!response.ok && response.status !== 204) {
          const errData = await response.json().catch(()=>({message:"Delete failed"}));
          throw new Error(errData.message || `Failed to delete game ${gameId}`);
        }
        this.games = this.games.filter(g => g.id !== gameId);
        return true;
      } catch (e: any) { this.error = e.message; console.error("Error deleting game:", e); return false; }
      finally { this.loading = false; }
    },
    async addPlaySession(gameId: string, playData: Omit<PlaySession, "id">) {
      try{const r=await fetch(`/api/boardgames/${gameId}/plays`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(playData)});if(!r.ok){const eD=await r.json().catch(()=>({message:"Failed to add play session"}));throw new Error(eD.message)}const nP=await r.json()as PlaySession;const i=this.games.findIndex(g=>g.id===gameId);if(i!==-1){if(!this.games[i].plays)this.games[i].plays=[];this.games[i].plays!.push(nP);this.games[i].plays!.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())}return true}catch(e:any){console.error("Error adding play session:",e.message);this.error=e.message;return false}
    },
    async deletePlaySession(gameId: string, playId: string) {
      try{const r=await fetch(`/api/boardgames/${gameId}/plays/${playId}`,{method:"DELETE"});if(!r.ok){const eD=await r.json().catch(()=>({message:"Failed to delete play session"}));throw new Error(eD.message)}const i=this.games.findIndex(g=>g.id===gameId);if(i!==-1&&this.games[i].plays){this.games[i].plays=this.games[i].plays!.filter(p=>p.id!==playId)}return true}catch(e:any){console.error("Error deleting play session:",e.message);this.error=e.message;return false}
    },
  },
});
