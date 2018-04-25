import axios from 'axios'

export default ({ Vue }) => {
  const musicAPI = { ...axios }
  musicAPI.defaults.baseURL = 'http://localhost:3000'
  Vue.prototype.$musicAPI = musicAPI
}
