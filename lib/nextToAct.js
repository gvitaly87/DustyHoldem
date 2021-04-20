const getPos = (position, max) => (position < max ? position : position - max);

const nextToAct = (table) => {
  const toActPos = table.seatsQue.indexOf(table.playerToAct);
  const playerToAct = getPos(toActPos + 1, table.seatsQue.length);
  return table.seatsQue[playerToAct];
};

module.exports = nextToAct;
