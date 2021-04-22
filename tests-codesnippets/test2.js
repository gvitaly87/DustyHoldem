const Hand = require("pokersolver").Hand;

const hands = [];
const evalHands = [
  Hand.solve(["Ad", "As", "Ac", "Th", "2d", "3c", "Qh"]),
  Hand.solve(["Ad", "As", "Ac", "Th", "2d", "9s", "Qd"]),
  Hand.solve(["Ad", "As", "Qc", "Th", "2d", "9s", "Qs"]),
];

evalHands.forEach((tempSolution) => {
  let i = Math.floor(Math.random() * 10);
  hands.push({
    hand: tempSolution.cards,
    fullHand: tempSolution.cardPool,
    description: tempSolution.descr,
    seat: i,
  });
  console.log(
    "Cards: ",
    tempSolution.cards,
    "Description: ",
    tempSolution.descr,
    "Seat: ",
    i
  );
});
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

const winner = Hand.winners(evalHands);
const winningHands = [];
winner.forEach((winningHand) => {
  // Need to match the winning hand to one or more hands inside the hands array
  // Compare the Cards Array winningHand.cards with hands.hand
  hands.forEach((playerHand) => {
    if (compareHands(winningHand.cards, playerHand.hand))
      winningHands.push(playerHand);
  });
});

winningHands.forEach((hand) => {
  console.log("Winning Seat:", hand.seat, "Winning Hand: ", hand.description);
});
// winner.forEach((win) => {
//   console.log(win.cards);
// });
// console.log(winner);
// console.log(winner[0].cards);
