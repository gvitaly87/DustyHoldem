import copyGameID from "/js/copyGameID.mjs";
import updateGame from "/js/updateGame.mjs";
import showDown from "/js/showDown.mjs";
import playerJoined from "./playerJoined.mjs";

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

  const payLoad = {
    method: "raise",
    gameId,
    clientId,
    playerSeat: player.seat,
    raiseAmount,
  };

  ws.send(JSON.stringify(payLoad));
});

/***********Message************/
chatMessage.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    const username = document.getElementById("username").value;
    const payLoad = {
      method: "chat",
      gameId,
      clientId,
      username: player.username,
      message: chatMessage.value,
    };
    chatMessage.value = "";
    ws.send(JSON.stringify(payLoad));
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
    document.querySelector("#gameId").innerText = gameId;
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
    let playerSeat = res.seat;
    updateGame(table, playerSeat);
  }
  if (res.method === "showdown") {
    table = res.table;
    let playerSeat = res.seat;
    let tableShowDown = res.tableShowDown;
    showDown(tableShowDown, playerSeat);
    setTimeout(() => updateGame(table, playerSeat), 7000);
  }
  //A new player joins
  if (res.method === "join") {
    table = res.table;
    gameId = res.gameId;
    const { client, gameStarted } = res;
    if (client.clientId === clientId) player = client;
    playerJoined(client, clientId, table, gameStarted);
  }

  // Error message
  if (res.method === "error") {
    const errorContainer = document.querySelector(".error");
    errorContainer.innerText = res.message;
  }
  if (res.method === "chat") {
    const gameLog = document.getElementById("game-log");
    gameLog.innerHTML += `<div class="msg player-msg">${res.username}: ${res.message}</div>`;
  }
};
