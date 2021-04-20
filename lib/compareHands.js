/******Compares Two hands of 5 cards***********/
/* Input: hand 1 array, hand 2 array
 * Output: true if hands match, false if they don't
 */
const compareHands = (hand1, hand2, cardIndex = 0) => {
  if (cardIndex === 5) return true;
  if (
    hand2[cardIndex].value === hand1[cardIndex].value &&
    hand2[cardIndex].suit === hand1[cardIndex].suit
  ) {
    cardIndex += 1;
    return compareHands(hand1, hand2, cardIndex);
  } else {
    return false;
  }
};

module.exports = compareHands;
