require("dotenv").config();
const http = require("http");
const websocketServer = require("websocket").server;

const express = require("express");
const app = express();
const path = require("path");

const getUniqueID = require("./lib/getUniqueID");
const getSeat = require("./lib/getSeat");
const { setQue } = require("./lib/setQue");
const nextToAct = require("./lib/nextToAct");
const updateRound = require("./lib/updateRound");
const respondAllClients = require("./lib/respondAllClients");

const Game = require("./models/game");
const Player = require("./models/player");
const PORT = process.env.PORT || 3000;

// Express
app.use(express.static(path.join(__dirname, "./public")));

// WebSocket
const httpServer = http.createServer(app);

// Start a TCP server listening for connections on the given port and host
httpServer.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}/`)
);

const clients = {};
const games = {};

const wsServer = new websocketServer({
  httpServer: httpServer,
});

wsServer.on("request", (req) => {
  const connection = req.accept(null, req.origin);
  connection.on("open", () => console.log("Connection opened!"));
  // TODO: on connection close determine who left the game
  connection.on("close", () => {
    clientLeft();
    console.log("Connection closed!");
  });
  connection.on("message", (message) => {
    // TODO: security for malicious message
    // TODO: security for DoS attacks
    const res = JSON.parse(message.utf8Data);

    /***************** Create a new Game *****************/
    if (res.method === "create") {
      const clientId = res.clientId;
      const gameId = getUniqueID();

      games[gameId] = new Game(gameId, 10, 50, 100);

      const payLoad = {
        method: "create",
        game: games[gameId],
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    /***************** Join an existing Game *****************/
    if (res.method === "join") {
      const { clientId, gameId, username } = res;
      const chipCount = res.chipCount || 10000;
      // Check that the game exists
      if (games[gameId] === undefined) {
        const payLoad = {
          method: "error",
          status: 404,
          message: "A game with that id can't be found",
        };
        clients[clientId].connection.send(JSON.stringify(payLoad));
      } else {
        const game = games[gameId];
        if (game.clients.length >= 10) {
          const payLoad = {
            method: "error",
            status: "500",
            message: "The game you want to join is already full",
          };
          clients[clientId].connection.send(JSON.stringify(payLoad));
          return;
        }
        const seat = getSeat(game.table.seats);
        game.clients.push({
          clientId,
          username,
          chipCount,
          seat,
          hand: [],
        });
        const clientIndex = game.clients.length - 1;
        game.table.seats[seat] = new Player(
          clientId,
          username,
          seat,
          chipCount,
          clientIndex
        );

        if (game.hasStarted) {
          game.table.seats[seat].folded = true;
        }

        //start the game
        if (game.clients.length >= 3 && !game.hasStarted) {
          let { table, deck } = setQue(game.table, game.deck);
          game.hasStarted = true;
          game.table = table;
          game.deck = deck;
          updateGameState(game);
        }

        const payLoad = {
          method: "join",
          gameId: game.id,
          gameStarted: game.hasStarted,
          table: game.table,
          client: game.clients[clientIndex],
        };
        respondAllClients(clients, game, payLoad);
      }
    }
    /***************** In Game Actions *****************/
    /*************** Fold ****************/
    if (res.method === "fold") {
      const { clientId, gameId, playerSeat } = res;
      const game = games[gameId];
      const table = game.table;
      const player = table.seats[playerSeat];
      const client = game.clients[player.clientIndex];

      // Compare the playerId with the information stored in clients(which is not passed to the other players)
      if (clientId === client.clientId) {
        player.folded = true;
        table.gameLog = `${player.username} folds`;

        let updatedRound = setQue(table, game.deck, true);
        updatedRound = updateRound(
          updatedRound.table,
          playerSeat,
          updatedRound.deck
        );

        game.table = updatedRound.table;
        game.deck = updatedRound.deck;

        game.table.seats.forEach((seat) => {
          if (!seat.empty) {
            game.clients[seat.clientIndex].chipCount = seat.chipCount;
          }
        });

        updateGameState(game);
      }
    }

    /*************** Check ****************/
    if (res.method === "check") {
      const { clientId, gameId, playerSeat } = res;
      const game = games[gameId];
      const table = game.table;
      const player = table.seats[playerSeat];
      const client = game.clients[player.clientIndex];

      if (
        client.clientId === clientId &&
        player.bets[table.round] === table.roundRaise
      ) {
        player.actionRequired = false;
        table.gameLog = `${player.username} checks`;

        const updatedRound = updateRound(table, playerSeat, game.deck);
        game.table = updatedRound.table;
        game.deck = updatedRound.deck;

        game.table.seats.forEach((seat) => {
          if (!seat.empty) {
            game.clients[seat.clientIndex].chipCount = seat.chipCount;
          }
        });

        if (updatedRound.isShowDown) {
          showDownGameState(
            game,
            updatedRound.tableShowDown,
            updatedRound.winnerMessage
          );
        } else {
          updateGameState(game);
        }
      }
    }
    /*************** Call *****************/
    if (res.method === "call") {
      const { clientId, gameId, playerSeat } = res;
      const game = games[gameId];
      const table = game.table;
      const player = table.seats[playerSeat];
      const client = game.clients[player.clientIndex];

      // Check if the player's seat hasn't been tempered with
      if (client.clientId === clientId) {
        let amountToCall = table.roundRaise - player.bets[table.round];
        table.gameLog = `${player.username} calls ${amountToCall}`;
        if (player.chipCount <= amountToCall) {
          amountToCall = player.chipCount;
          player.allIn = true;
          table.gameLog = `${player.username} calls ${amountToCall} and is all in`;
        }
        player.chipCount -= amountToCall;
        client.chipCount = player.chipCount;
        player.bets[game.table.round] += amountToCall;
        // Keep track of the highest call each round
        if (player.bets[game.table.round] > table.roundCall) {
          table.roundCall = player.bets[game.table.round];
        }
        // console.log("Round Call: ", table.roundCall);
        player.actionRequired = false;
        table.pot += amountToCall;

        let updatedRound = updateRound(table, playerSeat, game.deck);
        game.table = updatedRound.table;
        game.deck = updatedRound.deck;

        game.table.seats.forEach((seat) => {
          if (!seat.empty) {
            game.clients[seat.clientIndex].chipCount = seat.chipCount;
          }
        });

        if (updatedRound.isShowDown) {
          showDownGameState(
            game,
            updatedRound.tableShowDown,
            updatedRound.winnerMessage
          );
        } else {
          updateGameState(game);
        }
      }
    }
    /*************** Raise ****************/
    if (res.method === "raise") {
      const { clientId, gameId, playerSeat } = res;
      let raiseAmount = res.raiseAmount;
      const game = games[gameId];
      const table = game.table;
      const player = table.seats[playerSeat];
      const client = game.clients[player.clientIndex];
      // console.log("Raise Amount: ", res.raiseAmount);

      if (
        client.clientId === clientId &&
        raiseAmount + player.bets[table.round] >= table.roundRaise
      ) {
        if (raiseAmount >= player.chipCount) {
          raiseAmount = player.chipCount;
          player.allIn = true;
          table.gameLog += " and is all in";
        }
        // console.log("Adjusted raise amount: ", raiseAmount);
        player.chipCount -= raiseAmount;
        client.chipCount = player.chipCount;
        player.bets[table.round] += raiseAmount;
        table.gameLog = `${player.username} bets ${raiseAmount}`;
        table.roundRaise = player.bets[table.round];
        table.pot += raiseAmount;
        table.playerToAct = nextToAct(table);
        player.actionRequired = false;
        table.seatsQue.forEach((que) => {
          if (que !== playerSeat && !table.seats[que].allIn)
            table.seats[que].actionRequired = true;
        });
      }
      game.table.seats.forEach((seat) => {
        if (!seat.empty) {
          game.clients[seat.clientIndex].chipCount = seat.chipCount;
        }
      });
      updateGameState(game);
    }
    /***************** Chat Message ****************/
    if (res.method === "chat") {
      const { clientId, gameId, username, message } = res;

      if (games[gameId] === undefined) {
        const payLoad = {
          method: "error",
          status: 404,
          message: "A game with that id can't be found",
        };
        clients[clientId].connection.send(JSON.stringify(payLoad));
      } else {
        const game = games[gameId];
        const payLoad = {
          method: "chat",
          message,
          username,
        };
        respondAllClients(clients, game, payLoad);
      }
    }
  });

  // generate a new clientId
  const clientId = getUniqueID();
  clients[clientId] = {
    connection: connection,
  };
  const payLoad = {
    method: "connect",
    clientId: clientId,
  };
  connection.send(JSON.stringify(payLoad));
});

function updateGameState(game) {
  const payLoad = {
    method: "update",
    table: game.table,
  };
  respondAllClients(clients, game, payLoad);
}

function showDownGameState(game, tableShowDown, winnerMessage) {
  const payLoad = {
    method: "showdown",
    tableShowDown,
    winnerMessage,
    table: game.table,
  };
  respondAllClients(clients, game, payLoad);
}

const clientLeft = () => {
  for (const g of Object.keys(games)) {
    const game = games[g];
    game.clients.forEach((client, index, object) => {
      if (clients[client.clientId].connection.state === "closed") {
        console.log(client.username, " has left the game!");
        game.table.gameLog = `${client.username} has left the game`;
        game.table.seats[client.seat] = { empty: true };
        if (game.table.playerToAct === client.seat)
          game.table.playerToAct = nextToAct(game.table);

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
    let { table, deck } = setQue(game.table, game.deck, true);
    game.table = table;
    game.deck = deck;
    updateGameState(game);
  }
};
