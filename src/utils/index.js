import axios from 'axios'
import { API_PATH } from '../../config'

export function startLoading(name) {
  console.log(this, 'this')
  this[name] = true
}
export function endLoading(name) {
  this[name] = false
}

const assocAxios = { ...axios }
assocAxios.defaults.baseURL = API_PATH
export const musicAPI = assocAxios
