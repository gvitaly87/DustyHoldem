const getPos = (position, max) => (position < max ? position : position - max);

const nextToAct = (table) => {
  const toActPos = table.seatsQue.indexOf(table.playerToAct);
  const playerToAct = getPos(toActPos + 1, table.seatsQue.length);
  console.log("Next to Act: ", table.seatsQue[playerToAct]);
  return table.seatsQue[playerToAct];
};

module.exports = nextToAct;
