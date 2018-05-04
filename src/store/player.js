const defaultSong = {
  name: '海阔天空',
  id: 347230,
  pst: 0,
  t: 0,
  ar: [
    {
      id: 11127,
      name: 'Beyond',
      tns: [],
      alias: []
    }
  ],
  alia: [],
  pop: 100,
  st: 0,
  rt: '600902000004240302',
  fee: 8,
  v: 31,
  crbt: null,
  cf: '',
  al: {
    id: 34209,
    name: '海阔天空',
    picUrl:
      'http://p1.music.126.net/QHw-RuMwfQkmgtiyRpGs0Q==/102254581395219.jpg',
    tns: [],
    pic: 102254581395219
  },
  dt: 326348,
  h: {
    br: 320000,
    fid: 0,
    size: 13070578,
    vd: 0.109906
  },
  m: {
    br: 160000,
    fid: 0,
    size: 6549371,
    vd: 0.272218
  },
  l: {
    br: 96000,
    fid: 0,
    size: 3940469,
    vd: 0.228837
  },
  a: null,
  cd: '1',
  no: 1,
  rtUrl: null,
  ftype: 0,
  rtUrls: [],
  djId: 0,
  copyright: 1,
  s_id: 0,
  mv: 376199,
  rtype: 0,
  rurl: null,
  mst: 9,
  cp: 7002,
  publishTime: 746812800000
}
import { Howl, Howler } from 'howler'
import Rx from 'rxjs/Rx'

export default {
  namespaced: true,
  state: {
    isPlaying: false,
    playingSound: null, // 当前播放的Howl
    $seek: null,
    playingSong: defaultSong,
    playList: []
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
    changeSong(state, { song, sound }) {
      console.log('song, sound', song, sound)
      if (state.playingSound) {
        state.playingSound.stop()
      }
      state.playingSong = song
      state.playingSound = sound
      state.$seek = Rx.Observable.interval(1000)
        .map(
          () => state.playingSound.seek() * 100 / state.playingSound.duration()
        )
        .do(e => {
          console.log(e)
        })
        .subscribe()

      state.playingSound.play()
      state.isPlaying = true
    }
  },
  actions: {
    getList({ commit }) {}
  }
}