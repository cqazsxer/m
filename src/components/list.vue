<style lang="stylus" scoped>
@import '~variables';

.suggestions {
  position: absolute;
  top: 55px;
  left: 0;
  z-index: 2;
  background: #fff;
  width: calc(100vw - 32px);
  margin: 0 16px;

  .q-item.selected {
    background: rgba(189, 189, 189, 0.5);
  }
}

.songs {
  .song {
    line-height: 20px;
    border-bottom: 1px solid $light;

    .left {
      width: calc(100% - 56px);

      .song_name {
        font-size: 16px;
      }

      .artist_and_album {
        font-size: 14px;
        color: grey;
      }
    }

    .right {
      padding: 10px 0;
    }
  }
}

.albums {
  flex: auto;

  .album {
    height: 60px;
    margin-bottom: 4px;

    .right {
      flex: 1 1 auto;
      border-bottom: 1px solid $light;
      margin-left: 10px;

      .album_name {
        margin-bottom: 3px;
        font-size: 17px;
        max-width: calc(100vw - 76px);
      }

      .other_info {
        font-size: 13px;
        color: $grey-14;

        .artist_name {
          margin-right: 5px;
        }
      }
    }

    .pic {
      display: inline-block;
    }

    .pic img {
      width: 60px;
      height: 60px;
    }
  }
}

.q-infinite-scroll, .q-scroll-area, .my_scroll_area {
  height: calc(100vh - 200px);
  overflow: auto;
  position: relative;
}

.infinityContainer {
  width: 100vw;
  height: 100px;
  position: relative;
}

.noMoreItems {
  width: 100vw;
  height: 60px;
}
</style>

<template>
  <q-page class="column">
    <!-- <div>{{ selectedSuggestTxt }}</div> -->
    <div class="column col-12 q-pa-md">
      <q-search autofocus :debounce="0" type="text"
        ref="searchSuggestInput" name="searchSuggest"
        v-model="searchSuggestInputTxt" v-stream:keyup="inputKeyup$"
        v-stream:focus="focus$" v-stream:blur="blur$"
        v-stream:click="inputClick$"></q-search>
      <template v-if="showSuggestions$ && searchSuggestInputTxt !== ''">
        <transition appear enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut">
          <q-list highlight style="padding: 0" class="shadow-1 suggestions relative-position">
            <template v-if="suggestionItems$ && suggestionItems$.length > 0">
              <q-item v-for="(sItem, i) of suggestionItems$"
                :key="sItem.id" :class="[{ 'selected': i === selectIndex$ - 1}, 'cursor-pointer']"
                v-stream:mouseover.native="{ subject: sItemMouseover$, data: { index: i} }"
                v-stream:click.native.stop="{ subject: sItemClick$, data: { label: sItem.label } }">
                <template v-if="sItem.type === 'artist'">
                  <q-item-side>
                    <q-item-tile avatar>
                      <img :src="sItem.img1v1Url">
                    </q-item-tile>
                  </q-item-side>
                  <q-item-main v-if="sItem.type === 'artist'"
                    :label="sItem.label"></q-item-main>
                </template>
                <template v-else>
                  <q-item-main :label="sItem.label"></q-item-main>
                </template>
              </q-item>
            </template>
            <span class="q-pa-md" v-if="suggestionItems$ && suggestionItems$.length === 0 && !suggestionItemsloading">
              无搜索结果
            </span>
            <q-inner-loading :visible="suggestionItemsloading">
              <q-spinner-puff size="50px" color="primary"></q-spinner-puff>
            </q-inner-loading>
          </q-list>
        </transition>
      </template>
    </div>
    <div class="row col-12">
      <q-tabs align="center" class="full-width"
        v-model="selectedTab" no-pane-border>
        <q-tab default slot="title" name="song" icon="library music"
        />
        <q-tab slot="title" name="album" icon="album"
        />
        <q-tab-pane name="song" keep-alive class="q-pa-none songs">
          <div class="my_scroll_area songs_area" v-stream:scroll.native="songsScroll$">
            <div class="my_scroll_area_body songs_body">
              <ul class="column songs">
                <li v-for="(song, index) of songItems$" :key="index"
                  class="row song">
                  <div class="column left justify-center q-pa-sm">
                    <span class="song_name ellipsis">{{ song.name }}</span>
                    <span class="artist_and_album ellipsis">
                      {{ song.artists.map(artist => artist.name).join(',')
                      }} {{ song.artists[0].name
                      }}·{{ song.album.name
                      }}
                    </span>
                  </div>
                  <div class="right">
                    <!-- <q-icon name="more vert" /> -->
                    <q-btn icon="more vert" flat></q-btn>
                  </div>
                </li>
              </ul>
              <div class="infinityContainer" v-if="!noMoreSongItems$">
                <q-inner-loading :visible="songsInfinityScrollLoading">
                  <q-spinner-dots size="50px" color="primary"></q-spinner-dots>
                </q-inner-loading>
              </div>
              <div class="noMoreItems flex items-center justify-center"
                v-if="noMoreSongItems$">
                <transition appear enter-active-class="animated fadeIn"
                  leave-active-class="animated fadeOut">
                  <span>到底啦</span>
                </transition>
              </div>
            </div>
          </div>
        </q-tab-pane>
        <q-tab-pane name="album" keep-alive class="q-pa-none albums">
          <div class="my_scroll_area albums_area" v-stream:scroll.native="albumsScroll$">
            <div class="my_scroll_area_body albums_body">
              <ul class="column albums">
                <li v-for="(album, index) of albumItems$"
                  :key="index" class="row album no-wrap">
                  <div class="left">
                    <span class="pic"><img :src="album.picUrl"
                        alt=""></span>
                  </div>
                  <div class="right column justify-center">
                    <span class="album_name ellipsis">{{ album.name}}</span>
                    <div class="row other_info ellipsis">
                      <span class="artist_name">{{ album.artist.name
                        }}
                      </span>
                      <span class="artist_name">{{ date.formatDate(album.publishTime,
                        'YYYY-MM-DD') }}</span>
                    </div>

                  </div>
                </li>
              </ul>
              <div class="infinityContainer" v-if="!noMoreAlbumItems$">
                <q-inner-loading :visible="albumsInfinityScrollLoading">
                  <q-spinner-dots size="50px" color="primary"></q-spinner-dots>
                </q-inner-loading>
              </div>
              <div class="noMoreItems flex items-center justify-center"
                v-if="noMoreAlbumItems$">
                <transition appear enter-active-class="animated fadeIn"
                  leave-active-class="animated fadeOut">
                  <span>到底啦</span>
                </transition>
              </div>
            </div>
          </div>
        </q-tab-pane>
      </q-tabs>
    </div>
  </q-page>
