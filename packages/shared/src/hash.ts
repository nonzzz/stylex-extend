export function xxhash(str: string) {
  let i
  let l
  let hval = 0x811C9DC5

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i)
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
  }
  return (`00000${(hval >>> 0).toString(36)}`).slice(-6)
}

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

function seededRandom(seed: number): () => number {
  return function() {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }
}

export function randomAlpha() {
  let r = ''
  const seed = Math.floor(Math.random() * 1000000)
  const random = seededRandom(seed)
  for (let i = 0; i < 10; i++) {
    const index = Math.floor(random() * chars.length)
    r += chars[index]
  }
  return r
}
