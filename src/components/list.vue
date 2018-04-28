<style lang="stylus" scoped>
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

    & + .song {
      border-top: 1px solid black;
    }

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

.q-infinite-scroll, .q-scroll-area, .my_scroll_area {
  height: calc(100vh - 320px);
  overflow: auto;
  position: relative;
}

.infinityContainer {
  width: 100vw;
  height: 100px;
  border: 1px solid red;
  position: relative;
}
</style>

<template>
  <q-page class="column">
    <!-- <div>{{ selectedSuggestTxt }}</div> -->
    <div class="column col-12 q-pa-md">
      <q-search autofocus :debounce="0" type="text"
        ref="searchSuggestInput" name="searchSuggest"
        v-model="searchSuggestTxt" v-stream:keyup="inputKeyup$"
        v-stream:focus="focus$" v-stream:blur="blur$"
        v-stream:click="inputClick$"></q-search>
      <template v-if="showSuggestions$ && searchSuggestTxt !== ''">
        <transition appear enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut">
          <q-list highlight style="padding: 0" class="shadow-1 suggestions relative-position">

            <template v-if="suggestionItems$.length > 0">
              <q-item v-for="(sItem, i) of suggestionItems$"
                :key="sItem.id" :class="[{ 'selected': i === selectIndex$ - 1}, 'cursor-pointer']"
                v-stream:mouseover.native="{ subject: sItemMouseover$, data: { index: i} }"
                v-stream:click.native.stop="{ subject: sItemClick$, data: { label: sItem.label } }">
                <q-item-main :label="sItem.label"></q-item-main>
              </q-item>
            </template>
            <span class="q-pa-md" v-if="suggestionItems$.length === 0 && !suggestionItemsloading">
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
      <q-tabs align="center" class="full-width">
        <q-tab default slot="title" name="songs"
          icon="library music" />
        <q-tab slot="title" name="album" icon="album"
        />
        <q-tab-pane name="songs" class="q-pa-none songs">
          <template>
            <!-- <q-infinite-scroll :handler="loadMoreSongs"
              inline> -->
            <div class="my_scroll_area" v-stream:scroll.native="songsScroll$">


              <!-- <q-infinite-scroll v-stream:scroll.native="songsScroll$":handler="loadMore"> -->
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
              <div class="infinityContainer">
                <q-inner-loading :visible="songsInfinityScrollLoading">
                  <q-spinner-dots size="50px" color="primary"></q-spinner-dots>
                </q-inner-loading>
              </div>
            </div>
            <!-- </q-infinite-scroll> -->
          </template>
        </q-tab-pane>
        <q-tab-pane name="album">Tab Two</q-tab-pane>
      </q-tabs>
    </div>
  </q-page>
</template>

<style>

</style>

<script>
import * as R from 'ramda'
import Rx from 'rxjs/Rx'

const MAX_SUGGESTION_COUNT = 6
const PER_PAGE = 30;
export default {
  name: 'PageIndex',
  data() {
    return {
      searchSuggestTxt: '',
      suggestionItemsloading: false,
      songsInfinityScrollLoading: false
    }
  },
  domStreams: [
    'inputKeyup$',
    'focus$',
    'blur$',
    'sItemMouseover$',
    'sItemClick$',
    'inputClick$',
    'songsScroll$'
  ],
  subscriptions() {
    // 下拉的建议项$
    const suggestionItems$ = Rx.Observable.merge(
      Rx.Observable.of([]),
      this.$watchAsObservable('searchSuggestTxt')
        .filter(R.complement(R.equals('')))
        .do(() => {
          this.suggestionItemsloading = true
        })
        .debounceTime(400)
        .pluck('newValue')
        .distinctUntilChanged()
        .switchMap(txt =>
          Rx.Observable.fromPromise(
            this.$musicAPI.get(`/search?keywords=${txt}`)
          )
        )
        .pluck('data', 'result', 'songs')
        .map(
          R.ifElse(
            R.isNil,
            R.always([]),
            R.compose(
              R.take(MAX_SUGGESTION_COUNT),
              R.map(({ name, artists, id, ...others }) => ({
                label: `${name} ${R.compose(R.join(','), R.pluck('name'))(
                  artists
                )}`,
                id,
                others
              }))
            )
          )
        )
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
      .publishBehavior()
      .refCount()

    // 搜索产生的songs$(仅一页)
    const songItemsAfterSearch$ = new Rx.Subject()
      .merge(
        this.sItemClick$.pluck('data', 'label'),
        this.inputKeyup$
          .filter(({ event }) => event.msg.keyCode === 13)
          .switchMap(() => selectedSuggestTxt$.take(1))
      )
      .do(txt => {
        console.log('txt', txt)
        this.searchSuggestTxt = txt
      })
      .switchMap(txt =>
        Rx.Observable.fromPromise(
          this.$musicAPI.get(`/search?keywords=${txt}&type=1&offset=0&limit=${PER_PAGE}`)
        )
      )
      .pluck('data', 'result', 'songs')
      .map(R.defaultTo([]))
      .do(e => {
        console.log('最新的', e)
      })
      .share()

    // 下滑产生的songs 分页添加
    const songsItemsByScroll$ = this.songsScroll$
      .debounceTime(50)
      .map(({ event: { target } }) => {
        const contentHeight =
          target.querySelector('ul').offsetHeight +
          target.querySelector('.infinityContainer').offsetHeight
        const containerHeight = target.offsetHeight
        console.log(
          Math.abs(contentHeight - containerHeight - target.scrollTop)
        )
        // 触发滚动距离
        return (
          Math.abs(contentHeight - containerHeight - target.scrollTop) <= 100
        )
      })
      .filter(R.identity)
      .mapTo(1)
      .scan((acc, value) => acc + value, 1)
      .do(e => {
        console.log('more page1', e)
      })
      .do(() => {
        this.songsInfinityScrollLoading = true
      })
      .switchMap(page =>
        Rx.Observable.fromPromise(
          this.$musicAPI.get(
            `/search?keywords=${this.searchSuggestTxt}&type=1&offset=${(page -
              1) *
              PER_PAGE}&limit=${PER_PAGE}`
          )
        )
      )
      .do(() => {
        this.songsInfinityScrollLoading = false
      })
      .pluck('data', 'result', 'songs')
      .map(R.defaultTo([]))
      .do(e => {
        console.log('more page2', e)
      })
    // .share()
    // .subscribe()
    // songs项
    const songItems$ = Rx.Observable.merge(
      songItemsAfterSearch$.map(arr => ({
        type: 'init',
        arr
      })).do(() => {
        // 回到顶部
        document.querySelector('.my_scroll_area').scrollTop = 0
      }),
      songsItemsByScroll$.map(arr => ({
        type: 'append',
        arr
      }))
    ).scan((acc, { type, arr }) => {
      if (type === 'init') return arr
      return acc.concat(arr)
    }, [])
    // const songItems$ = songsItemsByScroll$
    //   .scan(R.concat, [])
    //   .buffer(songItemsAfterSearch$)
    return {
      suggestionItems$,
      showSuggestions$,
      selectIndex$,
      selectedSuggestTxt$,
      songItems$
    }
  },
  created() {},
  methods: {
    async loadMoreSongs(index, done) {
      try {
        const back = await this.$musicAPI.get(
          `/search?keywords=${this.searchSuggestTxt}&type=1`
        )

        // this.
      } catch (error) {
        console.log(error)
      }

      console.log('index, done', index, done)
    }
  }
}
</script>
