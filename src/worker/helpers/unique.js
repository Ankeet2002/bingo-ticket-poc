let gameIdent = 1
let gameName = ''

export function fromStart(name) {
  gameIdent = 1
  gameName = `${name}_`
}

export function id() {
  return gameName + gameIdent++
}
