const findOppSelector = (playerSeat, oppSeat) => {
  let adjustedSeat = 7 + oppSeat - playerSeat;
  if (adjustedSeat > 10) adjustedSeat -= 10;
  if (adjustedSeat < 1) adjustedSeat += 10;
  return `.player-${adjustedSeat}`;
};

export default findOppSelector;
