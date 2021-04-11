const http = require("http");
const websocketServer = require("websocket").server;

const express = require("express");
const app = express();
const path = require("path");

const getUniqueID = require("./lib/getUniqueID");
const getSeat = require("./lib/getSeat");
const setQue = require("./lib/setQue");
const respondAllClients = require("./lib/respondAllClients");

// Express
app.use(express.static(path.join(__dirname, "./public")));

app.listen(9091, () => console.log("Listening on http port 9091"));

// WebSocket
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"));
//hashmap clients
const clients = {};
const games = {};

const wsServer = new websocketServer({
  httpServer: httpServer,
});
wsServer.on("request", (req) => {
  //connect
  const connection = req.accept(null, req.origin);
  connection.on("open", () => console.log("Connection opened!"));
  connection.on("close", () => console.log("Connection closed!"));
  connection.on("message", (message) => {
    const res = JSON.parse(message.utf8Data);

    //a user want to create a new game
    if (res.method === "create") {
      const clientId = res.clientId;
      const gameId = getUniqueID();
      // TODO: slim down game object, so only essential information is exchanged each round
      games[gameId] = {
        id: gameId,
        clients: [],
        table: {
          pot: 0,
          round: 0, // 0-new hand 1-preflop, 2-flop, 3-turn, 4-river
          hand: 0,
          playerToAct: 0,
          dealer: 0,
          roundRaise: 0,
          seatsQue: [],
          seats: [],
          clients: [], // or keep client info in seats(this array is so that other players don't know each other's cards);
        },
      };
      // Set all seats to empty
      for (let i = 0; i < 10; i++) {
        games[gameId].table.seats.push({ empty: true });
      }

      const payLoad = {
        method: "create",
        game: games[gameId],
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    //a client want to join an existing game
    if (res.method === "join") {
      const { clientId, gameId, username } = res;
      const chipCount = res.chipCount || 5000;
      const game = games[gameId];

      if (game.clients.length >= 10) {
        //sorry max players reach
        return;
      }

      const seat = getSeat(game.table.seats);
      // TODO: switch to passing the table instead of all the clients
      game.table.seats[seat] = {
        empty: false,
        newToTable: true,
        folded: false,
        clientId,
        seat,
        username,
        chipCount,
        bets: [0, 0, 0, 0],
      };
      game.clients.push({
        clientId,
        username,
        chipCount,
        seat,
      });

      //start the game
      if (game.clients.length >= 3) {
        game.table = setQue(game.table);
        console.log(game.table.seatsQue);
        updateGameState();
      }

      const payLoad = {
        method: "join",
        game: game,
      };

      respondAllClients(clients, game, payLoad);
    }

    if (res.method === "raise") {
      const { clientId, gameId, raiseAmount } = res;
      const game = games[gameId];

      game.table.roundRaise += raiseAmount;
      game.table.pot += raiseAmount;
      game.clients.forEach((client) => {
        if (client.clientId === clientId) client.chipCount -= raiseAmount;
      });
      // game.table.turn += 1;
      // game.table.turn =
      // game.table.turn >= game.clients.length ? 0 : game.table.turn;
      updateGameState();
    }
  });

  //generate a new clientId
  const clientId = getUniqueID();
  clients[clientId] = {
    connection: connection,
  };

  const payLoad = {
    method: "connect",
    clientId: clientId,
  };
  //send back the client connect
  connection.send(JSON.stringify(payLoad));
});

function updateGameState() {
  //{"gameid", fasdfsf}
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payLoad = {
      method: "update",
      game: game,
    };

    respondAllClients(clients, game, payLoad);
  }

  setTimeout(updateGameState, 500);
}
