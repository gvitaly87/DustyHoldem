import insertCard from "/js/insertCard.mjs";
import findOppSelector from "./findOppSelector.mjs";

const showDown = (table, playerSeat, winnerMessage, everyoneFolded) => {
  document.querySelector(".game-stage").innerHTML = winnerMessage;
  const actionControls = document.getElementById("actions");
  if (!actionControls.classList.contains("hidden"))
    actionControls.classList.add("hidden");
  if (!everyoneFolded) {
    table.forEach((seat) => {
      let description = `<span class="hand-descr">Hand: ${seat.description}</span>`;
      const cssSelector = findOppSelector(playerSeat, seat.seat);

      const decrContainer = document.querySelector(
        `${cssSelector} .hand-descr`
      );
      decrContainer.classList.remove("hidden");
      decrContainer.innerHTML = description;

      if (seat.seat !== playerSeat) {
        let cards =
          insertCard(seat.card1, "card-1") + insertCard(seat.card2, "card-2");
        const handContainer = document.querySelector(`${cssSelector} .hand`);
        handContainer.classList.add("opponent");
        handContainer.innerHTML = cards;
      }
    });
  }
};

export default showDown;
