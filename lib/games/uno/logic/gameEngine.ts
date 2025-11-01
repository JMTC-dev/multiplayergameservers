import type {
  GameState,
  Player,
  Card,
  CardColor,
  GameAction,
  PlayCardAction,
  Direction,
} from "../types";
import { DEFAULT_GAME_CONFIG } from "../types";
import {
  createDeck,
  shuffleDeck,
  dealCards,
  getStartingCard,
  createCard,
} from "./deck";
import {
  canPlayCard,
  hasPlayableCard,
  findCardInHand,
  isPlayerTurn,
} from "./validation";

// Initialize a new game
export function initializeGame(players: Player[]): GameState {
  const deck = shuffleDeck(createDeck());

  // Deal cards to each player
  const config = DEFAULT_GAME_CONFIG;
  let remainingDeck = deck;
  const updatedPlayers = players.map((player) => {
    const { dealtCards, remainingDeck: newDeck } = dealCards(
      remainingDeck,
      config.initialHandSize
    );
    remainingDeck = newDeck;
    return {
      ...player,
      hand: dealtCards,
    };
  });

  // Get starting card for discard pile
  const { startCard, remainingDeck: finalDeck } =
    getStartingCard(remainingDeck);

  return {
    phase: "playing",
    players: updatedPlayers,
    currentPlayerIndex: 0,
    direction: "clockwise",
    drawPile: finalDeck,
    discardPile: [startCard],
    currentColor: startCard.color!,
    pendingDrawCount: 0,
    lastAction: null,
    winner: null,
    calledUno: [],
  };
}

// Get the next player index based on direction
export function getNextPlayerIndex(
  currentIndex: number,
  playerCount: number,
  direction: Direction
): number {
  if (direction === "clockwise") {
    return (currentIndex + 1) % playerCount;
  } else {
    return (currentIndex - 1 + playerCount) % playerCount;
  }
}

// Advance to the next player's turn
export function advanceTurn(state: GameState): GameState {
  const nextIndex = getNextPlayerIndex(
    state.currentPlayerIndex,
    state.players.length,
    state.direction
  );

  return {
    ...state,
    currentPlayerIndex: nextIndex,
  };
}

// Handle playing a card
export function playCard(
  state: GameState,
  action: PlayCardAction
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { state, error: "Player not found" };
  }

  // Verify it's the player's turn
  if (!isPlayerTurn(state, action.playerId)) {
    return { state, error: "Not your turn" };
  }

  // Find the card in the player's hand
  const card = findCardInHand(player.hand, action.card.id);
  if (!card) {
    return { state, error: "Card not in hand" };
  }

  // Validate the card can be played
  const topCard = state.discardPile[state.discardPile.length - 1];
  if (!canPlayCard(card, topCard, state.currentColor)) {
    return { state, error: "Card cannot be played" };
  }

  // Remove card from player's hand
  const updatedHand = player.hand.filter((c) => c.id !== card.id);

  // Determine new color (for wild cards, use chosen color)
  let newColor = state.currentColor;
  let cardToPlay = card;

  if (card.type === "wild" || card.type === "wild_draw4") {
    if (!action.chosenColor) {
      return { state, error: "Must choose a color for wild card" };
    }
    newColor = action.chosenColor;
    // Create a new card with the chosen color
    cardToPlay = { ...card, color: action.chosenColor };
  } else {
    newColor = card.color!;
  }

  // Check for winner
  const isWinner = updatedHand.length === 0;

  // Update players
  const updatedPlayers = state.players.map((p) =>
    p.id === player.id ? { ...p, hand: updatedHand } : p
  );

  // Add card to discard pile
  const newDiscardPile = [...state.discardPile, cardToPlay];

  // Handle special cards
  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    discardPile: newDiscardPile,
    currentColor: newColor,
    lastAction: action,
    winner: isWinner ? player.id : null,
    phase: isWinner ? "finished" : state.phase,
  };

  // Handle card effects
  switch (card.type) {
    case "reverse":
      newState = {
        ...newState,
        direction:
          state.direction === "clockwise" ? "counterclockwise" : "clockwise",
      };
      break;

    case "skip":
      // Skip next player (advance turn twice)
      newState = advanceTurn(advanceTurn(newState));
      return { state: newState };

    case "draw2":
      newState = {
        ...newState,
        pendingDrawCount: state.pendingDrawCount + 2,
      };
      break;

    case "wild_draw4":
      newState = {
        ...newState,
        pendingDrawCount: state.pendingDrawCount + 4,
      };
      break;
  }

  // Advance to next player (if not already advanced by skip)
  newState = advanceTurn(newState);

  return { state: newState };
}

