import { defineStore } from 'pinia';
import axios from 'axios';

// --- API Configuration ---
const API_BASE_URL = 'http://localhost:3000/api';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Type Definition for a Lego Set (remains the same) ---
export interface LegoSet {
  id: number;
  name: string;
  setNumber: string;
  description?: string;
  pictures?: string[];
  numberOfPieces: number;
  numberOfMinifigs: number;
  quantityOwned: number;
  storageLocation?: string;
  isBuilt: boolean;
  status: 'Owned' | 'Wishlist' | 'Ordered';
}

// Type for data when creating a new set (ID is backend-generated)
export type CreateLegoSetData = Omit<LegoSet, 'id'>;
// Type for data when updating a set (all fields optional, ID used for lookup)
export type UpdateLegoSetData = Partial<CreateLegoSetData>;


// --- Pinia Store Definition ---
// It's conventional to name the store hook "use" + store name + "Store"
export const useLegoSetStore = defineStore('legoSet', {
  state: () => ({
    legoSets: [] as LegoSet[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    // Example getter: get all sets (though direct state access is also common)
    getAllSets(state): Readonly<LegoSet[]> {
      return state.legoSets;
    },
    // Example: get a set by ID from the current state
    getSetById(state) {
      return (id: number): Readonly<LegoSet> | undefined => {
        const set = state.legoSets.find(s => s.id === id);
        return set ? readonly(set) : undefined; // Pinia's readonly() is from Vue for deep readonly
      };
    },
  },

  actions: {
    async fetchAllSets() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get<LegoSet[]>('/legosets');
        this.legoSets = response.data; // Directly mutate state in Pinia actions
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || 'Failed to fetch Lego sets.';
        console.error('Error fetching sets:', err);
        this.legoSets = [];
      } finally {
        this.loading = false;
      }
    },

    async addSet(newSetData: CreateLegoSetData): Promise<LegoSet | null> {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post<LegoSet>('/legosets', newSetData);
        this.legoSets.push(response.data); // Add to local state
        return response.data; // Return the newly created set
      } catch (err: any) {
        this.error = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to add Lego set.';
        console.error('Error adding set:', err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchSetById(id: number): Promise<LegoSet | null> {
        this.loading = true;
        this.error = null;
        try {
            const response = await apiClient.get<LegoSet>(`/legosets/${id}`);
            const index = this.legoSets.findIndex(s => s.id === id);
            if (index !== -1) {
                this.legoSets[index] = response.data;
            } else {
                // Optionally add if not in cache, or handle as a specific case
                // For now, just ensuring it's updated if present.
            }
            return response.data;
        } catch (err: any) {
            this.error = err.response?.data?.message || err.message || 'Failed to fetch set by ID.';
            console.error(`Error fetching set ${id}:`, err);
            return null;
        } finally {
            this.loading = false;
        }
    },

    async updateSet(id: number, updatedData: UpdateLegoSetData): Promise<LegoSet | null> {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put<LegoSet | { message: string, id: number, changes: number }>(`/legosets/${id}`, updatedData);

        let updatedSetInStore: LegoSet | null = null;

        if (response.data && typeof (response.data as LegoSet).name !== 'undefined') {
            const updatedSetFromAPI = response.data as LegoSet;
            const setIndex = this.legoSets.findIndex(set => set.id === id);
            if (setIndex !== -1) {
              this.legoSets[setIndex] = { ...this.legoSets[setIndex], ...updatedSetFromAPI };
              updatedSetInStore = this.legoSets[setIndex];
            } else {
              // If not found, might indicate data inconsistency. Refetching all for safety.
              await this.fetchAllSets();
            }
        } else if (response.data && (response.data as {message: string}).message) {
            // If backend returns only a success message, refetch the specific item
            updatedSetInStore = await this.fetchSetById(id); // Ensure this updates the store list
            if (updatedSetInStore) { // If fetchSetById successfully got and updated the set in store
                const setIndex = this.legoSets.findIndex(set => set.id === id);
                if (setIndex !== -1) this.legoSets[setIndex] = updatedSetInStore; else this.legoSets.push(updatedSetInStore); // ensure it's in list
            }
        }
        return updatedSetInStore;
      } catch (err: any) {
        this.error = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update Lego set.';
        console.error('Error updating set:', err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async deleteSet(id: number): Promise<boolean> {
      this.loading = true;
      this.error = null;
      try {
        await apiClient.delete(`/legosets/${id}`);
        const setIndex = this.legoSets.findIndex(set => set.id === id);
        if (setIndex !== -1) {
          this.legoSets.splice(setIndex, 1);
        }
        return true;
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || 'Failed to delete Lego set.';
        console.error('Error deleting set:', err);
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
