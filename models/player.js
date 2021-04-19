module.exports = class Player {
  constructor(id, name, seat, chipCount, clientIndex) {
    this.clientId = id;
    this.seat = seat;
    this.username = name;
    this.chipCount = chipCount;
    this.clientIndex = clientIndex;
    this.empty = false;
    this.newToTable = true;
    this.folded = false;
    this.actionRequired = false;
    this.allIn = false;
    this.hand = [];
    this.bets = [0, 0, 0, 0, 0];
  }
};
