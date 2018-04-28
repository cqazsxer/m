import axios from 'axios'

export default ({ Vue }) => {
  const musicAPI = { ...axios }
  // musicAPI.defaults.baseURL = 'http://music-api.cqazsxer.cn'
  musicAPI.defaults.baseURL = 'http://localhost:1222'
  Vue.prototype.$musicAPI = musicAPI
}
