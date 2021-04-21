import insertCard from "/js/insertCard.mjs";
import copyGameID from "/js/copyGameID.mjs";
import toggleSideBar from "/js/menu.mjs";
import findOppSelector from "/js/findOppSelector.mjs";

const joinPlayer = (client, clientId, player, table, gameStarted) => {
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
      gameStage.innerHTML = `<div class="wait-msg">Waiting for more players to join the game before starting...</div><div class="copy-msg">The game ID has been copied to clipboard</div>`;
    }
  } else {
    console.log(player.seat, client.seat);
    const cssSelector = findOppSelector(player.seat, client.seat);
    const opponent = document.querySelector(cssSelector);
    console.log(cssSelector, opponent);

    opponent.innerHTML = `
        <div class="hand"></div>
        <div class="img-container"></div>
        <div class="user-info">
          <div class="hand-descr hidden"></div>
          <div class="user-name">${client.username}</div>
          <div>Chips: <div class="chip-count">${client.chipCount}</div></div>
          <div class="position">Just Joined</div>
          <div class="fold"></div>
        </div>
      `;
  }
  const gameLog = document.getElementById("game-log");
  gameLog.innerHTML += `<div class="msg dealer-msg">Dealer: ${client.username} just joined the game with ${client.chipCount} chips</div>`;
};

export default joinPlayer;
