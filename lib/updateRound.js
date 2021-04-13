const { getPos, getDealer, setQue } = require("./setQue");
const nextToAct = require("./nextToAct");

const showDown = (table, deck) => {
  const playersRemaining = table.seatsQue.length;
  // TODO: decide winner based on cards
  // TODO: tie logic
  // TODO: partial pot logic
  const randomWinner = Math.floor(Math.random() * playersRemaining);
  // TODO: add show cards feature(possibly timed)

  table.seats[randomWinner].chipCount += table.pot;

  // Reset before next round
  table.pot = 0;
  table.hand += 1;
  table.round = 0;
  table.roundRaise = table.bbValue;

  table = setQue(table, deck);
  return table;
};
const updateRound = (table, lastPlaySeat, deck) => {
  let posInQue = table.seatsQue.indexOf(lastPlaySeat);
  let nextPlayerPos = getPos(posInQue + 1, table.seatsQue.length);
  if (table.seats[table.seatsQue[nextPlayerPos]].actionRequired === false) {
    table.round += 1;
    table.roundRaise = 0;
    const toActPos = getDealer(table.dealer, table.seatsQue);
    table.playerToAct = table.seatsQue[toActPos];
    console.log("Round:", table.round, "First to Act:", table.playerToAct);
    table.seatsQue.forEach((que) => {
      table.seats[que].actionRequired = true;
    });
    if (table.round === 2) {
      table.cards[0] = deck.pop();
      table.cards[1] = deck.pop();
      table.cards[2] = deck.pop();
    } else if (table.round === 3) {
      table.cards[3] = deck.pop();
    } else if (table.round === 4) {
      table.cards[4] = deck.pop();
    }
  } else {
    table.playerToAct = nextToAct(table);
  }
  if (table.round === 5) {
    table = showDown(table, deck);
  }
  return table;
};

module.exports = updateRound;