const Hand = require("pokersolver").Hand;

const { getPos, getDealer, setQue } = require("./setQue");
const nextToAct = require("./nextToAct");
const resetTable = require("./resetTable");
const compareHands = require("./compareHands");

/* Returns an Array of all the winning hands */
const determineWinner = (table) => {
  const tableCards = []; // Cards displayed on the table
  const hands = []; // An array of objects of the 7 card player hands, seat position
  const evalHands = []; // A temp array to determine winner using poker solver
  const tableShowDown = [];
  // Get an array of the cards on the table in short hand in order to use poker solver
  table.cards.forEach((card) => {
    tableCards.push(card.shortHand);
  });

  table.seats.forEach((seat, i) => {
    if (!seat.empty && !seat.folded) {
      const hand = [];

      hand.push(tableCards);
      hand.push(seat.hand[0].shortHand);
      hand.push(seat.hand[1].shortHand);

      // Solve each hand
      const tempSolution = Hand.solve(hand.flat());

      hands.push({
        hand: tempSolution.cards,
        fullHand: tempSolution.cardPool,
        description: tempSolution.descr,
        seat: i,
        username: seat.username,
        cards: seat.hand,
        chipCount: seat.chipCount,
      });
      tableShowDown.push({
        username: seat.username,
        seat: i,
        card1: seat.hand[0],
        card2: seat.hand[1],
        chipCount: seat.chipCount,
        description: tempSolution.descr,
      });
      evalHands.push(tempSolution);
    }
  });

  const winner = Hand.winners(evalHands);
  const winningHands = [];
  winner.forEach((winningHand) => {
    // Need to match the winning hand to one or more hands inside the hands array
    // Compare the Cards Array winningHand.cards with hands.hand
    hands.forEach((playerHand) => {
      if (compareHands(winningHand.cards, playerHand.hand)) {
        winningHands.push(playerHand);
      }
    });
  });

  return { winningHands, tableShowDown };
};

const showDown = (table, deck) => {
  // TODO: partial pot logic

  const { winningHands, tableShowDown } = determineWinner(table);
  let winnerMessage = "";
  if (winningHands.length === 1) {
    // 1 Winner
    table.seats[winningHands[0].seat].chipCount += table.pot;
    let unformattedWinner = `${
      table.seats[winningHands[0].seat].username
    } wins a pot of ${table.pot} with ${winningHands[0].description}`;
    winnerMessage += `<div class="winner">${unformattedWinner}</div>`;
    table.gameLog += `<div class="log-winner">${unformattedWinner}</div>`;
  } else {
    // Split Pot
    const numOfWinners = winningHands.length;
    const partialPot = Math.floor(table.pot / numOfWinners);
    winnerMessage += `
        <div class="winner">
          ${numOfWinners} players split a pot of ${table.pot}
        </div>`;
    table.gameLog += `
        <div class="log-winner">
          ${numOfWinners} players split a pot of ${table.pot}
        </div>`;

    winningHands.forEach((hand) => {
      table.seats[hand.seat].chipCount += partialPot;
      winnerMessage += `
        <div class="winner">
          ${
            table.seats[hand.seat].username
          } wins a partial pot of ${partialPot} 
          with ${hand.description}
        </div>`;
      table.gameLog += `
        <div class="log-winner">
          ${
            table.seats[hand.seat].username
          } wins a partial pot of ${partialPot} 
          with ${hand.description}
        </div>`;
    });
  }

  // TODO: move resetTable and setQue after a showdown function
  table = resetTable(table);

  let tableObj = setQue(table, deck);
  table = tableObj.table;
  deck = tableObj.deck;
  return { table, deck, tableShowDown, winnerMessage };
};

const updateRound = (table, prevPlayerSeat, deck) => {
  const roundQue = table.seatsQue;
  const posInQue = roundQue.indexOf(prevPlayerSeat);
  const nextPlayerPos = getPos(posInQue + 1, roundQue.length);
  const nextPlayer = table.seats[roundQue[nextPlayerPos]];

  let isShowDown = false;
  let tableShowDown = {};
  let winnerMessage = "";

  // If only one player remains move to the showdown/winnings stage
  if (table.seatsQue.length === 1) {
    table.round = 5;
  }

  if (nextPlayer.actionRequired === false) {
    if (table.round !== 5) table.round += 1;
    table.roundRaise = 0;
    const toActPos = getDealer(table.dealer, roundQue);
    table.playerToAct = roundQue[toActPos];
    roundQue.forEach((seat) => {
      // TODO: modify to seat.allIn
      if (table.seats[seat].chipCount > 0)
        table.seats[seat].actionRequired = true;
      if (table.seats[seat].chipCount <= 0)
        table.seats[seat].actionRequired = false;
    });
    // Add cards to the table; round 2 - Flop, 3/4 - Turn/River
    if (table.round === 2) {
      for (let i = 0; i < 3; i++) table.cards.push(deck.pop());
    } else if (table.round === 3 || table.round === 4) {
      table.cards.push(deck.pop());
    }
  } else {
    table.playerToAct = nextToAct(table);
  }
  if (table.round === 5) {
    let tableObj = showDown(table, deck);
    table = tableObj.table;
    deck = tableObj.deck;
    tableShowDown = tableObj.tableShowDown;
    winnerMessage = tableObj.winnerMessage;
    isShowDown = true;
  }
  return { table, deck, tableShowDown, isShowDown, winnerMessage };
};

module.exports = updateRound;
