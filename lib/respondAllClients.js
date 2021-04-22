const respondAllClients = (clients, game, payLoad) => {
  console.log(
    "------ Round ",
    game.table.round,
    " It's seat",
    game.table.playerToAct,
    "'s Turn -------"
  );
  console.log("Round Just Started: ", game.table.roundJustStarted);
  game.clients.forEach((client) => {
    payLoad.seat = client.seat;
    console.log(
      "Seat: ",
      client.seat,
      "Action required: ",
      game.table.seats[client.seat].actionRequired,
      "Folded: ",
      game.table.seats[client.seat].folded
    );
    clients[client.clientId].connection.send(JSON.stringify(payLoad));
  });
};

module.exports = respondAllClients;