</template>

<style>

</style>

<script>
import * as R from 'ramda'
import Rx from 'rxjs/Rx'
import { date } from 'quasar'

const MAX_SONG_SUGGESTION_COUNT = 6
const MAX_ARTIST_SUGGESTION_COUNT = 2
const MAX_SUGGESTION_COUNT =
  MAX_SONG_SUGGESTION_COUNT + MAX_ARTIST_SUGGESTION_COUNT
const SONGS_PER_PAGE = 30
const ALBUMS_PER_PAGE = 8
const TriggerHieght = 200 // 触发下一页的高度
export default {
  name: 'PageIndex',
  data() {
    return {
      searchSuggestInputTxt: '',
      suggestionItemsloading: false,
      songsInfinityScrollLoading: false,
      albumsInfinityScrollLoading: false,
      selectedTab: 'songs',
      date
    }
  },
  domStreams: [
    'inputKeyup$',
    'focus$',
    'blur$',
    'sItemMouseover$',
    'sItemClick$',
    'inputClick$',
    'songsScroll$',
    'albumsScroll$'
  ],
  subscriptions() {
    // 下拉的建议项$
    const suggestionItems$ = Rx.Observable.merge(
      Rx.Observable.of([]),
      this.$watchAsObservable('searchSuggestInputTxt')
        .do(() => {
          this.suggestionItemsloading = true
        })
        .debounceTime(400)
        .pluck('newValue')
        .filter(R.complement(R.equals('')))
        .distinctUntilChanged()
        .switchMap(txt =>
          Rx.Observable.zip(
            this.$musicAPI.get(`/search/suggest?keywords=${txt}&type=10`),
            Rx.Observable.fromPromise(
              this.$musicAPI.get(`/search?keywords=${txt}`)
            )
          )
        )
        .map(this.handleSuggestionsData)
        .do(() => {
          this.suggestionItemsloading = false
        })
    ).share()
    // 选中的建议项序号$
    // 来源一：单击
    // 来源二：enter （！delay是为了复原到index = 1)
    // 来源三：上下箭头
    const selectIndex$ = Rx.Observable.merge(
      this.sItemClick$.mapTo({ value: 1, type: 'set' }),
      this.inputKeyup$
        .pluck('event', 'msg', 'keyCode')
        .filter(R.equals(13))
        .mapTo({ value: 1, type: 'set' })
        .delay(100),
      this.inputKeyup$
        .pluck('event', 'msg', 'keyCode')
        .map(
          R.cond([
            [R.equals(38), R.always({ value: -1, type: 'up' })],
            [R.equals(40), R.always({ value: 1, type: 'down' })],
            [
              R.anyPass([
                R.both(R.gte(R.__, 65), R.lte(R.__, 90)),
                R.both(R.gte(R.__, 48), R.lte(R.__, 57)),
                R.both(R.gte(R.__, 96), R.lte(R.__, 105)),
                R.equals(8) // backspace
              ]),
              R.always({ value: 1, type: 'set' })
            ],
            // [R.equals(13), Rx.Observable.of(1).delay],
            [R.T, R.always(0)]
          ])
        )
        .filter(R.complement(R.equals(0)))
    )
      .scan((acc, { value, type }) => {
        const newAcc = R.defaultTo(acc + value)(acc.value)
        return R.cond([
          [R.equals('set'), R.always(value)],
          [
            R.T,
            () =>
              R.cond([
                [R.lt(R.__, 1), R.always(MAX_SUGGESTION_COUNT)],
                [R.gt(R.__, MAX_SUGGESTION_COUNT), R.always(1)],
                [R.T, R.always(newAcc)]
              ])(newAcc)
          ]
        ])(type)
      }, 0)
      .merge(Rx.Observable.of(1))
      .share()

    // 展示建议框$
    const showSuggestions$ = Rx.Observable.merge(
      Rx.Observable.of(false),
      this.focus$.mapTo(true),
      this.blur$.mapTo(false),
      this.inputClick$.mapTo(true),
      this.inputKeyup$.mapTo(true),
      this.inputKeyup$
        .filter(({ event }) => event.msg.keyCode === 13)
        // .do(() => this.$refs.searchSuggestInput.blur())
        .mapTo(false)
    ).share()

    // 选中的建议文本$
    const selectedSuggestTxt$ = Rx.Observable.combineLatest(
      selectIndex$,
      suggestionItems$
    )
      .map(([value, arr]) => (arr.length > 0 ? arr[value - 1].label : ''))
      .do(e => {
        console.log('当前建议文本', e)
      })
      .publishBehavior()
      .refCount()
    // .subscribe()
    // 输入框回车、单击选中的文本流
    const txtAfterSearch$ = new Rx.Subject()
      .merge(
        this.sItemClick$.pluck('data', 'label'),
        this.inputKeyup$
          .filter(({ event }) => event.msg.keyCode === 13)
          .switchMap(() => selectedSuggestTxt$.take(1))
      )
      .do(txt => {
        this.searchSuggestInputTxt = txt
      })
      .takeWhile(R.compose(R.complement, R.isNil))
      .share()
    // 搜索产生的songs$(仅一页)
    const songItemsAfterSearch$ = txtAfterSearch$
      .switchMap(txt =>
        Rx.Observable.fromPromise(
          this.$musicAPI.get(
            `/search?keywords=${txt}&type=1&offset=0&limit=${SONGS_PER_PAGE}`
          )
        )
      )
      .pluck('data', 'result', 'songs')
      .map(R.defaultTo([]))
      .share()

    // 下滑产生的分页songs流
    const songsItemsByScroll$ = Rx.Observable.combineLatest(
      this.songsScroll$
        .debounceTime(50)
        .filter(
          ({ event: { target } }) =>
            Math.abs(
              target.querySelector('.my_scroll_area_body.songs_body')
                .offsetHeight -
                target.offsetHeight -
                target.scrollTop
            ) <= TriggerHieght
        )
        .mapTo(1)
        .scan((acc, value) => acc + value, 1),
      selectedSuggestTxt$
    )
      .do(([page, txt]) => {
        this.songsInfinityScrollLoading = true
        console.log('[page, txt]', page, txt)
      })
      .switchMap(([page, txt]) =>
        Rx.Observable.fromPromise(
          this.$musicAPI.get(
            `/search?keywords=${txt}&type=1&offset=${(page - 1) *
              SONGS_PER_PAGE}&limit=${SONGS_PER_PAGE}`
          )
        )
      )
      .do(() => {
        this.songsInfinityScrollLoading = false
      })
      .pluck('data', 'result', 'songs')
      .map(R.defaultTo([]))
      .takeWhile(R.compose(R.complement(R.equals(0)), R.length)) // 数组有长度才发送这个值
      .share()
    // 歌曲流
    const songItems$ = songItemsAfterSearch$
      .do(() => {
        document.querySelector('.my_scroll_area.songs_area').scrollTop = 0
      })
      .switchMap(initArr =>
        songsItemsByScroll$.startWith(initArr).scan(R.concat, [])
      )

    const noMoreSongItems$ = Rx.Observable.merge(
      songItemsAfterSearch$.mapTo(false),
      songItemsAfterSearch$.switchMap(() =>
        songsItemsByScroll$.map(R.compose(R.lt(R.__, SONGS_PER_PAGE), R.length))
      )
    ).do(e => {
      console.log('noMoreSongItems$', e)
    })
    // 搜索产生的albums$(仅一页)
    const albumItemsAfterSearch$ = txtAfterSearch$
      .filter(() => this.selectedTab === 'album')
      .delay(1)
      .switchMap(txt =>
        Rx.Observable.fromPromise(
          this.$musicAPI.get(
            `/search?keywords=${txt}&type=10&offset=0&limit=${ALBUMS_PER_PAGE}`
          )
        )
      )
      .pluck('data', 'result', 'albums')
      .map(R.defaultTo([]))
      .do(console.log)
      .share()
    // 下滑产生的专辑流
    const albumItemsByScroll$ = Rx.Observable.combineLatest(
      this.albumsScroll$
        .debounceTime(50)
        // .takeWhile(() => this.selectedTab === 'album')
        .filter(
          ({ event: { target } }) =>
            Math.abs(
              target.querySelector('.my_scroll_area_body.albums_body')
                .offsetHeight -
                target.offsetHeight -
                target.scrollTop
            ) <= TriggerHieght
        )
        .mapTo(1)
        .scan((acc, value) => acc + value, 1),
      selectedSuggestTxt$
    )
      .do(() => {
        this.albumsInfinityScrollLoading = true
      })
      .switchMap(([page, txt]) =>
        Rx.Observable.fromPromise(
          this.$musicAPI.get(
            `/search?keywords=${txt}&type=10&offset=${(page - 1) *
              ALBUMS_PER_PAGE}&limit=${ALBUMS_PER_PAGE}`
          )
        )
      )
      .do(() => {
        this.albumsInfinityScrollLoading = false
      })
      .pluck('data', 'result', 'albums')
      .map(R.defaultTo([]))
      .takeWhile(R.compose(R.complement(R.equals(0)), R.length)) // 数组有长度才发送这个值
      .do(e => {
        console.log('下滑产生的专辑', e)
      })
      .share()

    // 专辑流
    const albumItems$ = albumItemsAfterSearch$
      .do(() => {
        document.querySelector('.my_scroll_area.albums_area').scrollTop = 0
      })
      .switchMap(initArr =>
        albumItemsByScroll$.startWith(initArr).scan(R.concat, [])
      )
      .do(e => {
        console.log('当前albumItems$', e)
      })

    const noMoreAlbumItems$ = Rx.Observable.merge(
      albumItemsAfterSearch$.mapTo(false),
      albumItemsAfterSearch$.switchMap(() =>
        albumItemsByScroll$.map(
          R.compose(R.lt(R.__, ALBUMS_PER_PAGE), R.length)
        )
      )
    ).do(e => {
      console.log('noMoreSongItems$', e)
    })
    // 切换tab
    this.$watchAsObservable('selectedTab')
      .pluck('newValue')
      .filter(R.complement(R.equals('song')))
      .do(e => {
        console.log("$watchAsObservable('selectedTab')", e)
      })
      .subscribe()
    return {
      suggestionItems$,
      showSuggestions$,
      selectIndex$,
      selectedSuggestTxt$,
      songItems$,
      noMoreSongItems$,
      albumItems$,
      noMoreAlbumItems$
    }
  },
  created() {},
  methods: {
    handleSuggestionsData([ArtistSuggestionsData, songsSuggestionsData]) {
      const { songs } = songsSuggestionsData.data.result
      const { artists } = ArtistSuggestionsData.data.result
      const artistSuggestions = R.ifElse(
        R.complement(R.isNil),
        R.compose(
          R.take(MAX_ARTIST_SUGGESTION_COUNT),
          R.map(({ name, ...others }) => ({
            label: `${name}`,
            ...others,
            type: 'artist'
          }))
        ),
        R.always([])
      )(artists)
      const songSuggestions = R.ifElse(
        R.complement(R.isNil),
        R.compose(
          R.take(MAX_SONG_SUGGESTION_COUNT),
          R.map(({ name, artists: artists_, ...others }) => ({
            label: `${R.compose(R.join(','), R.pluck('name'))(
              artists_
            )} ${name}`,
            ...others,
            type: 'song'
          }))
        ),
        R.always([])
      )(songs)
      return R.concat(artistSuggestions, songSuggestions)
    }
  }
}
</script>
