import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLegoSetStore, type LegoSet, type CreateLegoSetData, type UpdateLegoSetData } from './legoStore'; // Adjusted import for types
import axios from 'axios'; // Will be the mocked version

// Mock axios
vi.mock('axios');

// Helper to create a typed mocked axios
const mockedAxios = vi.mocked(axios, true); // true for deep mock

describe('useLegoSetStore', () => {
  beforeEach(() => {
    // Create a new Pinia instance and make it active so it's picked up by useStore()
    setActivePinia(createPinia());
    // Reset mocks before each test
    // If apiClient is created inside store file and uses axios.create():
    mockedAxios.create.mockReturnValue(mockedAxios);
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedAxios.put.mockReset();
    mockedAxios.delete.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct initial state', () => {
    const store = useLegoSetStore();
    expect(store.legoSets).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  describe('Actions', () => {
    describe('fetchAllSets', () => {
      it('should fetch sets and update state on success', async () => {
        const store = useLegoSetStore();
        const mockSets: LegoSet[] = [
          { id: 1, name: 'Test Set 1', setNumber: '123', numberOfPieces: 100, numberOfMinifigs: 1, quantityOwned: 1, isBuilt: false, status: 'Owned' },
          { id: 2, name: 'Test Set 2', setNumber: '456', numberOfPieces: 200, numberOfMinifigs: 2, quantityOwned: 1, isBuilt: true, status: 'Wishlist' },
        ];
        mockedAxios.get.mockResolvedValue({ data: mockSets });

        await store.fetchAllSets();

        expect(store.loading).toBe(false);
        expect(store.legoSets).toEqual(mockSets);
        expect(store.error).toBeNull();
        expect(mockedAxios.get).toHaveBeenCalledWith('/legosets');
      });

      it('should set error state on fetch failure', async () => {
        const store = useLegoSetStore();
        const errorMessage = 'Network Error';
        mockedAxios.get.mockRejectedValue({ message: errorMessage });

        await store.fetchAllSets();

        expect(store.loading).toBe(false);
        expect(store.legoSets).toEqual([]);
        expect(store.error).toBe(errorMessage);
      });
    });

    describe('addSet', () => {
      it('should add a set and update state on success', async () => {
        const store = useLegoSetStore();
        const newSetData: CreateLegoSetData = { name: 'New Set', setNumber: '789', numberOfPieces: 50, numberOfMinifigs: 0, quantityOwned: 1, isBuilt: false, status: 'Owned' };
        const createdSet: LegoSet = { id: 3, ...newSetData };
        mockedAxios.post.mockResolvedValue({ data: createdSet });

        const result = await store.addSet(newSetData);

        expect(store.loading).toBe(false);
        expect(store.legoSets).toContainEqual(createdSet);
        expect(result).toEqual(createdSet);
        expect(mockedAxios.post).toHaveBeenCalledWith('/legosets', newSetData);
      });

      it('should set error state on add failure', async () => {
        const store = useLegoSetStore();
        const newSetData: CreateLegoSetData = { name: 'New Set', setNumber: '789', numberOfPieces: 50, numberOfMinifigs: 0, quantityOwned: 1, isBuilt: false, status: 'Owned' };
        const errorMessage = 'Failed to add';
        mockedAxios.post.mockRejectedValue({ response: { data: { message: errorMessage } } });

        const result = await store.addSet(newSetData);

        expect(store.loading).toBe(false);
        expect(store.error).toBe(errorMessage);
        expect(result).toBeNull();
      });
    });

    describe('updateSet', () => {
      it('should update a set and state on success when API returns full object', async () => {
        const store = useLegoSetStore();
        const initialSet: LegoSet = { id: 1, name: 'Old Name', setNumber: '111', numberOfPieces: 10, numberOfMinifigs: 1, quantityOwned:1, isBuilt: false, status: 'Owned' };
        store.legoSets = [initialSet]; // Pre-populate state

        const updates: UpdateLegoSetData = { name: 'New Name' };
        const updatedSetFromAPI: LegoSet = { ...initialSet, ...updates };
        mockedAxios.put.mockResolvedValue({ data: updatedSetFromAPI });

        const result = await store.updateSet(1, updates);

        expect(store.loading).toBe(false);
        expect(store.legoSets[0]).toEqual(updatedSetFromAPI);
        expect(result).toEqual(updatedSetFromAPI);
        expect(mockedAxios.put).toHaveBeenCalledWith('/legosets/1', updates);
      });

      it('should update a set and state on success when API returns only a message (requires fetchSetById)', async () => {
        const store = useLegoSetStore();
        const initialSet: LegoSet = { id: 1, name: 'Old Name', setNumber: '111', numberOfPieces: 10, numberOfMinifigs: 1, quantityOwned:1, isBuilt: false, status: 'Owned' };
        store.legoSets = [initialSet];

        const updates: UpdateLegoSetData = { name: 'New Name Message Test' };
        const updatedSetAfterFetch: LegoSet = { ...initialSet, ...updates };

        mockedAxios.put.mockResolvedValue({ data: { message: 'Update successful', id: 1, changes: 1 } });
        // Mock the subsequent fetchSetById call
        mockedAxios.get.mockResolvedValue({ data: updatedSetAfterFetch });


        const result = await store.updateSet(1, updates);

        expect(store.loading).toBe(false);
        expect(mockedAxios.put).toHaveBeenCalledWith('/legosets/1', updates);
        expect(mockedAxios.get).toHaveBeenCalledWith('/legosets/1'); // fetchSetById called
        expect(store.legoSets[0]).toEqual(updatedSetAfterFetch); // State updated by fetchSetById
        expect(result).toEqual(updatedSetAfterFetch);
      });
    });

    describe('deleteSet', () => {
      it('should delete a set and update state on success', async () => {
        const store = useLegoSetStore();
        const initialSet: LegoSet = { id: 1, name: 'Test Set', setNumber: '111', numberOfPieces: 10, numberOfMinifigs: 1, quantityOwned:1, isBuilt: false, status: 'Owned' };
        store.legoSets = [initialSet];
        mockedAxios.delete.mockResolvedValue({});

        const result = await store.deleteSet(1);

        expect(store.loading).toBe(false);
        expect(store.legoSets).not.toContainEqual(initialSet);
        expect(result).toBe(true);
        expect(mockedAxios.delete).toHaveBeenCalledWith('/legosets/1');
      });
    });
  });

  describe('Getters', () => {
    it('getAllSets should return all sets from state', () => {
      const store = useLegoSetStore();
      const mockSets: LegoSet[] = [{ id: 1, name: 'Getter Set', setNumber: 'G1', numberOfPieces: 10, numberOfMinifigs: 1, quantityOwned:1, isBuilt: false, status: 'Owned' }];
      store.legoSets = mockSets; // Manually set state for getter test
      expect(store.getAllSets).toEqual(mockSets);
    });

    it('getSetById should return the correct set or undefined', () => {
      const store = useLegoSetStore();
      const set1: LegoSet = { id: 1, name: 'Set 1', setNumber: 'S1', numberOfPieces: 10, numberOfMinifigs: 1, quantityOwned:1, isBuilt: false, status: 'Owned' };
      const set2: LegoSet = { id: 2, name: 'Set 2', setNumber: 'S2', numberOfPieces: 10, numberOfMinifigs: 1, quantityOwned:1, isBuilt: false, status: 'Owned' };
      store.legoSets = [set1, set2];

      expect(store.getSetById(1)).toEqual(set1);
      expect(store.getSetById(3)).toBeUndefined();
    });
  });
});
