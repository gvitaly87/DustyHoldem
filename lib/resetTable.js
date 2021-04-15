const resetTable = (table) => {
  table.pot = 0;
  table.hand += 1;
  table.round = 0;
  table.roundRaise = table.bbValue;
  return table;
};

module.exports = resetTable;
