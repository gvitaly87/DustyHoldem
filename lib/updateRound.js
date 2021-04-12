const { getPos, getDealer } = require("./setQue");
const nextToAct = require("./nextToAct");

const updateRound = (table, lastPlaySeat) => {
  let posInQue = table.seatsQue.indexOf(lastPlaySeat);
  let nextPlayerPos = getPos(posInQue + 1, table.seatsQue.length);
  if (table.seats[table.seatsQue[nextPlayerPos]].actionRequired === false) {
    table.round += 1;
    table.roundRaise = 0;
    table.playerToAct = getDealer(table.dealer, table.seatsQue);
    console.log("Round:", table.round, "First to Act:", table.playerToAct);
    table.seatsQue.forEach((que) => {
      table.seats[que].actionRequired = true;
    });
  } else {
    table.playerToAct = nextToAct(table);
  }

  return table;
};

module.exports = updateRound;
