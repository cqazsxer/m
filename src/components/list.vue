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
</style>

<template>
  <q-page class="column">
    <div class="column col-12 q-pa-md">
      <q-input
        type="text"
        name="searchSuggest"
        v-model="searchSuggestTxt"
        v-stream:keyup="keyup$"
        v-stream:focus="focus$"
        v-stream:blur="blur$"
      />
      <q-list
        highlight
        style="padding: 0"
        class="shadow-1 suggestions"
        v-if="showSuggestions"
      >
        <q-item
          v-for="(sItem, i) of suggestionItems"
          :key="sItem.id"
          v-stream:mouseover.native="{ subject: sItemMouseover$, data: { index: i} }"
      
          :class="{ 'selected': i === selectIndex - 1, 'aaaa': true }"
        >
          <q-item-main :label="sItem.label" />
          </q-item>
          </q-list>
    </div>
    <div class="row col-12">
      <q-tabs
        align="center"
        class="full-width"
      >
        <!-- Tabs - notice slot="title" -->
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
        <!-- Targets -->
        <q-tab-pane name="songs">Tab One</q-tab-pane>
        <q-tab-pane name="album">Tab Two</q-tab-pane>
        </q-tabs>
        <span>{{ a }}</span>
    </div>
  </q-page>
</template>

<style>

</style>

<script>
import * as R from 'ramda'
import Rx from 'rxjs/Rx'

const MAX_SUGGESTION_COUNT = 6

export default {
  name: 'PageIndex',
  data() {
    return {
      searchTxt: '',
      searchSuggestTxt: ''
    }
  },
  domStreams: ['keyup$', 'focus$', 'blur$', 'sItemMouseover$'],
  subscriptions() {
    this.a = this.sItemMouseover$.pluck('data', 'index').do(console.log)
    const triggerUpAndDownOnInput$ = Rx.Observable.merge(
      Rx.Observable.of(1),
      this.keyup$.pluck('event', 'msg', 'keyCode')
    )
      .map(
        R.cond([
          [R.equals(38), R.always(-1)],
          [R.equals(40), R.always(1)],
          [R.T, R.always(0)]
        ])
      )
      .filter(R.complement(R.equals(0)))
      .scan((acc, v) => {
        const newAcc = acc + v
        return R.cond([
          [R.lt(R.__, 1), R.always(MAX_SUGGESTION_COUNT)],
          [R.gt(R.__, MAX_SUGGESTION_COUNT), R.always(1)],
          [R.T, R.always(newAcc)]
        ])(newAcc)
      })

    const mapSongsToSuggestionItems = R.compose(
      R.ifElse(
        R.isNil,
        R.always([]),
        R.compose(
          R.take(MAX_SUGGESTION_COUNT),
          R.map(({ name, artists, id, ...others }) => ({
            label: `${name} - ${R.compose(R.join(','), R.pluck('name'))(
              artists
            )}`,
            id,
            others
          }))
        )
      ),

      R.prop('songs'),
      R.prop('result'),
      R.prop('data')
    )
    return {
      suggestionItems: this.$watchAsObservable('searchSuggestTxt')
        .debounceTime(400)
        .pluck('newValue')
        .distinctUntilChanged()
        .switchMap(txt =>
          Rx.Observable.fromPromise(
            this.$musicAPI.get(`/search?keywords=${txt}`)
          )
        )
        .map(mapSongsToSuggestionItems),
      selectIndex: Rx.Observable.merge(triggerUpAndDownOnInput$)
        // .distinctUntilChanged()
        .do(console.log),
      showSuggestions: Rx.Observable.merge(
        Rx.Observable.of(false),
        this.focus$.mapTo(true),
        this.blur$.mapTo(false)
      )
    }
  },
  async created() {
    console.log(this)
    console.log(
      await this.$musicAPI.get('/search', {
        params: {
          keywords: 'adele'
        }
      })
    )
  },
  methods: {
    handleH() {
      console.log(1)
    },
    async handleSearch(terms) {
      console.log(terms)
      try {
        const searchData = await this.$musicAPI.get(`/search?keywords=${terms}`)
        const mapDataToSuggestionItems = R.compose(
          R.map(({ name, artists, ...others }) => ({
            label: `${name} - ${R.compose(R.join(','), R.pluck('name'))(
              artists
            )}`,
            // value: name,
            others
          })),
          R.prop('songs'),
          R.prop('result'),
          R.prop('data')
        )
        return mapDataToSuggestionItems(searchData)
      } catch (error) {
        console.error(`[error]:${error}`)
      }
      return null
    },
    handleSelected(select) {
      console.log(select)
    }
  }
}
</script>
