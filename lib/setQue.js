const setQue = (seats, dealer) => {
  const filledSeats = [];
  seats.forEach((seat, i) => {
    if (!seat.empty) filledSeats.push(i);
  });
};

module.exports = setQue;
