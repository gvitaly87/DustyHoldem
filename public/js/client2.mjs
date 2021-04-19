import insertCard from "/js/insertCard.mjs";
// import updateGame from "/js/updateGame.mjs";

//HTML elements
let clientId = null;
let gameId = null;

let roundBet = 0;

let playerRoundBet = 0;
let playerChips = null;
let playerSeat = null;
let playerHand = [];
let game = {};
let table = {};

const HOST = location.origin.replace(/^http/, "ws");
let ws = new WebSocket(HOST);

const divPlayers = document.getElementById("divPlayers");

//wiring events
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");
const btnCopyId = document.getElementById("btnCopyId");

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
const btnCreate = document.getElementById("btnCreate");
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
/************Copy Game ID************/
btnCopyId.addEventListener("click", () => {
  const textToCopy = document.getElementById("gameId").innerText;

  const myTemporaryInputElement = document.createElement("input");
  myTemporaryInputElement.type = "text";
  myTemporaryInputElement.value = textToCopy;

  document.body.appendChild(myTemporaryInputElement);

  myTemporaryInputElement.select();
  document.execCommand("Copy");

  document.body.removeChild(myTemporaryInputElement);
});

/***************Fold****************/
const btnFold = document.getElementById("fold");
btnFold.addEventListener("click", () => {
  if (playerSeat !== table.playerToAct) return;
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
btnCheck.addEventListener("click", () => {
  // Check if its the player turn, and that the current player's bet is equivalent to the rounds bet.
  if (
    playerSeat !== table.playerToAct ||
    table.seats[playerSeat].bets[table.round] !== table.roundRaise
  )
    return;
  const payLoad = {
    method: "check",
    clientId,
    gameId,
    playerSeat,
  };
  ws.send(JSON.stringify(payLoad));
});

/***************Call****************/
const btnCall = document.getElementById("call");
btnCall.addEventListener("click", () => {
  if (playerSeat !== table.playerToAct) return;
  const payLoad = {
    method: "call",
    clientId,
    gameId,
    playerSeat,
  };
  ws.send(JSON.stringify(payLoad));
});

const raiseAmountField = document.getElementById("raiseAmount");
const raiseAmountSlider = document.getElementById("raiseRange");

raiseAmountField.addEventListener("input", () => {
  raiseAmountSlider.value = raiseAmountField.value;
});

raiseAmountSlider.addEventListener("input", () => {
  raiseAmountField.value = raiseAmountSlider.value;
});

/***************Raise****************/
const btnRaise = document.getElementById("raise");
btnRaise.addEventListener("click", () => {
  let raiseAmount = parseInt(raiseAmountField.value);

  //checks for fake bets
  if (raiseAmount <= 0 || playerSeat !== table.playerToAct) return;

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

/***********Message************/
const chatMessage = document.getElementById("chat-message");
chatMessage.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    const username = document.getElementById("username").value;
    const payLoad = {
      method: "chat",
      gameId,
      clientId,
      username,
      message: chatMessage.value,
    };
    chatMessage.value = "";
    ws.send(JSON.stringify(payLoad));
  }
});

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
    playerSeat = res.seat;
    updateGame(table, playerSeat);
  }
  if (res.method === "showdown") {
    table = res.table;
    playerSeat = res.seat;
    let tableShowDown = res.tableShowDown;
    tableShowDown.forEach((seat) => {
      let description = `<span class="hand-descr">Hand: ${seat.description}</span>`;
      let seatAdjust = 7 - playerSeat;
      let i = seat.seat + seatAdjust;
      if (i > 10) i -= 10;
      if (i < 1) i += 10;
      const decrContainer = document.querySelector(`.player-${i} .hand-descr`);
      decrContainer.classList.remove("hidden");
      decrContainer.innerHTML = description;

      if (seat.seat !== playerSeat) {
        let cards = insertCard(seat.card1) + insertCard(seat.card2);
        document.querySelector(`.player-${i} .hand`).innerHTML = cards;
      }
    });
    setTimeout(() => updateGame(table, playerSeat), 7500);
  }
  //A new player joins
  if (res.method === "join") {
    table = res.table;
    gameId = res.gameId;
    const { client, gameStarted } = res;
    if (client.clientId === clientId) {
      document.querySelector("#gameId").innerText = gameId;
      document.querySelector("#player .user-name").innerText = client.username;
      document.querySelector("#player .chip-count").innerText =
        client.chipCount;
      document.querySelector("#player .position").innerText =
        "Waiting to join...";
      const gameStage = document.querySelector(".game-stage");
      if (gameStarted) {
        gameStage.innerText = {
          0: "Dealing Cards...",
          1: "Pre-flop",
          2: "Flop",
          3: "Turn",
          4: "River",
          5: "Showdown",
        }[table.round];
        const gamePot = document.querySelector(".game-pot");
        gamePot.innerText = table.pot;

        const playerTurn = document.querySelector(".player-turn");
        const currentTurnPlayerName = table.seats[table.playerToAct].username;
        playerTurn.innerText = `It is ${currentTurnPlayerName}'s Turn`;

        if (table.round >= 1) {
          const tableCards = document.querySelector(".table-cards");
          let cardsHTML = "";
          table.cards.forEach((card) => {
            cardsHTML += insertCard(card);
          });
          tableCards.innerHTML = cardsHTML;
        }
      } else {
        gameStage.innerText = "Waiting for game to start...";
      }
    } else {
      let seatAdjust = 7 - playerSeat;
      let i = client.seat + seatAdjust;
      if (i > 10) i -= 10;
      if (i < 1) i += 10;
      const opponent = document.querySelector(`.player-${i}`);

      opponent.innerHTML = `
        <div class="hand"></div>
        <div class="img-container"></div>
        <div class="user-info">
          <span class="hand-descr hidden"></span>
          <span class="user-name">${client.username}</span>
          <div>Chips: <span class="chip-count">${client.chipCount}</span></div>
          <span class="position">Just Joined</span>
          <span class="fold"></span>
        </div>
      `;
    }
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

const updateGame = (table, playerSeat) => {
  const clientId = document.querySelector("#playerId").innerText;
  document.querySelector("#gameId").innerText = gameId;
  roundBet = table.roundRaise;
  let player = table.seats[playerSeat];

  // Updating the player's Info
  let playerPos = "";
  let playerFolded = "";
  if (playerSeat === table.smallBlind) playerPos += " SB";
  if (playerSeat === table.bigBlind) playerPos += " BB";
  if (playerSeat === table.dealer) playerPos += " DEALER";
  if (player.folded) playerFolded += "Folded";
  if (player.newToTable) playerPos = " Just joined";

  document.querySelector("#player .user-name").innerText = player.username;
  document.querySelector("#player .chip-count").innerText = player.chipCount;
  document.querySelector("#player .position").innerText = playerPos;
  document.querySelector("#player .fold").innerText = playerFolded;
  const decrContainer = document.querySelector("#player .hand-descr");
  decrContainer.innerHTML = "";
  // descrContainer.classList.add("hidden");

  const actionControls = document.getElementById("actions");
  if (playerSeat === table.playerToAct) {
    actionControls.classList.remove("invisible");
  } else {
    actionControls.classList.add("invisible");
  }

  // Updating sliders
  // If someone made a bet this round
  if (roundBet) {
    raiseAmountSlider.min = roundBet - player.bets[table.round];
    raiseAmountField.min = roundBet - player.bets[table.round];
    // If the bet is less than the player's chip count
    if (roundBet - player.bets[table.round] < player.chipCount) {
      raiseAmountSlider.value = roundBet - player.bets[table.round];
      raiseAmountField.value = roundBet - player.bets[table.round];
    }
  }
  raiseAmountSlider.max = player.chipCount;
  raiseAmountField.max = player.chipCount;

  table.seats.forEach((seat) => {
    if (!seat.empty && seat.seat !== playerSeat) {
      let seatAdjust = 7 - playerSeat;
      let i = seat.seat + seatAdjust;
      if (i > 10) i -= 10;
      if (i < 1) i += 10;
      const opponent = document.querySelector(`.player-${i}`);
      let oppPos = "";
      let oppFolded = "";
      let oppCards = `<div class="card face-down"></div><div class="card face-down"></div>`;
      if (seat.seat === table.smallBlind) oppPos += " SB";
      if (seat.seat === table.bigBlind) oppPos += " BB";
      if (seat.seat === table.dealer) oppPos += " DEALER";
      if (seat.folded) oppFolded += "Folded";
      if (seat.newToTable) oppPos = " Just joined";
      if (seat.folded || seat.newToTable) oppCards = "";

      opponent.innerHTML = `
        <div class="hand">
          ${oppCards}
        </div>
        <div class="img-container"></div>
        <div class="user-info">
          <span class="hand-descr hidden"></span>
          <span class="user-name">${seat.username}</span>
          <div>Chips: <span class="chip-count">${seat.chipCount}</span></div>
          <span class="position">
            ${oppPos}
          </span>
          <span class="fold">${oppFolded}</span>
        </div>
      `;
    }
  });

  const gameStage = document.querySelector(".game-stage");
  gameStage.innerText = {
    0: "Dealing Cards...",
    1: "Pre-flop",
    2: "Flop",
    3: "Turn",
    4: "River",
    5: "Showdown",
  }[table.round];
  const gamePot = document.querySelector(".game-pot");
  gamePot.innerText = table.pot;
  const playerTurn = document.querySelector(".player-turn");
  const currentTurnPlayerName = table.seats[table.playerToAct].username;
  playerTurn.innerText = `It is ${currentTurnPlayerName}'s Turn`;

  const amountToCall = table.roundRaise - playerRoundBet;
  btnCall.innerText = `Call (${amountToCall})`;
  if (amountToCall === 0) {
    btnCall.classList.add("hidden");
    if ((btnCheck.className = "hidden")) btnCheck.classList.remove("hidden");
  } else {
    btnCheck.classList.add("hidden");
    if (btnCall.className === "hidden") btnCall.classList.remove("hidden");
  }
  if (table.round === 0) {
    const handPlaceHolder = document.getElementById("hand");
    handPlaceHolder.innerHTML = "";
    const tableCards = document.querySelector(".table-cards");
    tableCards.innerHTML = "";
  }
  if (table.round === 1) {
    const tableCards = document.querySelector(".table-cards");
    tableCards.innerHTML = "";
    if (!table.seats[playerSeat].newToTable) {
      const handPlaceHolder = document.getElementById("hand");
      const firstCard = insertCard(table.seats[playerSeat].hand[0]);
      const secondCard = insertCard(table.seats[playerSeat].hand[1]);
      handPlaceHolder.innerHTML = firstCard + secondCard;
    }
  }
  if (table.round > 1) {
    const tableCards = document.querySelector(".table-cards");
    let cardsHTML = "";
    table.cards.forEach((card) => {
      cardsHTML += insertCard(card);
    });
    tableCards.innerHTML = cardsHTML;
  }
  const gameLog = document.getElementById("game-log");
  if (table.gameLog)
    gameLog.innerHTML += `<div class="msg dealer-msg">Dealer: ${table.gameLog}</div>`;
};