// Handle drawing a card
export function drawCard(
  state: GameState,
  playerId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { state, error: "Player not found" };
  }

  // Verify it's the player's turn
  if (!isPlayerTurn(state, playerId)) {
    return { state, error: "Not your turn" };
  }

  // Determine how many cards to draw
  const drawCount = state.pendingDrawCount > 0 ? state.pendingDrawCount : 1;

  // Check if we need to reshuffle
  let drawPile = state.drawPile;
  if (drawPile.length < drawCount) {
    // Reshuffle discard pile (except top card) into draw pile
    const topCard = state.discardPile[state.discardPile.length - 1];
    const cardsToShuffle = state.discardPile.slice(0, -1);
    drawPile = shuffleDeck([...drawPile, ...cardsToShuffle]);
  }

  // Draw cards
  const { dealtCards, remainingDeck } = dealCards(drawPile, drawCount);
  const updatedHand = [...player.hand, ...dealtCards];

  // Update players
  const updatedPlayers = state.players.map((p) =>
    p.id === player.id ? { ...p, hand: updatedHand } : p
  );

  // Check if player can play after drawing (if they drew only 1 card voluntarily)
  // If they can't play, advance turn
  const topCard = state.discardPile[state.discardPile.length - 1];
  const canPlay =
    drawCount === 1 &&
    state.pendingDrawCount === 0 &&
    hasPlayableCard(updatedHand, topCard, state.currentColor);

  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    drawPile: remainingDeck,
    pendingDrawCount: 0, // Reset pending draw count
  };

  // If player can't play after drawing, advance turn
  if (!canPlay) {
    newState = advanceTurn(newState);
  }

  return { state: newState };
}

// Handle calling UNO
export function callUno(
  state: GameState,
  playerId: string
): { state: GameState; error?: string } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { state, error: "Player not found" };
  }

  // Check if player already called UNO
  if (state.calledUno.includes(playerId)) {
    return { state, error: "Already called UNO" };
  }

  return {
    state: {
      ...state,
      calledUno: [...state.calledUno, playerId],
    },
  };
}

// Handle UNO challenge (when someone forgets to call UNO)
export function challengeUno(
  state: GameState,
  challengerId: string,
  targetPlayerId: string
): { state: GameState; error?: string; penalized?: boolean } {
  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { state, error: "Target player not found" };
  }

  // Check if target has 1 card and didn't call UNO
  if (
    targetPlayer.hand.length === 1 &&
    !state.calledUno.includes(targetPlayerId)
  ) {
    // Penalize the target player
    const penaltyCards = dealCards(
      state.drawPile,
      DEFAULT_GAME_CONFIG.unoPenalty
    );
    const updatedHand = [...targetPlayer.hand, ...penaltyCards.dealtCards];

    const updatedPlayers = state.players.map((p) =>
      p.id === targetPlayerId ? { ...p, hand: updatedHand } : p
    );

    return {
      state: {
        ...state,
        players: updatedPlayers,
        drawPile: penaltyCards.remainingDeck,
      },
      penalized: true,
    };
  }

  return { state, penalized: false };
}
