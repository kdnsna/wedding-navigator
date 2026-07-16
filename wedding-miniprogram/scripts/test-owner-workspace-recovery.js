const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.resolve(__dirname, '..')
const source = fs.readFileSync(path.join(root, 'stores/owner-workspace.js'), 'utf8')
  .replace(/^import .*$/gm, '')
  .replace('export const useOwnerWorkspaceStore', 'const useOwnerWorkspaceStore')
  .concat('\nglobalThis.__ownerWorkspace = useOwnerWorkspaceStore()\n')

const storage = new Map()
const context = {
  defineStore: (_name, setup) => setup,
  ref: value => ({ value }),
  uni: {
    getStorageSync: key => storage.get(key) || '',
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: key => storage.delete(key)
  }
}

vm.runInNewContext(source, context, { filename: 'stores/owner-workspace.js' })
const store = context.__ownerWorkspace

function workspace(weddingId) {
  return { weddingId, title: weddingId }
}

store.setActiveWedding('deleted-wedding')
store.setWorkspaces([workspace('available-a'), workspace('available-b')])
assert.strictEqual(store.activeWeddingId.value, 'available-a', 'stale active id must switch to the first available workspace')
assert.strictEqual(storage.get('ownerActiveWeddingId'), 'available-a', 'recovered active id must be persisted')

store.setActiveWedding('available-b')
store.setWorkspaces([workspace('available-a'), workspace('available-b')])
assert.strictEqual(store.activeWeddingId.value, 'available-b', 'a valid selected workspace must be preserved')

store.setActiveWedding('deleted-wedding')
store.setWorkspaces([])
assert.strictEqual(store.activeWeddingId.value, '', 'active id must clear when no workspace remains')
assert.strictEqual(storage.has('ownerActiveWeddingId'), false, 'cleared active id must be removed from storage')

store.setActiveWedding('available-a')
store.setWorkspaces('invalid-response')
assert.strictEqual(store.activeWeddingId.value, '', 'invalid workspace responses must fail closed')

console.log('owner workspace recovery tests passed')
