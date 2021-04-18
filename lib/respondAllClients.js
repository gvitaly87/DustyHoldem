const respondAllClients = (clients, game, payLoad) => {
  game.clients.forEach((client) => {
    payLoad.seat = client.seat;
    clients[client.clientId].connection.send(JSON.stringify(payLoad));
  });
};

module.exports = respondAllClients;
