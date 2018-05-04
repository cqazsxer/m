import Vue from 'vue'
import Vuex from 'vuex'

import example from './module-example'
import player from './player'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    example,
    player
  }
})

export default store
