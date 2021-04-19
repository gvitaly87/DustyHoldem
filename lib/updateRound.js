const Hand = require("pokersolver").Hand;

const { getPos, getDealer, setQue } = require("./setQue");
const nextToAct = require("./nextToAct");
const resetTable = require("./resetTable");

/******Compares Two hands of 5 cards***********/
/* Input: hand 1 array, hand 2 array
 * Output: true if hands match, false if they don't
 */
const compareHands = (hand1, hand2, cardIndex = 0) => {
  if (cardIndex === 5) return true;
  if (
    hand2[cardIndex].value === hand1[cardIndex].value &&
    hand2[cardIndex].suit === hand1[cardIndex].suit
  ) {
    cardIndex += 1;
    return compareHands(hand1, hand2, cardIndex);
  } else {
    return false;
  }
};

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

  const playersRemaining = table.seatsQue.length;

  const { winningHands, tableShowDown } = determineWinner(table);
  if (winningHands.length === 1) {
    // 1 Winner
    table.seats[winningHands[0].seat].chipCount += table.pot;
    console.log("The winner is:", table.seats[winningHands[0].seat].username);
    table.gameLog += `
        <div class="log-winner">
          ${table.seats[winningHands[0].seat].username} wins a pot of ${
      table.pot
    }
        with ${winningHands[0].description}</div>`;
  } else {
    // Split Pot
    const numOfWinners = winningHands.length;
    const partialPot = Math.floor(table.pot / numOfWinners);
    table.gameLog += `
        <div class="log-winner">
          ${numOfWinners} players split a pot of ${table.pot}
        </div>`;

    winningHands.forEach((hand) => {
      table.seats[hand.seat].chipCount += partialPot;
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
  return { table, deck, tableShowDown };
};
const updateRound = (table, lastPlaySeat, deck) => {
  let posInQue = table.seatsQue.indexOf(lastPlaySeat);
  let nextPlayerPos = getPos(posInQue + 1, table.seatsQue.length);
  let isShowDown = false;
  let tableShowDown = {};
  if (table.seatsQue.length === 1) {
    table.round = 5;
  }
  if (table.seats[table.seatsQue[nextPlayerPos]].actionRequired === false) {
    if (table.round !== 5) table.round += 1;
    table.roundRaise = 0;
    const toActPos = getDealer(table.dealer, table.seatsQue);
    table.playerToAct = table.seatsQue[toActPos];
    console.log("Round:", table.round, "First to Act:", table.playerToAct);
    table.seatsQue.forEach((que) => {
      if (table.seats[que].chipCount > 0)
        table.seats[que].actionRequired = true;
      if (table.seats[que].chipCount <= 0)
        table.seats[que].actionRequired = false;
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
    tableShowDown = tableObj.tableShowDown;
    isShowDown = true;
  }
  return { table, deck, tableShowDown, isShowDown };
};

module.exports = updateRound;
