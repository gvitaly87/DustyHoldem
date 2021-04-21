const clientLeft = (clients, game) => {
  game.clients.forEach((client, index, object) => {
    if ((clients[client.clientId].connection.state = "closed")) {
      console.log(client.username, " has left the game!");
      game.table.seats[client.seat] = { empty: true };
      // remove client from game
      object.splice(index, 1);
      // update clientIndex for each player's seat
      game.table.seats.forEach((seat) => {
        if (!seat.empty) {
          if (seat.clientIndex > index) seat.clientIndex -= 1;
        }
      });
      delete clients[client.clientId];
    }
  });

  // clients[client.clientId].connection.send(JSON.stringify(payLoad));
};

module.exports = clientLeft;
