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
  connection.on("close", () => console.log("Connection closed!"));
  connection.on("message", (message) => {
    // TODO: security for malicious message
    const res = JSON.parse(message.utf8Data);

    //a user want to create a new game
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

    //a client want to join an existing game
    if (res.method === "join") {
      const { clientId, gameId, username } = res;
      const chipCount = res.chipCount || 5000;
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

        game.table.seats[seat] = new Player(
          clientId,
          username,
          seat,
          chipCount,
          game.clients.length - 1
        );
        console.log(game.table.seats[seat].clientIndex);

        game.table.gameLog = `${username} joined the game with ${chipCount} chips`;

        if (game.hasStarted) {
          game.table.seats[seat].folded = true;
        }

        //start the game
        if (game.clients.length >= 3 && !game.hasStarted) {
          let { table, deck } = setQue(game.table, game.deck);
          game.hasStarted = true;
          game.table = table;
          game.deck = deck;
          updateGameState();
        }

        const payLoad = {
          method: "join",
          game: game,
        };
        if (game.clients.length < 3 && game.table.round === 0)
          respondAllClients(clients, game, payLoad);
      }
    }
    /***************Fold****************/
    if (res.method === "fold") {
      const { clientId, gameId, playerSeat } = res;
      const game = games[gameId];
      // TODO: check if its the actual client
      game.table.seats[playerSeat].folded = true;
      console.log(game.table.seats[playerSeat].username, " folds");
      game.table.gameLog = `${game.table.seats[playerSeat].username} folds`;

      let tableObj = setQue(game.table, game.deck, true);
      game.table = tableObj.table;
      game.deck = tableObj.deck;

      tableObj = updateRound(game.table, playerSeat, game.deck);
      game.table = tableObj.table;
      game.deck = tableObj.deck;
      updateGameState();
    }

    /***************Check****************/
    if (res.method === "check") {
      const { clientId, gameId, playerSeat } = res;
      const game = games[gameId];
      if (
        game.table.seats[playerSeat].bets[game.table.round] ===
        game.table.roundRaise
      ) {
        game.table.seats[playerSeat].actionRequired = false;
        game.table.gameLog = `${game.table.seats[playerSeat].username} checks`;
        let tableObj = updateRound(game.table, playerSeat, game.deck);
        game.table = tableObj.table;
        game.deck = tableObj.deck;
        const isShowDown = tableObj.isShowDown;
        const tableShowDown = tableObj.tableShowDown;
        if (isShowDown) {
          showDownGameState(tableShowDown);
        } else {
          updateGameState();
        }
      }
    }
    /***************Call*****************/
    if (res.method === "call") {
      const { clientId, gameId, playerSeat } = res;
      const game = games[gameId];
      // Check if the player's seat hasn't been tempered with
      if (game.table.seats[playerSeat].clientId === clientId) {
        let amountToCall =
          game.table.roundRaise -
          game.table.seats[playerSeat].bets[game.table.round];
        game.table.gameLog = `${game.table.seats[playerSeat].username} calls ${amountToCall}`;
        if (game.table.seats[playerSeat].chipCount < amountToCall) {
          amountToCall = game.table.seats[playerSeat].chipCount;
          game.table.gameLog = `${game.table.seats[playerSeat].username} calls ${amountToCall} and is all in`;
        }
        game.table.seats[playerSeat].chipCount -= amountToCall;
        game.table.seats[playerSeat].bets[game.table.round] += amountToCall;
        game.table.seats[playerSeat].actionRequired = false;
        game.table.pot += amountToCall;
        // game.table.playerToAct = nextToAct(game.table);
        let { table, deck, tableShowDown, isShowDown } = updateRound(
          game.table,
          playerSeat,
          game.deck
        );
        game.table = table;
        game.deck = deck;
        if (isShowDown) {
          showDownGameState(tableShowDown);
        } else {
          updateGameState();
        }
      }
    }
    /***************Raise****************/
    if (res.method === "raise") {
      const { clientId, gameId, playerSeat, raiseAmount } = res;
      const game = games[gameId];

      if (game.table.seats[playerSeat].clientId === clientId) {
        game.table.seats[playerSeat].chipCount -= raiseAmount;
        game.table.seats[playerSeat].bets[game.table.round] += raiseAmount;
        game.table.gameLog = `${game.table.seats[playerSeat].username} bets ${raiseAmount}`;
        if (game.table.seats[playerSeat].chipCount === 0)
          game.table.gameLog += " and is all in";
        game.table.roundRaise += raiseAmount;
        game.table.pot += raiseAmount;
        game.table.playerToAct = nextToAct(game.table);
        game.table.seats[playerSeat].actionRequired = false;
        game.table.seatsQue.forEach((que) => {
          console.log(que, playerSeat);
          if (que !== playerSeat) game.table.seats[que].actionRequired = true;
        });
      }
      updateGameState();
    }
    /*****************Chat Message****************/
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

function updateGameState() {
  // TODO: rewrite updateGameState to update game-state only for one game
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payLoad = {
      method: "update",
      table: game.table,
    };
    respondAllClients(clients, game, payLoad);
  }
}

function showDownGameState(tableShowDown) {
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payLoad = {
      method: "showdown",
      tableShowDown,
      table: game.table,
    };
    respondAllClients(clients, game, payLoad);
  }
}
