import { mount } from '@vue/test-utils';
import App from '@/App.vue'; // Assuming App.vue is in src, so @ refers to src

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    },
    removeItem: function(key) {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});


describe('App.vue', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    // Reset console.warn/error mocks if any
    jest.restoreAllMocks();
  });

  it('initializes with an empty games array if localStorage is empty', () => {
    const wrapper = mount(App);
    expect(wrapper.vm.games).toEqual([]);
  });

  it('handleAddGame method adds a new game to the games array', () => {
    const wrapper = mount(App);
    const initialGamesLength = wrapper.vm.games.length;

    const newGame = {
      id: Date.now(),
      name: 'Test Game',
      storageLocation: 'Test Shelf',
      cards: [{ type: 'Test Card', count: 10, sleeved: false }],
      manualLink: '',
      expansions: [],
      bggId: '12345', // Added
      bggYearPublished: '2021' // Added
    };

    wrapper.vm.handleAddGame(newGame);

    expect(wrapper.vm.games.length).toBe(initialGamesLength + 1);
    expect(wrapper.vm.games[wrapper.vm.games.length - 1]).toEqual(newGame);
  });

  it('loads games from localStorage on mount if data exists (including BGG fields)', () => {
    const sampleGames = [
      { id: 1, name: 'Game 1', storageLocation: 'Shelf A', cards: [], manualLink: '', expansions: [], bggId: '1', bggYearPublished: '2000' },
      { id: 2, name: 'Game 2', storageLocation: 'Shelf B', cards: [], manualLink: '', expansions: [], bggId: null, bggYearPublished: null } // Test with null BGG fields
    ];
    localStorageMock.setItem('boardGamesData', JSON.stringify(sampleGames));

    const wrapper = mount(App);
    expect(wrapper.vm.games).toEqual(sampleGames);
  });

  it('handles malformed JSON in localStorage gracefully', () => {
    localStorageMock.setItem('boardGamesData', 'this is not json');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console error

    const wrapper = mount(App);
    expect(wrapper.vm.games).toEqual([]); // Should default to empty array
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(localStorageMock.getItem('boardGamesData')).toBeNull(); // Should remove the malformed item

    consoleErrorSpy.mockRestore();
  });

  // Watcher functionality is harder to test directly without triggering UI changes
  // that would cause a write. We're already testing handleAddGame and load.
  // A more involved test could be to add a game and then check localStorage content.
  it('saves games to localStorage (including BGG fields) when games array is modified', async () => {
    const wrapper = mount(App);
    const newGame = {
      id: 3,
      name: 'Game 3',
      storageLocation: 'Shelf C',
      cards: [],
      manualLink: '',
      expansions: [],
      bggId: '54321',
      bggYearPublished: '2022'
    };

    wrapper.vm.handleAddGame(newGame); // This should trigger the watcher

    // Wait for Vue's reactivity and watcher to execute
    await wrapper.vm.$nextTick(); // Wait for the next DOM update cycle
    // For watchers, especially deep ones, multiple ticks or specific timing might be needed
    // if the watcher is debounced or relies on other async operations.
    // In this case, the watcher is synchronous after the array mutation.

    const storedGames = JSON.parse(localStorageMock.getItem('boardGamesData'));
    expect(storedGames).toEqual([newGame]);
  });

});
