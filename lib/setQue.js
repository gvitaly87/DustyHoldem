const setQue = (table) => {
  const filledSeats = [];
  // Add all new players at the beginning of each round
  if (table.round === 0) {
    table.seats.forEach((seat, i) => {
      if (!seat.empty) filledSeats.push(i);
      seat.newToTable = false;
    });
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
