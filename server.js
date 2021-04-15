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
const Deck = require("./lib/deck");

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
          hand: 0, // Counter for hands played
          /* Round keeps track of the rounds of betting for each hand
           * 0 - let new players join game que
           * 1 - pre-flop
           * 2 - flop
           * 3 - turn,
           * 4 - river
           * 5 - showdown
           * */
          round: 0,
          gameLog: null,
          /* Keep values for the big and small values in order to set them when the game initializes */
          sbValue: 50,
          bbValue: 100,
          roundRaise: 100,
          cards: [],
          /* Pointers to seat position of the dealer, blinds, and player to act */
          playerToAct: null,
          dealer: null,
          smallBlind: null,
          bigBlind: null,
          seatsQue: [],
          seats: [],
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
        actionRequired: false,
        clientId,
        seat,
        clientsIndex: clients.length,
        username,
        chipCount,
        hand: [],
        bets: [0, 0, 0, 0, 0],
      };
      game.clients.push({
        clientId,
        username,
        chipCount,
        seat,
      });

      game.table.gameLog = `${username} joined the game with ${chipCount} chips`;

      //start the game
      if (game.clients.length >= 3 && game.table.round === 0) {
        let { table, deck } = setQue(game.table, game.deck);
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
    /***************Fold****************/
    if (res.method === "fold") {
      const { clientId, gameId, playerSeat } = res;
      const game = games[gameId];
      // Check that the id of the player in the seat corresponds to sit provided otherwise searches the seat by id
      if (game.table.seats[playerSeat].clientId === clientId) {
        game.table.seats[playerSeat].folded = true;
      } else {
        game.table.seats.forEach((seat) => {
          if (seat.clientId === clientId) seat.folded = true;
        });
      }
      game.table.gameLog = `${game.table.seats[playerSeat].username} folds`;

      let tableObj = setQue(game.table, game.deck);
      game.table = tableObj.table;
      game.deck = tableObj.deck;

      // game.table.playerToAct = nextToAct(game.table);

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
        // game.table.playerToAct = nextToAct(game.table);
        game.table.gameLog = `${game.table.seats[playerSeat].username} checks`;
        let tableObj = updateRound(game.table, playerSeat, game.deck);
        game.table = tableObj.table;
        game.deck = tableObj.deck;
      }
      updateGameState();
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
          game.table.gameLog = `${username} calls ${amountToCall} and is all in`;
        }
        game.table.seats[playerSeat].chipCount -= amountToCall;
        game.table.seats[playerSeat].bets[game.table.round] += amountToCall;
        game.table.seats[playerSeat].actionRequired = false;
        game.table.pot += amountToCall;
        // game.table.playerToAct = nextToAct(game.table);
        let { table, deck } = updateRound(game.table, playerSeat, game.deck);
        game.table = table;
        game.deck = deck;
        updateGameState();
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
  // TODO: rewrite updateGameState to update game-state only for one game
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payLoad = {
      method: "update",
      game: game,
    };
    console.log("updating game status");
    respondAllClients(clients, game, payLoad);
  }
}
