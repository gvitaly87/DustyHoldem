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
    let playerSeat = res.seat;
    updateGame(table, playerSeat);
  }
  if (res.method === "showdown") {
    table = res.table;
    let playerSeat = res.seat;
    let tableShowDown = res.tableShowDown;
    while (divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);
    console.log(tableShowDown);
    tableShowDown.forEach((seat) => {
      const player = document.createElement("div");

      player.innerText = "Name:";
      const username = document.createElement("span");

      username.classList.add("username");
      username.innerText = seat.username;
      player.appendChild(username);

      player.innerHTML += " Chips:";

      const chipCount = document.createElement("span");
      chipCount.classList.add("chip-count");
      chipCount.innerText = seat.chipCount;
      player.appendChild(chipCount);

      player.innerHTML += ` Seat: ${seat.seat}`;

      const firstCard = insertCard(seat.card1);
      const secondCard = insertCard(seat.card2);
      player.innerHTML += firstCard + secondCard;
      player.innerHTML += `Hand: ${seat.description}`;

      divPlayers.appendChild(player);
    });
    setTimeout(() => updateGame(game), 5000);
  }
  //A new player joins
  if (res.method === "join") {
    game = res.game;
    gameId = res.game.id;
    document.querySelector("#gameId").innerText = gameId;
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
    }[table.round];
    const gamePot = document.querySelector(".game-pot");
    gamePot.innerText = table.pot;
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
  const playerContainer = document.getElementById("player");
  playerContainer.innerHTML = `
    <div id="hand">
          <img src="/images/icons/test.png" class="p-icons p7" />
    </div>
    
  `;

  while (divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);

  table.seats.forEach((seat) => {
    if (!seat.empty) {
      const player = document.createElement("div");
      // Distinguishes between player and other users
      if (seat.clientId === clientId) {
        player.classList.add("player");
        playerChips = seat.chipCount;
        playerSeat = seat.seat;
        playerRoundBet = seat.bets[table.round];
        const actionControls = document.getElementById("actions");
        if (playerSeat === table.playerToAct) {
          actionControls.classList.remove("invisible");
        } else {
          actionControls.classList.add("invisible");
        }

        // Updating sliders
        // If someone made a bet this round
        if (roundBet) {
          raiseAmountSlider.min = roundBet - seat.bets[table.round];
          raiseAmountField.min = roundBet - seat.bets[table.round];
          // If the bet is less than the player's chip count
          if (roundBet - seat.bets[table.round] < seat.chipCount) {
            raiseAmountSlider.value = roundBet - seat.bets[table.round];
            raiseAmountField.value = roundBet - seat.bets[table.round];
          }
        }
        raiseAmountSlider.max = seat.chipCount;
        raiseAmountField.max = seat.chipCount;
      } else {
        player.classList.add("opponent");
      }

      player.innerText = "Name:";

      const username = document.createElement("span");
      username.classList.add("username");
      username.innerText = seat.username;
      player.appendChild(username);

      player.innerHTML += " Chips:";

      const chipCount = document.createElement("span");
      chipCount.classList.add("chip-count");
      chipCount.innerText = seat.chipCount;
      player.appendChild(chipCount);

      player.innerHTML += ` Seat: ${seat.seat}`;

      // Add a Dealer/blinds identifier
      let specialStatus = "";
      if (seat.seat === table.smallBlind) specialStatus += " SB";
      if (seat.seat === table.bigBlind) specialStatus += " BB";
      if (seat.seat === table.dealer) specialStatus += " DEALER";
      if (seat.folded) specialStatus += " Folded";
      if (seat.newToTable && !seat.empty) specialStatus = " Just joined";

      player.innerHTML += specialStatus;

      divPlayers.appendChild(player);
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
