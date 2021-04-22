import findOppSelector from "./findOppSelector.mjs";
import insertCard from "/js/insertCard.mjs";

// In game actions
const btnCheck = document.getElementById("check");
const btnCall = document.getElementById("call");
const btnRaise = document.getElementById("raise");
const btnAllIn = document.getElementById("all-in");
const raiseAmountField = document.getElementById("raiseAmount");
const raiseAmountSlider = document.getElementById("raiseRange");

const resetOpponents = () => {
  for (let i = 1; i < 11; i++) {
    if (i !== 7) {
      const oppSelector = document.querySelector(`.player-${i}`);
      oppSelector.innerHTML =
        '<img src="/images/icons/test.png" class="p-icons p2" />';
      if (!oppSelector.classList.contains("clear"))
        oppSelector.classList.add("clear");
    }
  }
};

const showBtn = (btnElement) => {
  if (btnElement.classList.contains("hidden"))
    btnElement.classList.remove("hidden");
};

const hideBtn = (btnElement) => {
  if (!btnElement.classList.contains("hidden"))
    btnElement.classList.add("hidden");
};

const updateSliders = (table, player) => {
  // Updating sliders
  // If someone made a bet this round
  if (table.roundRaise >= 100 && table.roundRaise > player.bets[table.round]) {
    raiseAmountSlider.min = table.roundRaise - player.bets[table.round];
    raiseAmountField.min = table.roundRaise - player.bets[table.round];
    // If the bet is less than the player's chip count
    if (table.roundRaise - player.bets[table.round] < player.chipCount) {
      raiseAmountSlider.value = table.roundRaise - player.bets[table.round];
      raiseAmountField.value = table.roundRaise - player.bets[table.round];
    }
  } else {
    raiseAmountSlider.min = 100;
    raiseAmountField.min = 100;
    raiseAmountSlider.value = 100;
    raiseAmountField.value = 100;
  }
  if (player.chipCount <= 0) {
    hideBtn(raiseAmountSlider);
    hideBtn(raiseAmountField);
    hideBtn(btnRaise);
    hideBtn(btnAllIn);
  } else {
    showBtn(raiseAmountSlider);
    showBtn(raiseAmountField);
    showBtn(btnRaise);
    showBtn(btnAllIn);
    raiseAmountSlider.max = player.chipCount;
    raiseAmountField.max = player.chipCount;
  }
};

const updateGame = (table, playerSeat) => {
  player = table.seats[playerSeat];

  // Updating the player's Info
  let playerPos = "";
  let playerFolded = "";

  if (!player.newToTable) {
    if (player.folded) playerFolded += "Folded";
  } else {
    playerPos = " Just joined";
  }
  if (playerSeat === table.smallBlind) playerPos += " SB";
  if (playerSeat === table.bigBlind) playerPos += " BB";
  if (playerSeat === table.dealer) playerPos += " DEALER";

  document.querySelector("#player .user-name").innerText = player.username;
  document.querySelector("#player .round-bet").innerText =
    player.bets[table.round];
  document.querySelector("#player .chip-count").innerText = player.chipCount;
  document.querySelector("#player .position").innerText = playerPos;
  document.querySelector("#player .fold").innerText = playerFolded;
  const decrContainer = document.querySelector("#player .hand-descr");
  decrContainer.innerHTML = "";
  // if (!decrContainer.classList.contains("hidden"))
  // decrContainer.classList.add("hidden");

  const actionControls = document.getElementById("actions");
  if (playerSeat === table.playerToAct) {
    if (actionControls.classList.contains("hidden"))
      actionControls.classList.remove("hidden");
  } else {
    if (!actionControls.classList.contains("hidden"))
      actionControls.classList.add("hidden");
  }

  updateSliders(table, player);
  resetOpponents();
  table.seats.forEach((seat) => {
    if (!seat.empty && seat.seat !== playerSeat) {
      const cssSelector = findOppSelector(playerSeat, seat.seat);

      const opponent = document.querySelector(cssSelector);
      if (opponent.classList.contains("clear"))
        opponent.classList.remove("clear");

      let oppPos = "";
      let oppFolded = "";
      let oppCards = `<div class="card face-down"></div><div class="card face-down"></div>`;

      if (!seat.newToTable) {
        if (seat.folded) oppFolded += "Folded";
      } else {
        oppPos = " Just joined";
      }

      if (seat.seat === table.smallBlind) oppPos += " SB";
      if (seat.seat === table.bigBlind) oppPos += " BB";
      if (seat.seat === table.dealer) oppPos += " DEALER";
      // if (seat.folded && seat.newToTable) oppFolded += "Folded";
      // if (seat.newToTable) oppPos = "Just joined";
      if (seat.folded || seat.newToTable) oppCards = "";

      opponent.innerHTML = `
        <div class="round-bet">${seat.bets[table.round]}</div>
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
  const gamePot = document.querySelector(".pot-value");
  gamePot.innerText = table.pot;
  const playerTurn = document.querySelector(".player-turn");
  const currentTurnPlayerName = table.seats[table.playerToAct].username;
  playerTurn.innerText = `It is ${currentTurnPlayerName}'s Turn`;

  let amountToCall = table.roundRaise - player.bets[table.round];
  amountToCall = amountToCall < 0 ? 0 : amountToCall;

  // Update the Call sum inside the brackets
  if (amountToCall < player.chipCount) {
    btnCall.innerText = `CALL (${amountToCall})`;
    btnAllIn.innerText = `ALL IN (${player.chipCount})`;
  } else {
    btnCall.innerText = `CALL (ALL IN)`;
    btnAllIn.innerText = `ALL IN (${player.chipCount})`;
  }

  // Hide either check or call
  if (amountToCall === 0) {
    hideBtn(btnCall);
    showBtn(btnCheck);
  } else {
    hideBtn(btnCheck);
    showBtn(btnCall);
  }

  // Hide All-in if the player is out of chips
  if (player.chipCount > 0) {
    showBtn(btnAllIn);
  } else {
    hideBtn(btnAllIn);
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
    if (!player.newToTable) {
      const handPlaceHolder = document.getElementById("hand");
      const firstCard = insertCard(player.hand[0]);
      const secondCard = insertCard(player.hand[1]);
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
  const gameLogContainer = document.querySelector(".game-log");
  gameLogContainer.scrollTop = gameLogContainer.scrollHeight;
};

export default updateGame;
