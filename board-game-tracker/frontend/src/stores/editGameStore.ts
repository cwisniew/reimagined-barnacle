import { defineStore } from "pinia";
import type { BoardGame } from "../types";
// import { useBoardGameStore } from "./boardGameStore"; // Not strictly needed here for now

// Creates a deep copy of the game object, handling arrays correctly
const deepCopyGame = (game: BoardGame): BoardGame => {
  return JSON.parse(JSON.stringify(game));
};

export const useEditGameStore = defineStore("editGame", {
  state: () => ({
    gameToEdit: null as BoardGame | null,
    isEditMode: false,
    showForm: false, // Controls visibility of the Add/Edit form
  }),
  actions: {
    setGameToEdit(game: BoardGame | null) {
      if (game) {
        this.gameToEdit = deepCopyGame(game); // Store a copy for editing
        this.isEditMode = true;
        this.showForm = true; // Show form when starting an edit
      } else {
        this.gameToEdit = null;
        this.isEditMode = false;
        // this.showForm = false; // Decide if clearing edit should also hide form
      }
    },
    clearGameToEditAndHideForm() {
      this.gameToEdit = null;
      this.isEditMode = false;
      this.showForm = false;
    },
    enterAddMode() {
      this.gameToEdit = null;
      this.isEditMode = false;
      this.showForm = true;
    },
  },
});
