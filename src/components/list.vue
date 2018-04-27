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
      <q-search :debounce="0" type="text" name="searchSuggest"
        v-model="searchSuggestTxt" v-stream:keyup="keyup$"
        v-stream:focus="focus$" v-stream:blur="blur$"></q-search>
      <template v-if="showSuggestions && searchSuggestTxt !== ''">
        <transition appear enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut">
          <q-list highlight style="padding: 0" class="shadow-1 suggestions relative-position">

            <template v-if="suggestionItems.length > 0">
              <q-item v-for="(sItem, i) of suggestionItems"
                :key="sItem.id" :class="[{ 'selected': i === selectIndex - 1}, 'cursor-pointer']"
                v-stream:mouseover.native="{ subject: sItemMouseover$, data: { index: i} }"
                v-stream:click="{ subject: sItemClick$, data: { label: sItem.label } }">
                <q-item-main :label="sItem.label"></q-item-main>
              </q-item>
            </template>
            <span class="q-pa-md" v-if="suggestionItems.length === 0 && !suggestionItemsloading">
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
        <!-- Tabs - notice slot="title" -->
        <q-tab default slot="title" name="songs"
          icon="library music" />
        <q-tab slot="title" name="album" icon="album"
        />
        <!-- Targets -->
        <q-tab-pane name="songs">Tab One</q-tab-pane>
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
  domStreams: ['keyup$', 'focus$', 'blur$', 'sItemMouseover$', 'sItemClick$'],
  subscriptions() {
    const getSongs = this.sItemClick$
      .pluck('data', 'label')
      .do(console.log)
      .switchMap(txt =>
        Rx.Observable.fromPromise(
          this.$musicAPI.get(`/search?keywords=${txt}&type=1`)
        )
      )
      .do(console.log)

    return {
      suggestionItems: this.$watchAsObservable('searchSuggestTxt')
        .do(() => {
          this.suggestionItemsloading = true
        })
        .debounceTime(400)
        .pluck('newValue')
        .distinctUntilChanged()
        .switchMap(txt =>
          Rx.Observable.fromPromise(
            this.$musicAPI.get(`/search/suggest?keywords=${txt}`)
          )
        )
        .startWith([])
        .map(
          R.compose(
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
        )
        .do(() => {
          this.suggestionItemsloading = false
        })
        .do(console.log),
      selectIndex: Rx.Observable.merge(
        Rx.Observable.of({ value: 1, type: 'init' }),
        this.keyup$
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
                R.always({ value: 1, type: 'set' })
              ],
              [R.T, R.always(0)]
            ])
          )
          .filter(R.complement(R.equals(0))),
        this.sItemMouseover$
          .pluck('data', 'index')
          .map(R.compose(R.assoc('value', R.__, { type: 'set' }), R.add(1)))
      ).scan((acc, { value, type }) => {
        const newAcc = acc.value || acc + value
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
      }),
      showSuggestions: Rx.Observable.merge(
        Rx.Observable.of(false),
        this.focus$.mapTo(true),
        this.blur$.mapTo(false)
      )
    }
  },
  created() {},
  methods: {}
}
</script>
