<template>
  <q-page class="flex q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-input
          type="text"
          name="search"
          v-model="searchTxt"
          @input="handleSearch"
        />
        <!-- <q-input
          type="text"
          name="search"
          v-model="searchTxt"
          v-stream:change.native="searchInput$"
        /> -->
        <span>{{ count }}</span>
        <button v-stream:click="searchInput$">Add on Click</button>
      </div>

    </div>
  </q-page>
</template>

<style>

</style>

<script>
import * as R from 'ramda'
import Rx from 'rxjs/Rx'

export default {
  name: 'PageIndex',
  data() {
    return {
      searchTxt: '',
      count: ''
    }
  },
  subscriptions() {
    this.searchInput$ = new Rx.Subject()
    return {
      count: this.searchInput$
        .map(() => 1)
        .startWith(0)
        .scan((total, change) => total + change)
    }
  },
  async created() {
    console.log(
      await this.$musicAPI.get('/search', {
        params: {
          keywords: 'adele'
        }
      })
    )
  },
  methods: {
    async handleSearch(terms) {
      console.log(terms)
      try {
        const searchData = await this.$musicAPI.get(`/search?keywords=${terms}`)
        const mapDataToListItems = R.compose(
          R.map(({ name, artists, ...others }) => ({
            label: `${name} - ${R.compose(R.join(','), R.pluck('name'))(
              artists
            )}`,
            value: name,
            others
          })),
          R.prop('songs'),
          R.prop('result'),
          R.prop('data')
        )
        return mapDataToListItems(searchData)
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
