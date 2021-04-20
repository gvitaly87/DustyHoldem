// Assigns a seat to a player if the seat is taken generates a new seat
// If all seats at the table are taken returns -1
const getSeat = (seats, seatCount = 10) => {
  let random = Math.floor(Math.random() * seatCount);
  return seats[random].empty ? random : getSeat(seats);
};

module.exports = getSeat;
