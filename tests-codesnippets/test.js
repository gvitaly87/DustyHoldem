const Hand = require("pokersolver").Hand;

var hands = [
  Hand.solve(["Ad", "As", "Ac", "Th", "2d", "3c", "Qh"]),
  Hand.solve(["Ad", "Ts", "Ac", "Th", "2d", "9s", "Qd"]),
  Hand.solve(["Ad", "As", "Qc", "Th", "2d", "9s", "Qs"]),
];

var winner = Hand.winners(hands);

// winner.forEach((win) => {
//   console.log(win.cards);
// });
console.log(winner);
// console.log(winner[0].cards);
