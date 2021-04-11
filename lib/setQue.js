const getPos = (position, max) => (position < max ? position : position - max);

const getDealer = (previousDealer, filledSeats) => {
  // If the dealer was in the last sit the new dealer is at the first
  if (previousDealer >= filledSeats[filledSeats.length - 1]) {
    return filledSeats[0];
  } else {
    for (let i = 0; i < filledSeats.length; i++) {
      if (filledSeats[i] > previousDealer) {
        return filledSeats[i];
      }
    }
  }
};

const setQue = (table) => {
  const filledSeats = [];
  // Add all new players at the beginning of each round
  if (table.round === 0) {
    table.seats.forEach((seat, i) => {
      if (!seat.empty) filledSeats.push(i);
      seat.newToTable = false;
      seat.actionRequired = true;
    });
    let dealerPos;
    const totalPlayers = filledSeats.length;
    //Very first game
    if (table.hand === 0) {
      dealerPos = 0;
    } else {
      table.dealer = getDealer(table.dealer, filledSeats);
    }

    table.dealer = filledSeats[dealerPos];

    const smallBlindPos = getPos(dealerPos + 1, totalPlayers);
    table.smallBlind = filledSeats[smallBlindPos];

    const bigBlindPos = getPos(smallBlindPos + 1, totalPlayers);
    table.bigBlind = filledSeats[bigBlindPos];

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

  table.setQue = filledSeats;
  console.log("Que:", table.setQue, "Round:", table.round);
  return table;
};

module.exports = setQue;
