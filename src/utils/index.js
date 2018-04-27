export function startLoading(name) {
  console.log(this, 'this');
  this[name] = true
}
export function endLoading(name) {
  this[name] = false
}
