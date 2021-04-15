const resetTable = require("./resetTable");
const { setQue } = require("./setQue");

// TODO: update to use without a deck
const setWinner = (table, deck, winnerPos) => {
  table.seats[winnerPos] += table.pot;

  table = resetTable(table);

  let tableObj = setQue(table, deck);
  table = tableObj.table;
  deck = tableObj.deck;
  return { table, deck };
};

module.exports = setWinner;
