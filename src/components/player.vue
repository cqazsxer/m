<style lang="stylus" scoped>
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
        max-width: calc(100vw - 140px);
      }
    }
  }

  .right {
    width: 60px;
  }
}
</style>
<template>
  <div class="player row items-center justify-center">
    <!-- <span>{{ playingSound && playingSound.seek() }}</span>
    <span>{{ playingSound && playingSound.duration() }}</span> -->
    <q-progress :percentage="$seek || 0" />
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
      <q-icon @click.native="playOrPause" :name="isPlaying ? 'pause arrow' : 'play arrow'"
        size="48px" class="" />
    </div>

  </div>
</template>

<script>
import { openURL } from 'quasar'
import { mapState } from 'vuex'
import store from 'src/store'

export default {
  name: 'player',
  data() {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop
    }
  },
  computed: {
    ...mapState('player', {
      isPlaying: 'isPlaying',
      playingSong: 'playingSong',
      playingSound: 'playingSound',
      $seek: '$seek'
    })
  },
  methods: {
    openURL,
    playOrPause() {
      store.commit('player/changePlayState', !this.isPlaying)
    }
  }
}
</script>

<style>

</style>
