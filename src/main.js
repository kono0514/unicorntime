import Vue from 'vue';
import axios from 'axios';
import VueAxios from 'vue-axios';
import axiosRetry from 'axios-retry';
import { spawn } from 'child_process';
import commandExists from 'command-exists';
import VModal from 'vue-js-modal';
import PortalVue from 'portal-vue';
import VueSidebarMenu from 'vue-sidebar-menu';
import 'vue-sidebar-menu/dist/vue-sidebar-menu.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCaretRight,
  faArrowLeft,
  faCog,
  faStar,
  faSyncAlt,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { faImdb } from '@fortawesome/free-brands-svg-icons';
import Buefy from 'buefy';
import './assets/global.scss';

import App from './App.vue';
import router from './router';
import store from './store';

Vue.config.productionTip = false;

axiosRetry(axios, {
  retries: 3,
  shouldResetTimeout: true,
  retryCondition: error => axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED',
});

Vue.use(VueAxios, axios);
Vue.use(VueSidebarMenu);
Vue.use(PortalVue);
Vue.use(VModal);
Vue.use(Buefy, {
  defaultIconPack: 'fas',
  defaultIconComponent: 'font-awesome-icon',
});

library.add(faCaretRight);
library.add(faArrowLeft);
library.add(faCog);
library.add(faStar);
library.add(faSyncAlt);
library.add(faPlay);
library.add(faImdb);
Vue.component('font-awesome-icon', FontAwesomeIcon);

const player = async (name, src) => {
  let exists = false;
  try {
    exists = await commandExists('mpv');
  } catch (err) {
    // eslint-disable-next-line no-alert
    alert('MPV not found');
  }

  if (exists !== false) {
    let uniOptions = [
      '-user-agent',
      'SEI-RTSP',
      '-rtsp-transport',
      'udp',
      '--demuxer-lavf-o',
      'max_delay=0',
      '--force-media-title',
      name,
    ];
    if (process.env.VUE_APP_API_CLIENT !== 'server') {
      uniOptions = [];
    }
    const child = spawn('mpv', [...uniOptions, src], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    return child;
  }

  return null;
};

const playerPlugin = {
  install() {
    Vue.player = player;
    Vue.prototype.$player = player;
  },
};
Vue.use(playerPlugin);

new Vue({
  router,
  store,
  render: h => h(App),
  beforeCreate() {
    this.$store.dispatch('GET_CATEGORY_CATALOGUE');
    this.$store.dispatch('GET_MOVIE_CATALOGUE');
  },
}).$mount('#app');
