export function mergeTickets(ticket, lastChanges) {
  for (const key in lastChanges) {
    if (ticket[key] instanceof Array) {
      Array.prototype.push.apply(ticket[key], lastChanges[key])
    } else {
      ticket[key] = lastChanges[key]
    }
  }
  return ticket
}
