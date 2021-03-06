/* eslint-disable no-restricted-syntax */
import Vue from 'vue';
import Vuex from 'vuex';
import client from 'api-client';
import createPersistedState from 'vuex-persistedstate';

Vue.use(Vuex);

const createDataTree = (dataset) => {
  const hashTable = Object.create(null);
  dataset.forEach((aData) => {
    hashTable[aData.id] = {
      ...aData,
      href: `/list/${aData.id}`,
    };
  });
  const dataTree = [];
  dataset.forEach((aData) => {
    if (aData.parentId) {
      if (hashTable[aData.parentId]) {
        if (!('child' in hashTable[aData.parentId])) {
          hashTable[aData.parentId].href = '';
          hashTable[aData.parentId].child = [];
        }
        hashTable[aData.parentId].child.push(hashTable[aData.id]);
      }
    } else {
      dataTree.push(hashTable[aData.id]);
    }
  });
  return dataTree;
};

export default new Vuex.Store({
  state: {
    categoryCatalogue: [],
    categoryCatalogueRaw: [],
    categoryCatalogueFetched: false,
    movieCatalogue: {},
    movieCatalogueFetched: false,
    movies: {},
    moviePositions: {}, // key: contentInfoId, value: video position
    watchedContentInfoIds: [],
    bookmarkedChannels: [],
    showBookmarks: false,
  },
  getters: {
    // eslint-disable-next-line arrow-body-style
    getCategory: state => (id) => {
      return state.categoryCatalogueRaw.find(category => category.id.toString() === id.toString());
    },
    getBookmarkedChannelIndex: state => channel => state.bookmarkedChannels.findIndex(item => item.id === channel.id),
    isChannelBookmarked: (state, getters) => channel => getters.getBookmarkedChannelIndex(channel) > -1,
  },
  mutations: {
    updateCategoryCatalogueRaw(state, data) {
      state.categoryCatalogueRaw = Object.freeze(data);
    },
    updateCategoryCatalogue(state, data) {
      state.categoryCatalogue = Object.freeze(data);
    },
    updateMovieCatalogue(state, data) {
      state.movieCatalogue = Object.freeze(data);
    },
    updateCategoryCatalogueFetched(state, data) {
      state.categoryCatalogueFetched = data;
    },
    updateMovieCatalogueFetched(state, data) {
      state.movieCatalogueFetched = data;
    },
    addMovie(state, data) {
      state.movies[data.id] = Object.freeze(data);
    },
    setMoviePosition(state, data) {
      Vue.set(state.moviePositions, data.contentInfoId, data.position);
    },
    setMovieWatched(state, contentInfoId) {
      if (state.watchedContentInfoIds.indexOf(contentInfoId) === -1) {
        state.watchedContentInfoIds = [...state.watchedContentInfoIds, contentInfoId];
      }
    },
    toggleBookmarkChannel(state, { channel, insert = false }) {
      if (insert) {
        state.bookmarkedChannels = [...state.bookmarkedChannels, channel];
      } else {
        state.bookmarkedChannels.splice(channel, 1);
      }
    },
    setShowBookmarks(state, value) {
      state.showBookmarks = value;
    },
  },
  actions: {
    async GET_CATEGORY_CATALOGUE({ commit }) {
      const categories = await client.fetchCategories();

      commit('updateCategoryCatalogueRaw', categories);
      commit('updateCategoryCatalogue', createDataTree(categories));
      commit('updateCategoryCatalogueFetched', true);
    },
    async GET_MOVIE_CATALOGUE({ commit }) {
      const movies = await client.fetchMovies();

      const moviesMap = Object.assign({}, ...movies.map(item => ({ [item.id]: item })));
      commit('updateMovieCatalogue', moviesMap);
      commit('updateMovieCatalogueFetched', true);
    },
    ADD_MOVIES({ commit }, payload) {
      Object.keys(payload).forEach((item) => {
        commit('addMovie', payload[item]);
      });
    },
    SET_MOVIE_POSITION({ commit }, payload) {
      commit('setMoviePosition', payload);
    },
    SET_MOVIE_WATCHED({ commit }, contentInfoId) {
      commit('setMovieWatched', contentInfoId);
    },
    TOGGLE_BOOKMARK_CHANNEL({ commit, getters }, channel) {
      const channelIndex = getters.getBookmarkedChannelIndex(channel);
      if (channelIndex === -1) {
        commit('toggleBookmarkChannel', { channel, insert: true });
      } else {
        commit('toggleBookmarkChannel', { channel: channelIndex, insert: false });
      }
    },
    SET_SHOW_BOOKMARKS({ commit }, value) {
      commit('setShowBookmarks', value);
    },
  },
  modules: {
  },
  plugins: [createPersistedState({
    reducer: state => ({
      moviePositions: state.moviePositions,
      watchedContentInfoIds: state.watchedContentInfoIds,
      bookmarkedChannels: state.bookmarkedChannels,
      showBookmarks: state.showBookmarks,
    }),
  })],
});
