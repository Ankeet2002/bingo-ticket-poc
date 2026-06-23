/**
 * Count HTML element nodes under root (excludes text/comment nodes).
 * @param {ParentNode | null | undefined} root
 */
export function countDomElements(root) {
  if (!root || !('querySelectorAll' in root)) return 0
  return root.querySelectorAll('*').length + 1
}

/**
 * Count elements in one ticket (`article`) inside a preview container.
 * @param {ParentNode | null | undefined} previewRoot
 */
export function countTicketDomElements(previewRoot) {
  const ticket = previewRoot?.querySelector?.('article')
  return countDomElements(ticket)
}
