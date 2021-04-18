const Deck = require("./deck");
/****Keeps track of position in an array a cyclical manner****/
const getPos = (position, max) => (position < max ? position : position - max);

/*************Creates a new deck and shuffles it***********/
const newDeck = () => {
  let deck = new Deck();
  deck.shuffle();
  return deck;
};
/********************initialize Player********************/
const initPlayer = (player) => {
  // If the player is out of chips he sits out of the game
  // TODO: buy in option
  if (player.chipCount <= 0) {
    player.empty = true;
    return player;
  }
  player.newToTable = false;
  player.actionRequired = true;
  player.folded = false;
  player.bets = [0, 0, 0, 0, 0];
  return player;
};
/************Determines the Dealer's Position**********/
const getDealer = (previousDealer, filledSeats) => {
  // If the dealer was in the last sit the new dealer is at the first
  if (previousDealer >= filledSeats[filledSeats.length - 1]) {
    return 0;
  } else {
    for (let i = 0; i < filledSeats.length; i++) {
      if (filledSeats[i] > previousDealer) {
        return i;
      }
    }
  }
};
/********************Set Blinds********************/
const setBlind = (
  table,
  filledSeats,
  blindPos,
  blindBet,
  smallBlind = false
) => {
  table.seats[filledSeats[blindPos]].chipCount -= blindBet;
  table.seats[filledSeats[blindPos]].bets[1] += blindBet;
  table.pot += blindBet;
  if (smallBlind) {
    table.smallBlind = filledSeats[blindPos];
  } else {
    table.bigBlind = filledSeats[blindPos];
  }
  return table;
};
/********************Start a new round**********************/
const initRound = (table, deck, filledSeats) => {
  deck = newDeck();
  table.cards = []; // Clears the cards of the table
  table.seats.forEach((seat, i) => {
    seat = initPlayer(seat);
    if (!seat.empty) filledSeats.push(i);
  });

  let dealerPos;
  // In the very first game the dealer is the player sitting in the lowest position
  if (table.hand === 0) {
    dealerPos = 0;
  } else {
    dealerPos = getDealer(table.dealer, filledSeats);
  }

  table.dealer = filledSeats[dealerPos];
  const totalPlayers = filledSeats.length;

  const smallBlindPos = getPos(dealerPos + 1, totalPlayers);
  table = setBlind(table, filledSeats, smallBlindPos, table.sbValue, true);

  const bigBlindPos = getPos(smallBlindPos + 1, totalPlayers);
  table = setBlind(table, filledSeats, bigBlindPos, table.bbValue);

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
  return { table, deck, filledSeats };
};

const setQue = (table, deck, fold = false) => {
  let filledSeats = [];
  // Add all new players at the beginning of each round
  if (table.round === 0 && !fold) {
    let tableObj = initRound(table, deck, filledSeats);
    filledSeats = tableObj.filledSeats;
    table = tableObj.table;
    deck = tableObj.deck;
  } // If betting has started new players, players tha folded, and empty seats are accounted for
  else {
    filledSeats = [];
    table.seats.forEach((seat, i) => {
      if (!seat.empty && !seat.newToTable && !seat.folded) filledSeats.push(i);
    });
  }
  if (table.round === 1 && !fold) {
    // TODO: change it to a hidden hand
    filledSeats.forEach((seatPos) => {
      // TODO: send only the shorthand?
      table.seats[seatPos].hand[0] = deck.pop();
      table.seats[seatPos].hand[1] = deck.pop();
    });
  }
  console.log(filledSeats);
  table.seatsQue = filledSeats;
  // console.log("Que:", table.seatsQue, "Round:", table.round);
  return { table, deck };
};

module.exports.setQue = setQue;
module.exports.getPos = getPos;
module.exports.getDealer = getDealer;
