const updateGame = (
  game,
  clientId,
  playerChips,
  playerSeat,
  playerRoundBet
) => {
  const clientId = document.querySelector("#playerId").innerText;
  document.querySelector("#gameId").innerText = gameId;
  roundBet = game.table.roundRaise;
  while (divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);

  game.table.seats.forEach((seat) => {
    if (!seat.empty) {
      const player = document.createElement("div");
      // Distinguishes between player and other users
      if (seat.clientId === clientId) {
        player.classList.add("player");
        playerChips = seat.chipCount;
        playerSeat = seat.seat;
        playerRoundBet = seat.bets[game.table.round];
        const actionControls = document.getElementById("actions");
        if (playerSeat === game.table.playerToAct) {
          actionControls.classList.remove("invisible");
        } else {
          actionControls.classList.add("invisible");
        }

        // Updating sliders
        // If someone made a bet this round
        if (roundBet) {
          raiseAmountSlider.min = roundBet - seat.bets[game.table.round];
          raiseAmountField.min = roundBet - seat.bets[game.table.round];
          // If the bet is less than the player's chip count
          if (roundBet - seat.bets[game.table.round] < seat.chipCount) {
            raiseAmountSlider.value = roundBet - seat.bets[game.table.round];
            raiseAmountField.value = roundBet - seat.bets[game.table.round];
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
      if (seat.seat === game.table.smallBlind) specialStatus += " SB";
      if (seat.seat === game.table.bigBlind) specialStatus += " BB";
      if (seat.seat === game.table.dealer) specialStatus += " DEALER";
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
  }[game.table.round];
  const gamePot = document.querySelector(".game-pot");
  gamePot.innerText = game.table.pot;
  const playerTurn = document.querySelector(".player-turn");
  const currentTurnPlayerName =
    game.table.seats[game.table.playerToAct].username;
  playerTurn.innerText = `It is ${currentTurnPlayerName}'s Turn`;

  const amountToCall = game.table.roundRaise - playerRoundBet;
  btnCall.innerText = `Call (${amountToCall})`;
  if (amountToCall === 0) {
    btnCall.classList.add("hidden");
    if ((btnCheck.className = "hidden")) btnCheck.classList.remove("hidden");
  } else {
    btnCheck.classList.add("hidden");
    if (btnCall.className === "hidden") btnCall.classList.remove("hidden");
  }
  if (game.table.round === 0) {
    const handPlaceHolder = document.getElementById("hand");
    handPlaceHolder.innerHTML = "";
    const tableCards = document.querySelector(".table-cards");
    tableCards.innerHTML = "";
  }
  if (game.table.round === 1) {
    const tableCards = document.querySelector(".table-cards");
    tableCards.innerHTML = "";
    if (!game.table.seats[playerSeat].newToTable) {
      const handPlaceHolder = document.getElementById("hand");
      const firstCard = insertCard(game.table.seats[playerSeat].hand[0]);
      const secondCard = insertCard(game.table.seats[playerSeat].hand[1]);
      handPlaceHolder.innerHTML = firstCard + secondCard;
    }
  }
  if (game.table.round > 1) {
    const tableCards = document.querySelector(".table-cards");
    let cardsHTML = "";
    game.table.cards.forEach((card) => {
      cardsHTML += insertCard(card);
    });
    tableCards.innerHTML = cardsHTML;
  }
  const gameLog = document.getElementById("game-log");
  if (game.table.gameLog)
    gameLog.innerHTML += `<div class="msg dealer-msg">Dealer: ${game.table.gameLog}</div>`;
};

export default updateGame;
