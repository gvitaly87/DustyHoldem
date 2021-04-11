//HTML elements
let clientId = null;
let gameId = null;

let roundBet = 0;

let playerRoundBet = 0;
let playerChips = null;
let playerSeat = null;
let game = {};

let ws = new WebSocket("ws://localhost:9090");

const divPlayers = document.getElementById("divPlayers");

//wiring events
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");

// Join game listener
btnJoin.addEventListener("click", () => {
  let username = document.getElementById("username").value;
  if (gameId === null) gameId = txtGameId.value;

  const payLoad = {
    method: "join",
    clientId,
    gameId,
    username,
  };

  ws.send(JSON.stringify(payLoad));
});

// Create a new game listener
const btnCreate = document.getElementById("btnCreate");
btnCreate.addEventListener("click", () => {
  let username = document.getElementById("username").value;
  const payLoad = {
    method: "create",
    clientId,
    username,
  };

  ws.send(JSON.stringify(payLoad));
});

/***************Fold****************/
const btnFold = document.getElementById("fold");
btnFold.addEventListener("click", () => {
  if (playerSeat !== game.table.playerToAct) return;
  const payLoad = {
    method: "fold",
    clientId,
    gameId,
    playerSeat,
  };
  ws.send(JSON.stringify(payLoad));
});

/***************Check****************/
const btnCheck = document.getElementById("check");
btnCreate.addEventListener("click", () => {
  if (playerSeat !== game.table.playerToAct) return;
  const payLoad = {
    method: "check",
    clientId,
    gameId,
  };
});

/***************Raise****************/
const btnRaise = document.getElementById("raise");
btnRaise.addEventListener("click", () => {
  let raiseAmount = parseInt(document.getElementById("raiseAmount").value);

  //checks for fake bets
  if (raiseAmount <= 0 || playerSeat !== game.table.playerToAct) return;

  // You can't bet more chips than you have
  raiseAmount = raiseAmount < playerChips ? raiseAmount : playerChips;

  const payLoad = {
    method: "raise",
    gameId,
    clientId,
    playerSeat,
    raiseAmount,
  };

  ws.send(JSON.stringify(payLoad));
});

ws.onmessage = (message) => {
  //message.data
  const res = JSON.parse(message.data);
  //Just loaded page received Globally Unique Identifier
  if (res.method === "connect") {
    clientId = res.clientId;
    document.querySelector("#playerId").innerText = clientId;
  }

  //A game create request has been processed
  if (res.method === "create") {
    gameId = res.game.id;
    document.querySelector("#gameId").innerText = gameId;
  }

  //updated game state from server
  if (res.method === "update") {
    game = res.game;
    const clientId = document.querySelector("#playerId").innerText;
    roundBet = game.table.roundRaise;
    while (divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);

    game.clients.forEach((client) => {
      const player = document.createElement("div");
      // Distinguishes between player and other users
      if (client.clientId === clientId) {
        player.classList.add("player");
        playerChips = client.chipCount;
        playerSeat = client.seat;
      } else {
        player.classList.add("opponent");
      }

      player.innerText = "Name:";

      const username = document.createElement("span");
      username.classList.add("username");
      username.innerText = client.username;
      player.appendChild(username);

      player.innerHTML += " Chips:";

      const chipCount = document.createElement("span");
      chipCount.classList.add("chip-count");
      chipCount.innerText = client.chipCount;
      player.appendChild(chipCount);

      player.innerHTML += ` Seat: ${client.seat}`;

      divPlayers.appendChild(player);

      const gameStage = document.querySelector(".game-stage");
      gameStage.innerText = {
        0: "Dealing Cards...",
        1: "Pre-flop",
        2: "Flop",
        3: "Turn",
        4: "River",
        5: "Showdown",
      }[game.table.round];
      const gamePot = document.querySelector(".game-pot");
      gamePot.innerText = game.table.pot;
      const playerTurn = document.querySelector(".player-turn");
      playerTurn.innerText = `It is 's Turn`;
    });
  }

  //A new player joins
  if (res.method === "join") {
    game = res.game;
    const clientId = document.querySelector("#playerId").innerText;

    while (divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);

    game.clients.forEach((client) => {
      const player = document.createElement("div");
      // Distinguishes between player and other users
      if (client.clientId === clientId) {
        player.classList.add("player");
      } else {
        player.classList.add("opponent");
      }

      player.innerText = "Name:";

      const username = document.createElement("span");
      username.classList.add("username");
      username.innerText = client.username;
      player.appendChild(username);

      player.innerHTML += " Chips:";

      const chipCount = document.createElement("span");
      chipCount.classList.add("chip-count");
      chipCount.innerText = client.chipCount;
      player.appendChild(chipCount);

      divPlayers.appendChild(player);
    });

    const gameStage = document.querySelector(".game-stage");
    gameStage.innerText = {
      0: "Dealing Cards...",
      1: "Pre-flop",
      2: "Flop",
      3: "Turn",
      4: "River",
      5: "Showdown",
    }[game.table.round];
    const gamePot = document.querySelector(".game-pot");
    gamePot.innerText = game.table.pot;
    const playerTurn = document.querySelector(".player-turn");
    playerTurn.innerText = `It is 's Turn`;
  }
};
