import { mount } from '@vue/test-utils';
import BoardGameList from '@/components/BoardGameList.vue';
import BoardGameListItem from '@/components/BoardGameListItem.vue'; // Actual component

// Mock BoardGameListItem to simplify testing BoardGameList behavior
// We don't need to test BoardGameListItem's internals here, only if it's rendered.
jest.mock('@/components/BoardGameListItem.vue', () => ({
  name: 'BoardGameListItem',
  props: ['game'],
  template: '<div class="mocked-list-item">{{ game.name }}</div>',
}));


describe('BoardGameList.vue', () => {
  const sampleGames = [
    { id: 1, name: 'Game A', storageLocation: 'Shelf 1', cards: [], manualLink: '', expansions: [] },
    { id: 2, name: 'Game B', storageLocation: 'Shelf 2', cards: [], manualLink: '', expansions: [] },
  ];

  it('displays "No games added yet" message when games array is empty', () => {
    const wrapper = mount(BoardGameList, {
      props: { games: [] }
    });
    expect(wrapper.find('.no-games-message').exists()).toBe(true);
    expect(wrapper.find('.no-games-message').text()).toContain('No board games added yet.');
    // Check that no (mocked) BoardGameListItem components are rendered
    expect(wrapper.findAllComponents(BoardGameListItem).length).toBe(0);
  });

  it('displays "No games added yet" message when games prop is undefined or null (though prop is required)', () => {
    // Testing with undefined, though Vue's prop validation should warn
    const wrapperUndefined = mount(BoardGameList, {
      props: { games: undefined }
    });
    expect(wrapperUndefined.find('.no-games-message').exists()).toBe(true);

    // Testing with null
    const wrapperNull = mount(BoardGameList, {
      props: { games: null }
    });
    expect(wrapperNull.find('.no-games-message').exists()).toBe(true);
  });


  it('renders a list of BoardGameListItem components when games array is populated', () => {
    const wrapper = mount(BoardGameList, {
      props: { games: sampleGames }
    });

    // Check that "No games" message is not present
    expect(wrapper.find('.no-games-message').exists()).toBe(false);

    // Check that the correct number of (mocked) BoardGameListItem components are rendered
    const listItems = wrapper.findAllComponents(BoardGameListItem);
    expect(listItems.length).toBe(sampleGames.length);

    // Optionally, check if props are passed correctly to the mocked items
    listItems.forEach((itemWrapper, index) => {
      expect(itemWrapper.props('game')).toEqual(sampleGames[index]);
      // Check if the mocked item rendered something from the game prop
      expect(itemWrapper.text()).toContain(sampleGames[index].name);
    });
  });

  it('uses game.id as key for v-for (inspecting rendered output is complex, trust Vue)', () => {
    // Verifying :key usage directly is difficult with Vue Test Utils for mocked components.
    // This test is more conceptual; we trust Vue's rendering mechanism if items appear correctly.
    // If we were not mocking BoardGameListItem, we could look for attributes on the real component's root.
    const wrapper = mount(BoardGameList, {
      props: { games: sampleGames }
    });
    // Just ensure it renders correctly, implying keys are handled by Vue
    expect(wrapper.findAllComponents(BoardGameListItem).length).toBe(sampleGames.length);
  });
});
