<style lang="stylus" scoped>
@import '~variables';

.player {
  height: 70px;

  /* width: 100vw; */
  .left {
    flex: 1 1 auto;

    .pic img {
      height: 55px;
      width: 55px;
    }

    .info {
      flex: 1 1 auto;

      span {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        max-width: calc(100vw - 200px);
      }
    }
  }

  .right {
    width: 120px;
    overflow: hidden;

    i {
      display: inline-block;
      width: 48px;
    }
  }
}

.play_list_modal {
  .header {
    border-bottom: 1px solid $grey-8;
  }

  .my_scroll_area {
    max-height: 40vh;
    overflow: auto;
    position: relative;
  }

  ul {
    li {
      border-bottom: 1px solid $grey-5;
      padding: 6px 0;

      &.selectedSong {
        .song_name, .song_ar {
          color: $positive !important;
        }
      }

      .al_pic {
        height: 40px;

        img {
          height: 40px;
          width: 40px;
        }
      }

      .right {
        flex: 1 1 auto;

        .song_info {
          .song_name {
            font-size: 16px;
            max-width: calc(100vw - 120px);
          }

          .song_ar {
            font-size: 14px;
            max-width: calc(100vw - 120px);
          }
        }
      }
    }
  }
}
</style>
<template>
  <div class="player row items-center justify-center">
    <!-- <span>{{ playingSound && playingSound.seek() }}</span>
    <span>{{ playingSound && playingSound.duration() }}</span> -->
    <q-progress @click.native="handleClickProgress"
      :percentage="$seekPercent || 0" />
    <div class="left row">
      <div class="pic q-mx-sm">
        <img :src="playingSong && playingSong.al.picUrl
          || 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'"
          alt="">
      </div>
      <div class="info column justify-center">
        <span class="q-mb-xs">{{ playingSong && playingSong.name
          || '' }}</span>
        <span class="text-grey-6">
          {{ playingSong && playingSong.ar.map(function(artist)
          { return artist.name; }).join(',')
          || '' }}
        </span>
      </div>
    </div>
    <div class="right row">
      <q-icon class="q-mr-sm" @click.native="playOrPause"
        :name="isPlaying ? 'pause arrow' : 'play arrow'"
        size="48px" />
      <q-icon @click.native="togglePlayList" name="queue music"
        size="48px" />
    </div>
    <q-modal v-model="showPlayList" position="bottom"
      class="play_list_modal" :content-css="{}">
      <div class="header row q-pa-sm">
        <div class="playType row items-center">
          <q-icon class="q-mr-sm" @click.native="changePlayType"
            name="repeat" size="35px" />
          <span>顺序播放({{ playList.length }}首)</span>
        </div>
      </div>
      <div class="no_play q-pa-md" v-if="playList.length === 0">
        队列为空！
      </div>
      <div class="my_scroll_area">
        <ul>
          <li v-for="(play, index) in playList" :key="index"
            @click="handleClickPlayList(play)"
            :class="['row', { 'selectedSong': play.song.id === playingSong.id }, 'items-center']">
            <div class="al_pic"><img :src="play.song.al.picUrl"
                alt=""></div>
            <div class="right">
              <div class="song_info column justify-center q-ml-sm">
                <span class="song_name ellipsis">{{ play.song.name }}</span>
                <span class="song_ar text-grey-6 ellipsis">{{ play.song.ar[0].name }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>

    </q-modal>
  </div>

</template>

<script>
import { openURL } from 'quasar'
import { mapState } from 'vuex'
import store from 'src/store'
import Rx from 'rxjs/Rx'

export default {
  name: 'player',
  data() {
    return {
      showPlayList: false
    }
  },
  computed: {
    ...mapState('player', {
      isPlaying: 'isPlaying',
      playingSong: 'playingSong',
      playingSound: 'playingSound',
      playList: 'playList'
    })
  },
  subscriptions() {
    return {
      $seekPercent: Rx.Observable.interval(500).map(() => {
        if (!this.playingSound) {
          return 0
        }
        return this.playingSound.seek() * 100 / this.playingSound.duration()
      })
    }
  },
  created() {},
  methods: {
    openURL,
    playOrPause() {
      store.commit('player/changePlayState', !this.isPlaying)
    },
    togglePlayList() {
      this.showPlayList = !this.showPlayList
    },
    changePlayType() {},
    handleClickPlayList({ song }) {
      store.dispatch('player/changeSong', song.id)
    },
    handleClickProgress({ offsetX }) {
      store.commit('player/setSeek', offsetX / document.body.clientWidth)
    }
  }
}
</script>

<style>

</style>
