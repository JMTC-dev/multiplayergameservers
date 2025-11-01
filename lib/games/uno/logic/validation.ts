import type { Card, CardColor, GameState } from "../types";

// Check if a card can be played on top of another card
export function canPlayCard(
  card: Card,
  topCard: Card,
  currentColor: CardColor
): boolean {
  // Wild cards can always be played
  if (card.type === "wild" || card.type === "wild_draw4") {
    return true;
  }

  // Card must match color or type
  if (card.color === currentColor || card.type === topCard.type) {
    return true;
  }

  return false;
}

// Check if a player has any playable cards
export function hasPlayableCard(
  hand: Card[],
  topCard: Card,
  currentColor: CardColor
): boolean {
  return hand.some((card) => canPlayCard(card, topCard, currentColor));
}

// Check if it's a valid time to call UNO (player has exactly 2 cards before playing)
export function canCallUno(hand: Card[]): boolean {
  return hand.length === 2;
}

// Check if a player should have called UNO (has 1 card and didn't call)
export function shouldHaveCalledUno(
  hand: Card[],
  calledUno: string[],
  playerId: string
): boolean {
  return hand.length === 1 && !calledUno.includes(playerId);
}

// Validate if it's a player's turn
export function isPlayerTurn(
  gameState: GameState,
  playerId: string
): boolean {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  return currentPlayer.id === playerId;
}

// Find a card in a player's hand
export function findCardInHand(hand: Card[], cardId: string): Card | null {
  return hand.find((card) => card.id === cardId) || null;
}
