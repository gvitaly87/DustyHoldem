const Hand = require("pokersolver").Hand;

var hand1 = Hand.solve(["Ad", "As", "Ac", "Th", "2d", "3c", "Qh"]);
var hand2 = Hand.solve(["Ad", "Ts", "Ac", "Th", "2d", "9s", "Qd"]);
var hand3 = Hand.solve(["Ad", "As", "Qc", "Th", "2d", "9s", "Qs"]);

var winner = Hand.winners([hand1, hand2, hand3]);

winner.forEach((win) => {
  console.log(win.cards);
});
//console.log(winner);
// console.log(winner[0].cards);
