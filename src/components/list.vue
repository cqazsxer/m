<style lang="stylus" scoped>
.suggestions {
  position: absolute;
  top: 55px;
  z-index: 2;
  background: #fff;

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
      width: calc(100% - 48px);

      .song_name {
        font-size: 16px;
      }

      .artist_and_album {
        font-size: 14px;
        color: grey;
      }
    }

    .right {
    }
  }
}

.q-scroll-area {
  height: calc(100vh - 320px);
}
</style>

<template>
  <q-page class="column">
    <!-- <div>{{ selectedSuggestTxt }}</div> -->
    <div class="column col-12 q-pa-md">
      <q-search
        :debounce="0"
        type="text"
        name="searchSuggest"
        v-model="searchSuggestTxt"
        v-stream:keyup="inputKeyup$"
        v-stream:focus="focus$"
        v-stream:blur="blur$"
        v-stream:click="inputClick$"
      ></q-search>
        <template v-if="showSuggestions$ && searchSuggestTxt !== ''">
          <transition
            appear
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
          >
            <q-list
              highlight
              style="padding: 0"
              class="shadow-1 suggestions relative-position"
            >

              <template v-if="suggestionItems$.length > 0">
                <q-item
                  v-for="(sItem, i) of suggestionItems$"
                  :key="sItem.id"
                  :class="[{ 'selected': i === selectIndex$ - 1}, 'cursor-pointer']"
                  v-stream:mouseover.native="{ subject: sItemMouseover$, data: { index: i} }"
                  v-stream:click.native.stop="{ subject: sItemClick$, data: { label: sItem.label } }"
                >
                  <q-item-main :label="sItem.label"></q-item-main>
                  </q-item>
              </template>
              <span
                class="q-pa-md"
                v-if="suggestionItems$.length === 0 && !suggestionItemsloading"
              >
                无搜索结果
                </span>
                <q-inner-loading :visible="suggestionItemsloading">
                  <q-spinner-puff
                    size="50px"
                    color="primary"
                  ></q-spinner-puff>
                </q-inner-loading>
                </q-list>
                </transition>
        </template>
    </div>

    <div class="row col-12">
      <q-tabs
        align="center"
        class="full-width"
      >
        <q-tab
          default
          slot="title"
          name="songs"
          icon="library music"
        />
        <q-tab
          slot="title"
          name="album"
          icon="album"
        />
        <q-tab-pane
          name="songs"
          class="q-pa-none"
        >
          <template>
            <q-scroll-area>
              <ul class="column songs">
                <li
                  v-for="(song, index) of songItems$"
                  :key="index"
                  class="row song"
                >
                  <div class="column left justify-center q-pa-sm">
                    <span class="song_name ellipsis">{{ song.name }}</span>
                    <span class="artist_and_album ellipsis">
                      {{ song.artists.map(artist => artist.name).join(',') }} {{ song.artists[0].name }}·{{ song.album.name }}
                    </span>
                  </div>
                  <div class="right q-pa-md">
                    <q-icon name="more vert" />
                  </div>
                  </li>
              </ul>
            </q-scroll-area>
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
import { startLoading, endLoading } from 'src/utils'

const MAX_SUGGESTION_COUNT = 6

export default {
  name: 'PageIndex',
  data() {
    return {
      searchSuggestTxt: '',
      suggestionItemsloading: false
    }
  },
  domStreams: [
    'inputKeyup$',
    'focus$',
    'blur$',
    'sItemMouseover$',
    'sItemClick$',
    'inputClick$'
  ],
  subscriptions() {
    const selectIndex$ = Rx.Observable.merge(
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
                R.both(R.gte(R.__, 96), R.lte(R.__, 105))
              ]),
              R.always({ value: 1, type: 'asdsad' })
            ],
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

    const showSuggestions$ = Rx.Observable.merge(
      Rx.Observable.of(false),
      this.focus$.mapTo(true),
      this.blur$.mapTo(false),
      this.inputClick$.mapTo(true),
      this.inputKeyup$
        .filter(({ event }) =>
          R.anyPass([
            R.both(R.gte(R.__, 65), R.lte(R.__, 90)),
            R.both(R.gte(R.__, 48), R.lte(R.__, 57)),
            R.both(R.gte(R.__, 96), R.lte(R.__, 105))
          ])(event.msg.keyCode)
        )
        .mapTo(true),
      this.inputKeyup$
        .filter(({ event }) => event.msg.keyCode === 13)
        .mapTo(false)
    ).share()

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
    )
      .share()
      .catch(console.error)

    // const selectedSuggestTxt$ = new Rx.BehaviorSubject()
    const selectedSuggestTxt$ = Rx.Observable.combineLatest(
      selectIndex$,
      suggestionItems$
    )
      .map(([value, arr]) => (arr.length > 0 ? arr[value - 1].label : ''))
      .do(x => {
        this.x = x
      })
      .share()
    return {
      suggestionItems$,
      showSuggestions$,
      selectIndex$,
      selectedSuggestTxt$,
      songItems$: this.sItemClick$
        .pluck('data', 'label')
        .merge(
          this.inputKeyup$
            .filter(({ event }) => event.msg.keyCode === 13)
            .map(() => this.x)
            .do(console.info)
        )
        .do(txt => {
          console.log('txt', txt)
          this.searchSuggestTxt = txt
        })
        .switchMap(txt =>
          Rx.Observable.fromPromise(
            this.$musicAPI.get(`/search?keywords=${txt}&type=1`)
          )
        )
        .pluck('data', 'result', 'songs')
        .map(R.defaultTo([]))
    }
  },
  created() {},
  methods: {}
}
</script>
