// Assigns a seat to a player from 0 to 9 as long as the seat isn't taken
const getSeat = (seats) => {
  let random = Math.floor(Math.random() * 10);
  if (seats[random].empty) return random;
  return getSeat(seats);
};

module.exports = getSeat;
