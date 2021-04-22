import copyGameID from "/js/copyGameID.mjs";
import updateGame from "/js/updateGame.mjs";
import showDown from "/js/showDown.mjs";
import joinPlayer from "./joinPlayer.mjs";

// Client Global Variable
let clientId = null;
let gameId = null;

let table = {};
let player = {};

// Websocket
const HOST = location.origin.replace(/^http/, "ws");
let ws = new WebSocket(HOST);

// New/Join Game
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");
const btnCopyId = document.getElementById("btnCopyId");

// In game actions
const btnFold = document.getElementById("fold");
const btnCheck = document.getElementById("check");
const btnCall = document.getElementById("call");
const btnRaise = document.getElementById("raise");
const btnAllIn = document.getElementById("all-in");
const raiseAmountField = document.getElementById("raiseAmount");
const raiseAmountSlider = document.getElementById("raiseRange");

// Chat actions
const chatMessage = document.getElementById("chat-message");

// Join game listener
btnJoin.addEventListener("click", () => {
  btnCopyId.classList.remove("hidden");

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
btnCreate.addEventListener("click", () => {
  btnCopyId.classList.remove("hidden");
  let username = document.getElementById("username").value;
  const payLoad = {
    method: "create",
    clientId,
    username,
  };

  ws.send(JSON.stringify(payLoad));
});

btnCopyId.addEventListener("click", copyGameID);

/***************Fold****************/
btnFold.addEventListener("click", () => {
  if (player.seat !== table.playerToAct) return;
  const payLoad = {
    method: "fold",
    clientId,
    gameId,
    playerSeat: player.seat,
  };
  ws.send(JSON.stringify(payLoad));
});

/***************Check****************/
btnCheck.addEventListener("click", () => {
  // Check if its the player turn, and that the current player's bet is equivalent to the rounds bet.
  if (
    player.seat !== table.playerToAct ||
    table.seats[player.seat].bets[table.round] !== table.roundRaise
  )
    return;
  const payLoad = {
    method: "check",
    clientId,
    gameId,
    playerSeat: player.seat,
  };
  ws.send(JSON.stringify(payLoad));
});

/*************** Call ****************/
btnCall.addEventListener("click", () => {
  if (player.seat !== table.playerToAct) return;
  const payLoad = {
    method: "call",
    clientId,
    gameId,
    playerSeat: player.seat,
  };
  ws.send(JSON.stringify(payLoad));
});

/*************** Raise ****************/
/************** Sliders ***************/
raiseAmountField.addEventListener("input", () => {
  raiseAmountSlider.value = raiseAmountField.value;
});

raiseAmountSlider.addEventListener("input", () => {
  raiseAmountField.value = raiseAmountSlider.value;
});

/************** Action ***************/
btnRaise.addEventListener("click", () => {
  let raiseAmount = parseInt(raiseAmountField.value);

  //checks for fake bets
  if (raiseAmount <= 0 || player.seat !== table.playerToAct) return;

  // You can't bet more chips than you have
  raiseAmount = raiseAmount < player.chipCount ? raiseAmount : player.chipCount;
  // console.log(raiseAmount);
  const payLoad = {
    method: "raise",
    gameId,
    clientId,
    playerSeat: player.seat,
    raiseAmount,
  };

  ws.send(JSON.stringify(payLoad));
});

btnAllIn.addEventListener("click", () => {
  const raiseAmount = player.chipCount;

  //checks for fake bets
  if (raiseAmount <= 0 || player.seat !== table.playerToAct) return;

  const payLoad = {
    method: "raise",
    gameId,
    clientId,
    playerSeat: player.seat,
    raiseAmount,
  };
  // console.log(
  //   "Round Raise: ",
  //   table.roundRaise,
  //   "Player All in Amount: ",
  //   raiseAmount
  // );
  if (table.roundRaise >= raiseAmount) {
    payLoad.method = "call";
    console.log("call");
  } else console.log("raise");

  ws.send(JSON.stringify(payLoad));
});
/***********Message************/
chatMessage.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    const username = document.getElementById("username").value;
    if (gameId !== null) {
      const payLoad = {
        method: "chat",
        gameId,
        clientId,
        username: player.username,
        message: chatMessage.value,
      };
      chatMessage.value = "";
      ws.send(JSON.stringify(payLoad));
    } else {
      const gameLog = document.getElementById("game-log");
      gameLog.innerHTML +=
        '<div class="msg err-msg">Unable to send a message before connecting to a game...</div>';
      const gameLogContainer = document.querySelector(".game-log");
      gameLogContainer.scrollTop = gameLogContainer.scrollHeight;
    }
  }
});

/************ WebSocket Server Responses *********/
ws.onmessage = async (message) => {
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
    document.getElementById("gameId").innerText = gameId;
    let username = document.getElementById("username").value;

    const payLoad = {
      method: "join",
      clientId,
      gameId,
      username,
    };

    ws.send(JSON.stringify(payLoad));
  }

  //updated game state from server
  if (res.method === "update") {
    table = res.table;
    const playerSeat = res.seat;
    player = table.seats[playerSeat];
    updateGame(table, playerSeat);
    setTimeout(() => {
      let reqActionCounter = 0;
      if (table.roundJustStarted && playerSeat === table.playerToAct) {
        table.seats.forEach((seat) => {
          if (
            !seat.empty &&
            seat.actionRequired &&
            !seat.folded &&
            !seat.allIn
          ) {
            reqActionCounter += 1;
          }
        });
        if (reqActionCounter <= 1) {
          const payLoad = {
            method: "check",
            clientId,
            gameId,
            playerSeat: player.seat,
          };
          ws.send(JSON.stringify(payLoad));
        }
      }
    }, 2000);
  }
  if (res.method === "showdown") {
    table = res.table;
    const playerSeat = res.seat;
    const { tableShowDown, winnerMessage, everyoneFolded } = res;
    player = table.seats[playerSeat];

    showDown(tableShowDown, playerSeat, winnerMessage, everyoneFolded);
    setTimeout(() => updateGame(table, playerSeat), 7000);
  }
  //A new player joins
  if (res.method === "join") {
    table = res.table;
    gameId = res.gameId;
    document.getElementById("gameId").innerText = gameId;

    const { client, gameStarted } = res;
    if (client.clientId === clientId) player = client;
    joinPlayer(client, clientId, player, table, gameStarted);
  }

  // Error message
  if (res.method === "error") {
    const errorContainer = document.querySelector(".error");
    errorContainer.innerText = res.message;
  }
  if (res.method === "chat") {
    const gameLog = document.getElementById("game-log");
    gameLog.innerHTML += `<div class="msg player-msg">${res.username}: ${res.message}</div>`;
    const gameLogContainer = document.querySelector(".game-log");
    gameLogContainer.scrollTop = gameLogContainer.scrollHeight;
  }
};
