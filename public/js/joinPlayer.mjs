import insertCard from "/js/insertCard.mjs";
import copyGameID from "/js/copyGameID.mjs";
import toggleSideBar from "/js/menu.mjs";
import findOppSelector from "/js/findOppSelector.mjs";

const joinPlayer = (client, clientId, table, gameStarted) => {
  if (client.clientId === clientId) {
    // Close the menu on a successful join
    toggleSideBar();
    copyGameID();
    document.querySelector("#player .user-info").classList.remove("hidden");
    document.querySelector("#gameId").innerText = gameId;
    document.querySelector("#player .user-name").innerText = client.username;
    document.querySelector("#player .chip-count").innerText = client.chipCount;
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
      const gamePot = document.querySelector(".pot-value");
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
      gameStage.innerHTML = `<div class="wait-msg">Waiting for game to start...</div><div class="copy-msg">The game ID has been copied to clipboard</div>`;
    }
  } else {
    const cssSelector = findOppSelector(player.seat, client.seat);
    const opponent = document.querySelector(cssSelector);
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
  const gameLog = document.getElementById("game-log");
  gameLog.innerHTML += `<div class="msg dealer-msg">Dealer: ${client.username} just joined the game with ${client.chipCount} chips</div>`;
};

export default joinPlayer;
