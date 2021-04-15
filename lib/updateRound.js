const Hand = require("pokersolver").Hand;

const { getPos, getDealer, setQue } = require("./setQue");
const nextToAct = require("./nextToAct");
const decideTieBreak = require("./tieBreak");

const resetTable = (table) => {
  // Reset before next round
  table.pot = 0;
  table.hand += 1;
  table.round = 0;
  table.roundRaise = table.bbValue;
  return table;
};
/* Compares two hands of the same type
 * returns 1 if hand 1 is better
 *         2 if hand 2
 *         0 if they are the same */

const determineWinner = (table) => {
  let tableCards = [];
  let hands = [];
  table.cards.forEach((card) => {
    tableCards.push(card.shortHand);
  });
  table.seats.forEach((seat, i) => {
    if (!seat.empty && !seat.folded) {
      // Do something (get hand and position?)
      let hand = [];

      hand.push(tableCards);
      hand.push(seat.hand[0].shortHand);
      hand.push(seat.hand[1].shortHand);
      hands.push({
        hand: hand.flat(),
        solution: Hand.solve(hand.flat()),
        seat: i,
      });
    }
  });

  let bestHand = {};
  let needTieBreak = [];
  let tieBreakRank;
  hands.forEach((hand, i) => {
    if (i === 0) {
      bestHand = hand;
    } else if (hand.solution.rank > bestHand.solution.rank) {
      bestHand = hand;
      needTieBreak = [];
      tieBreakRank = null;
    } else if (hand.solution.rank === bestHand.solution.rank) {
      if (needTieBreak.length === 0) needTieBreak.push(bestHand);
      needTieBreak.push(hand);
      tieBreakRank = hand.solution.rank;
    }
  });

  console.log(
    "The winner is:",
    "Seat:",
    bestHand.seat,
    "Hand:",
    bestHand.solution.descr
  );
  if (needTieBreak.length > 0) {
    let bestHandIndicator;
    bestHandIndicator = decideTieBreak(
      needTieBreak[0].solution,
      needTieBreak[1].solution,
      tieBreakRank
    );
  }
  return bestHand;
};

const showDown = (table, deck) => {
  const playersRemaining = table.seatsQue.length;
  // TODO: decide winner based on cards
  // TODO: tie logic
  // TODO: partial pot logic
  let bestHand = determineWinner(table);

  // const randomWinner = Math.floor(Math.random() * playersRemaining);
  // TODO: add show cards feature(possibly timed)

  table.seats[bestHand.seat].chipCount += table.pot;
  console.log("The winner is:", table.seats[bestHand.seat].username);
  table = resetTable(table);

  let tableObj = setQue(table, deck);
  table = tableObj.table;
  deck = tableObj.deck;
  return { table, deck };
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
    let tableObj = showDown(table, deck);
    table = tableObj.table;
    deck = tableObj.deck;
  }
  return { table, deck };
};

module.exports = updateRound;
