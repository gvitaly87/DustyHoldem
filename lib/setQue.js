const Deck = require("./deck");

const getPos = (position, max) => (position < max ? position : position - max);

const getDealer = (previousDealer, filledSeats) => {
  // If the dealer was in the last sit the new dealer is at the first
  if (previousDealer >= filledSeats[filledSeats.length - 1]) {
    return filledSeats[0];
  } else {
    for (let i = 0; i < filledSeats.length; i++) {
      if (filledSeats[i] > previousDealer) {
        return i;
      }
    }
  }
};

const setQue = (table, deck, fold = false) => {
  const filledSeats = [];
  // Add all new players at the beginning of each round
  if (table.round === 0) {
    //TODO: add to the if condition to check for players folding in round 0
    if (!fold) {
      deck = new Deck();
      deck.shuffle();
      table.cards = [];
      table.seats.forEach((seat, i) => {
        if (!seat.empty && seat.chipCount > 0) filledSeats.push(i);
        seat.newToTable = false;
        if (seat.chipCount > 0) seat.actionRequired = true;
        if (seat.chipCount <= 0) seat.empty = true;
        seat.folded = false;
        seat.bets = [0, 0, 0, 0, 0];
      });
    }
    let dealerPos;
    //Very first game
    if (table.hand === 0) {
      dealerPos = 0;
    } else {
      dealerPos = getDealer(table.dealer, filledSeats);
    }

    table.dealer = filledSeats[dealerPos];

    const totalPlayers = filledSeats.length;
    const smallBlindPos = getPos(dealerPos + 1, totalPlayers);

    console.log("SB Seat:", filledSeats[smallBlindPos]);
    console.log("SB Bets Array:", table.seats[filledSeats[smallBlindPos]].bets);

    table.smallBlind = filledSeats[smallBlindPos];
    table.seats[filledSeats[smallBlindPos]].chipCount -= table.sbValue;
    table.seats[filledSeats[smallBlindPos]].bets[1] += table.sbValue;

    const bigBlindPos = getPos(smallBlindPos + 1, totalPlayers);
    table.bigBlind = filledSeats[bigBlindPos];
    console.log("BB Seat:", filledSeats[bigBlindPos]);
    console.log("BB Bets Array:", table.seats[filledSeats[bigBlindPos]].bets);

    table.seats[filledSeats[bigBlindPos]].chipCount -= table.bbValue;
    table.seats[filledSeats[bigBlindPos]].bets[1] += table.bbValue;
    console.log(
      "SB chips:",
      table.seats[filledSeats[smallBlindPos]].chipCount,
      "BB chips:",
      table.seats[filledSeats[bigBlindPos]].chipCount
    );
    table.pot += table.sbValue + table.bbValue;

    const toActPos = getPos(bigBlindPos + 1, totalPlayers);
    table.playerToAct = filledSeats[toActPos];
    console.log(
      "Dealer:",
      table.dealer,
      "SB:",
      table.smallBlind,
      "BB:",
      table.bigBlind,
      "To act:",
      table.playerToAct
    );
    table.round += 1;
  } // If betting has started new players, players tha folded, and empty seats are accounted for
  else {
    table.seats.forEach((seat, i) => {
      if (!seat.empty && !seat.newToTable && !seat.folded) filledSeats.push(i);
    });
  }
  if (table.round === 1) {
    // TODO: change it to a hidden hand
    filledSeats.forEach((seatPos) => {
      // TODO: send only the shorthand?
      table.seats[seatPos].hand[0] = deck.pop();
      table.seats[seatPos].hand[1] = deck.pop();
    });
  }

  table.seatsQue = filledSeats;
  // console.log("Que:", table.seatsQue, "Round:", table.round);
  return { table, deck };
};

module.exports.setQue = setQue;
module.exports.getPos = getPos;
module.exports.getDealer = getDealer;
