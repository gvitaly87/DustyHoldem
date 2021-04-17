# Texas Hold'em Outline

## Sending information back and forth

### Server Side

1. Set up an empty index page
2. Serve the page on the default port

- add listener to the default port
- serve a static page

3. Set up a websocket listener to receive information from client
4. Give each new client a unique ID
5. Analyze request on connection
6. If the clients requests to create a new game

- Create game
- Generate unique game
- Send the game information back to the client

7. If a client requests to join a game

- Make sure the game id matches an existing game
  - If it doesn't send error message
  - if it does join client to game clients
    - Assign the client a unique seat
    - Assign the client chips
    - if the minimum players number is reached start and initialize the game
    - if the game is in progress await new round to join in
  - Update the game information for the other clients notifying them a new player has joined

### Client Side

1. Create new game/join existing game
2. Update game state based on received information

- Reveal the player's cards
- Display the player's chips
- Display the pot
- Display each opponents name/chips/position
- Display an error message if an error occurs
- Display the cards place on the table
- Display who's turn it is
- Display the dealer and blinds positions
- If it's the players turn display the allowed actions fold check/call and bet
  - When a player preforms an action send it to the server
- If a showdown occurs display opponent's cards for 5 seconds
  - Display a message regarding who won the pot

3. Display the chat and game log messages

- When a player sends a message send it to the server

## Game Actions once a game has started

1. Differentiate active players from players that just joined
2. Reset Table at the beginning of each round

- Let awaiting players join the game
- Set the game pot to 0
- Determine new dealer position
- Determine the new big and small blind positions
  - collect bets from blind positions
  - Add bets to pot
  - Save the bet amounts for each player
- Determine the turn que for the current hand

3. If the round is pre-flop

- Send all active players a pair of cards

4. Send the clients the updated game state after each action
5. If a client requests to fold

- remove the client from the turn que
- pass the turn to the next player in que
- send updated game state to all clients

5. If a client requests to checks

- make sure that there were no bets made this round
- if there were no bets pass the turn to the next player in que
  - send updated game state to all clients
- else wait for a different action

5. If a client requests to call

- If there was a bet made this round
  - If the client has enough chips to call
    - subtract the chips from the client's chips
    - add the chips to the pot
    - remove the player from the action que until the next round or until a bet is made
  - If the client doesn't have enough chips to call
    - subtract all chips from the client's chips
    - add all the chips to the pot
    - set the client as all in
      - remove the player form the action que until the next hand
    - keep track of a partial pot
    - if at the end of the round a player has bet more than the call amount he will get the excess chips back
- if there wasn't treat it as a check
- pass turn to the next player
- send updated game to all clients

5. If a client requests to bet

- If the client has enough chips to make the bet
  - If the bet amount is more than the round bet
    - subtract the chips from the client
    - add the chips to the pot
    - remove the player from the action que until the next round or until a bet is made
    - add all players that haven't folded, and aren't all in to the action que
  - pass turn to the next player
  - send updated game to all clients

6. If the action que for the round is empty advance the round by one

- send updated game to all clients

7. If the round is the flop

- place three cards on the table

7. If the round is the turn/river

- add an additional card to the table

7. If the round reached a showdown

- Reveal all the remaining player's cards
- Decide the winner from the remaining players for each partial pot
  - Determine the winner based on the hand strength based on Texas Hold'em poker rules
  - If there is more than one winner determine the split pot size
  - Increase each winner's chips by the amount won

8. Start a new hand

- set round to joining stage
