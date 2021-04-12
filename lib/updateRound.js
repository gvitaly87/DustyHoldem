const { getPos } = require("./setQue");
const updateRound = (table, lastPlaySeat) => {
  let posInQue = table.seatsQue.indexOf(lastPlaySeat);
  let nextPlayerPos = getPos(posInQue + 1, table.seatsQue.length);
  if (table.seats[table.seatsQue[nextPlayerPos]].actionRequired === false) {
    table.round += 1;
    table.roundRaise = 0;
    //TODO: set playerToAct
  }
  return table;
};

module.exports = updateRound;
