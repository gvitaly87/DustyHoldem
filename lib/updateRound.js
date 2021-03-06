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
const noShowDown = (table, deck) => {
  const player = table.seats[table.seatsQue[0]];
  player.chipCount += table.pot;
  table.gameLog += `<div class="log-winner">${player.username} wins a pot of ${table.pot}</div>`;
  winnerMessage = `<div class="winner">${player.username} wins a pot of ${table.pot}</div>`;
  let tableShowDown = table;

  table = resetTable(table);
  let tableObj = setQue(table, deck);
  table = tableObj.table;
  deck = tableObj.deck;

  return { table, deck, tableShowDown, winnerMessage };
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
const addCardsToTable = (table, deck) => {
  // Add cards to the table; round 2 - Flop, 3/4 - Turn/River
  if (table.round === 2) {
    for (let i = 0; i < 3; i++) table.cards.push(deck.pop());
  } else if (table.round === 3 || table.round === 4) {
    table.cards.push(deck.pop());
  }
  return { table, deck };
};

const automateRounds = (table, deck) => {
  while (table.round < 5) {
    table.round += 1;
    tableObj = addCardsToTable(table, deck);
    table = tableObj.table;
    deck = tableObj.deck;
  }
  return { table, deck };
};

const updateRound = (table, prevPlayerSeat, deck) => {
  const roundQue = table.seatsQue;
  console.log(roundQue);

  const nextPlayerPos = getDealer(prevPlayerSeat, roundQue);
  const nextPlayer = table.seats[roundQue[nextPlayerPos]];
  console.log(nextPlayerPos, nextPlayer.seat);

  let isShowDown = false;
  let everyoneFolded = false;
  let tableShowDown = {};
  let winnerMessage = "";
  let tableObj;
  // If only one player remains move to the showdown/winnings stage
  if (table.seatsQue.length === 1) {
    table.round = 5;
  }
  table.roundJustStarted = false;
  if (nextPlayer.actionRequired === false) {
    //TODO: refund chips that are not called
    if (table.roundCall < table.roundRaise) {
      roundQue.forEach((seat) => {
        const player = table.seats[seat];
        if (player.bets[table.round] > table.roundCall && !player.folded) {
          const refund = player.bets[table.round] - table.roundCall;
          player.chipCount += refund;
          table.pot -= refund;
          player.bets[table.round] = table.roundCall;
          console.log(
            "Player",
            player.username,
            "received a refund of ",
            refund
          );
        }
      });
    }
    if (table.round !== 5) table.round += 1;

    table.roundJustStarted = true;
    table.roundRaise = 0;
    table.roundCall = 0;
    // Check if someone needs to act first ?
    const toActPos = getDealer(table.dealer, roundQue);
    table.playerToAct = roundQue[toActPos];
    roundQue.forEach((seat) => {
      const player = table.seats[seat];

      if (player.chipCount > 0) player.actionRequired = true;
      if (player.chipCount <= 0) player.actionRequired = false;
    });

    // if (roundQue.length - table.numOfPlayersToAct < 1) {
    //   tableObj = automateRounds(table, deck);
    //   table = tableObj.table;
    //   deck = tableObj.deck;
    // }

    tableObj = addCardsToTable(table, deck);
    table = tableObj.table;
    deck = tableObj.deck;
  } else {
    table.playerToAct = nextPlayer.seat;
  }
  if (table.round === 5) {
    let tableObj;
    if (table.seatsQue.length === 1) {
      tableObj = noShowDown(table, deck);
      everyoneFolded = true;
    } else {
      tableObj = showDown(table, deck);
    }
    tableShowDown = tableObj.tableShowDown;
    table = tableObj.table;
    deck = tableObj.deck;
    winnerMessage = tableObj.winnerMessage;
    isShowDown = true;
  }
  return {
    table,
    deck,
    tableShowDown,
    isShowDown,
    winnerMessage,
    everyoneFolded,
  };
};

module.exports = updateRound;
