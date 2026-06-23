/**
 * Tokens from Figma — Money Ball GUI / TicketsMobile (size L).
 * @see https://www.figma.com/design/FFK8L6MuLkKny1KljUPES8/branch/oip5vmElCFXMCSjroZVXnu/Money-Ball?node-id=4107-203071
 */
export const FIGMA_TICKET_L = {
  width: 302,
  radius: 6,
  shadow: '0 3.116px 1.558px rgba(0, 0, 0, 0.42)',
  headerHeight: 26,
  headerPaddingX: 6,
  bodyHeight: 41,
  numberFontSize: 27,
  headerFontSize: 18,
  separatorHeight: 19,
  separatorWidth: 1.5,
  separatorRadius: 2,
}

export const FIGMA_TICKET_COLORS = {
  normal: {
    headerBg: '#f8eadb',
    bodyBg: 'linear-gradient(180deg, #ffffff 0%, #f3eae0 100%)',
    number: '#704f4f',
    ticketNumber: '#b19797',
    separator: 'rgba(177, 151, 151, 0.5)',
  },
  gold: {
    headerBg: 'linear-gradient(180deg, #fff9e0 0%, #f5e08a 100%)',
    bodyBg: 'linear-gradient(180deg, #ffe96e 0%, #ffd054 50%, #f98900 100%)',
    return: '#704f4f',
    number: '#704f4f',
    ticketNumber: '#9f8080',
    separator: '#cb9330',
  },
  disabled: {
    headerBg: '#0a4845',
    bodyBg: '#0d5b58',
    number: '#193b3a',
    ticketNumber: '#0f6864',
    separator: '#0a4744',
  },
}
