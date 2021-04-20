import findOppSelector from "./findOppSelector.mjs";
import insertCard from "/js/insertCard.mjs";

// In game actions
const btnCheck = document.getElementById("check");
const btnCall = document.getElementById("call");
const btnAllIn = document.getElementById("all-in");
const raiseAmountField = document.getElementById("raiseAmount");
const raiseAmountSlider = document.getElementById("raiseRange");

const updateGame = (table, playerSeat) => {
  player = table.seats[playerSeat];

  // Updating the player's Info
  let playerPos = "";
  let playerFolded = "";
  if (playerSeat === table.smallBlind) playerPos += " SB";
  if (playerSeat === table.bigBlind) playerPos += " BB";
  if (playerSeat === table.dealer) playerPos += " DEALER";
  if (player.folded) playerFolded += "Folded";
  if (player.newToTable) playerPos = " Just joined";

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
    actionControls.classList.remove("invisible");
  } else {
    actionControls.classList.add("invisible");
  }

  // Updating sliders
  // If someone made a bet this round
  if (table.roundRaise >= 100) {
    raiseAmountSlider.min = table.roundRaise - player.bets[table.round];
    raiseAmountField.min = table.roundRaise - player.bets[table.round];
    // If the bet is less than the player's chip count
    if (table.roundRaise - player.bets[table.round] < player.chipCount) {
      raiseAmountSlider.value = table.roundRaise - player.bets[table.round];
      raiseAmountField.value = table.roundRaise - player.bets[table.round];
    }
  }
  raiseAmountSlider.max = player.chipCount;
  raiseAmountField.max = player.chipCount;

  table.seats.forEach((seat) => {
    if (!seat.empty && seat.seat !== playerSeat) {
      const cssSelector = findOppSelector(playerSeat, seat.seat);

      const opponent = document.querySelector(cssSelector);
      let oppPos = "";
      let oppFolded = "";
      let oppCards = `<div class="card face-down"></div><div class="card face-down"></div>`;
      if (seat.seat === table.smallBlind) oppPos += " SB";
      if (seat.seat === table.bigBlind) oppPos += " BB";
      if (seat.seat === table.dealer) oppPos += " DEALER";
      if (seat.folded && seat.newToTable) oppFolded += "Folded";
      if (seat.newToTable) oppPos = "Just joined";
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

  const amountToCall = table.roundRaise - player.bets[table.round];
  if (amountToCall < player.chipCount) {
    btnCall.innerText = `CALL (${amountToCall})`;
    btnAllIn.innerText = `ALL IN (${player.chipCount})`;
  } else {
    btnCall.innerText = `CALL (ALL IN)`;
    btnAllIn.innerText = `ALL IN (${player.chipCount})`;
  }

  if (amountToCall === 0) {
    btnCall.classList.add("hidden");
    if (btnCheck.classList.contains("hidden"))
      btnCheck.classList.remove("hidden");
  } else {
    btnCheck.classList.add("hidden");
    if (btnCall.classList.contains("hidden"))
      btnCall.classList.remove("hidden");
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
};

export default updateGame;
