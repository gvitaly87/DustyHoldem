const respondAllClients = (clients, game, payLoad) => {
  game.clients.forEach((client) => {
    clients[client.clientId].connection.send(JSON.stringify(payLoad));
  });
};

module.exports = respondAllClients;
