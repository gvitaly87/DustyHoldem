const resetTable = (table) => {
  table.pot = 0;
  table.hand += 1;
  table.round = 0;
  table.roundRaise = table.bbValue;
  table.roundCall = 0;
  return table;
};

module.exports = resetTable;
