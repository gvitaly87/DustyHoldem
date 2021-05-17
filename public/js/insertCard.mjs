const insertCard = (card, cardClass = "table-card") => {
  let color = card.suit === "♣" || card.suit === "♠" ? "black" : "red";
  const cardDiv = `
    <div class="card ${color} ${cardClass}" data-value="${card.value} ${card.suit}">
      ${card.suit}
    </div>
  `;

  return cardDiv;
};

export default insertCard;
