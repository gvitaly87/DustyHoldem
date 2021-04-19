import insertCard from "/js/insertCard.mjs";

const showDown = (table, playerSeat) => {
  table.forEach((seat) => {
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
};

export default showDown;
