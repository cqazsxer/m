import { Howl, Howler } from 'howler'
import Rx from 'rxjs/Rx'
import { musicAPI } from '../utils'
import * as R from 'ramda'
import { LocalStorage, SessionStorage } from 'quasar'

export default {
  namespaced: true,
  state: {
    isPlaying: false,
    playingSound: null, // 当前播放的Howl
    playingSong: null, // 当前歌曲信息
    playIndex: -1, // 当前播的数组哪个？
    $seek: null,
    // showPlayList: false,
    playList: [] // 默认播放列表
  },
  mutations: {
    changePlayState(state, boolean) {
      state.isPlaying = boolean
      if (boolean) {
        state.playingSound.play()
      } else {
        state.playingSound.pause()
      }
    },
    setSeek(state, newPer) {
      console.log(state, newPer)
      state.playingSound.seek(newPer * state.playingSound.duration())
    },
    setSong(state, newIndex) {
      // 当前有sound就停止
      if (state.playingSound) {
        state.playingSound.stop()
      }
      // song、sound重新赋值
      state.playingSong = state.playList[state.playIndex].song
      state.playingSound = state.playList[state.playIndex].sound
    },
    play(state) {
      state.playingSound.play()
      state.isPlaying = true
    },
    pause(state) {
      state.playingSound.pause()
      state.isPlaying = false
    },
    stop(state) {
      state.playingSound.stop()
      state.isPlaying = false
    },

    addToPlayList(state, { song, sound }) {
      const index = R.findIndex(item => item.song.id === song.id)(
        state.playList
      )
      if (index === -1) {
        state.playIndex = state.playList.push({ song, sound }) - 1
        LocalStorage.set(
          'songidsOfPlayList',
          state.playList.map(({ song: { id } }) => id)
        )
      } else {
        state.playIndex = index
      }
    },
    initPlayList(state, playList) {
      state.playList = playList
      state.playIndex = 0;
    }
  },
  actions: {
    getList({ commit }) {},
    async changeSong({ commit, dispatch, state }, id) {
      if (id === (state.playingSong && state.playingSong.id)) {
        if (state.isPlaying) {
          commit('pause')
        } else {
          commit('play')
        }
      } else {
        const { song, sound } = await dispatch('getSongMp3AndSound', id)
        commit('addToPlayList', { song, sound })
        commit('setSong')
        commit('play')
      }
    },
    playNext({ commit, state }) {
      commit('stop')
      state.playIndex =
        state.playIndex + 1 > state.playList.length - 1
          ? 0
          : state.playIndex + 1

      commit('setSong')
      commit('play')
    },
    playPrev({ commit, state }) {
      commit('stop')
      state.playIndex =
        state.playIndex - 1 < 0
          ? state.playList.length - 1
          : state.playIndex - 1
      state.commit('setSong')
      commit('play')
    },
    // 初始列表
    async init({ commit, state }) {
      const idsArr = LocalStorage.get.item('songidsOfPlayList')
      const ids = idsArr.join(',')
      try {
        const {
          data: { data: mp3sData }
        } = await musicAPI.get(`/music/url?id=${ids}`)

        const songsData = await Promise.all(
          idsArr.map(id => musicAPI.get(`/song/detail?ids=${id}`))
        )
        const mp3s = R.sortBy(R.prop('id'))(mp3sData)
        const songs = R.compose(R.sortBy(R.prop('id')), R.map(songsd => songsd.data.songs[0]))(songsData)
        console.log('songs, mp3s', songs, mp3s);
        const playList = R.map(([song, mp3]) => ({
          song,
          sound: new Howl({
            src: [mp3.url],
            html5: true
          })
        }))(R.zip(songs, mp3s))

        commit('initPlayList', playList)
        commit('setSong')
      } catch (error) {
        console.error('初始化列表', error)
      }
    },
    // 根据歌曲id 获得歌曲详情、歌曲url
    async getSongMp3AndSound({ commit, dispatch }, id) {
      const {
        data: {
          data: [{ url }]
        }
      } = await musicAPI.get(`/music/url?id=${id}`)
      // 单曲详情
      const {
        data: {
          songs: [song]
        }
      } = await musicAPI.get(`/song/detail?ids=${id}`)
      return {
        song,
        sound: new Howl({
          src: [url],
          html5: true,
          onend() {
            dispatch('playNext')
          }
        })
      }
    }
  }
}
