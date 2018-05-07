import axios from 'axios'
import { API_PATH } from '../../config'

export default ({ Vue }) => {
  const musicAPI = { ...axios }
  // musicAPI.defaults.baseURL = 'http://music-api.cqazsxer.cn'
  musicAPI.defaults.baseURL = API_PATH
  Vue.prototype.$musicAPI = musicAPI
}
