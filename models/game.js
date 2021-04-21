module.exports = class Game {
  constructor(id, numOfPlayers, smallBlind, bigBlind) {
    this.id = id;
    this.clients = [];
    this.hasStarted = false;
    this.table = new Table(numOfPlayers, smallBlind, bigBlind);
  }
};

class Table {
  constructor(numOfPlayers, smallBlind, bigBlind) {
    this.pot = 0;
    this.hand = 0; // Counter for hands played
    /* Round keeps track of the rounds of betting for each hand
     * 0 - let new players join game que
     * 1 - pre-flop
     * 2 - flop
     * 3 - turn,
     * 4 - river
     * 5 - showdown
     * */
    this.round = 0;
    this.gameLog = null;
    /* Keep values for the big and small values in order to set them when the game initializes */
    this.sbValue = smallBlind;
    this.bbValue = bigBlind;
    this.roundRaise = bigBlind;
    this.roundCall = 0;
    this.cards = [];
    /* Pointers to seat position of the dealer, blinds, and player to act */
    this.playerToAct = null;
    this.dealer = null;
    this.smallBlind = null;
    this.bigBlind = null;
    this.numOfPlayersToAct = 3;
    this.seatsQue = [];
    this.seats = [];
    for (let i = 0; i < numOfPlayers; i++) {
      this.seats.push({ empty: true });
    }
  }
}
