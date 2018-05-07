import { Howl, Howler } from 'howler'
import Rx from 'rxjs/Rx'
import { musicAPI } from '../utils'
import * as R from 'ramda'

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
      console.log(state, newPer);
      state.playingSound.seek(newPer * state.playingSound.duration());
    },
    setSong(state) {
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
      const index = R.findIndex(item => item.song.id === state.playingSong.id)(
        state.playList
      )
      // 以存在播放列表 就更新到数组底部
      if (index !== -1) {
        state.playList.splice(index, 1)
        state.playIndex = index
      }
      state.playIndex = state.playList.push({ song, sound }) - 1
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
      const newIndex =
        state.playIndex + 1 > state.playList.length - 1
          ? 0
          : state.playIndex + 1
      state.commit('setSong', state.playList[newIndex])
      commit('play')
    },
    playPrev({ commit, state }) {
      commit('stop')
      const newIndex =
        state.playIndex - 1 < 0
          ? state.playList.length - 1
          : state.playIndex - 1
      state.commit('setSong', state.playList[newIndex])
      commit('play')
    },
    // 初始列表
    async initSongs({ commit, state }) {
      try {
        const ids = 347230
        const {
          data: {
            data: [{ url }]
          }
        } = await musicAPI.get(`/music/url?id=${ids}`)
        // 单曲详情
        const {
          data: {
            songs: [firstSong]
          }
        } = await musicAPI.get(`/song/detail?ids=${ids}`)
        state.playingSong = firstSong
        state.playingSound = new Howl({
          src: [url],
          html5: true
        })
        // commit('changeSong', {
        //   song: firstSong,
        //   sound: new Howl({
        //     src: [url],
        //     html5: true
        //   })
        // })
      } catch (error) {
        console.error(error)
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
