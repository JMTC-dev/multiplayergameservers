import type {
  Card,
  CardColor,
  CardType,
  CardValue,
  ActionCard,
  WildCard,
} from "../types";

// Generate a unique ID for each card
let cardIdCounter = 0;
function generateCardId(): string {
  return `card-${Date.now()}-${cardIdCounter++}`;
}

// Create a single card
export function createCard(
  type: CardType,
  color: CardColor | null = null
): Card {
  return {
    id: generateCardId(),
    type,
    color,
  };
}

// Create a full UNO deck
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const colors: CardColor[] = ["red", "blue", "green", "yellow"];
  const numberCards: CardValue[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const actionCards: ActionCard[] = ["skip", "reverse", "draw2"];

  // Add number cards (0: one of each color, 1-9: two of each color)
  colors.forEach((color) => {
    // One zero per color
    deck.push(createCard("0", color));

    // Two of each number 1-9 per color
    numberCards.slice(1).forEach((number) => {
      deck.push(createCard(number, color));
      deck.push(createCard(number, color));
    });

    // Two of each action card per color
    actionCards.forEach((action) => {
      deck.push(createCard(action, color));
      deck.push(createCard(action, color));
    });
  });

  // Add Wild cards (4 of each)
  const wildCards: WildCard[] = ["wild", "wild_draw4"];
  wildCards.forEach((wildCard) => {
    for (let i = 0; i < 4; i++) {
      deck.push(createCard(wildCard, null));
    }
  });

  return deck;
}

// Fisher-Yates shuffle algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards to players
export function dealCards(
  deck: Card[],
  numCards: number
): { dealtCards: Card[]; remainingDeck: Card[] } {
  const dealtCards = deck.slice(0, numCards);
  const remainingDeck = deck.slice(numCards);
  return { dealtCards, remainingDeck };
}

// Get a valid starting card (not wild, not action for simplicity)
export function getStartingCard(deck: Card[]): {
  startCard: Card;
  remainingDeck: Card[];
} {
  const validStartIndex = deck.findIndex(
    (card) =>
      card.color !== null &&
      !["wild", "wild_draw4", "skip", "reverse", "draw2"].includes(card.type)
  );

  if (validStartIndex === -1) {
    // If no valid start card found (unlikely), reshuffle
    const shuffled = shuffleDeck(deck);
    return getStartingCard(shuffled);
  }

  const startCard = deck[validStartIndex];
  const remainingDeck = deck.filter((_, index) => index !== validStartIndex);

  return { startCard, remainingDeck };
}
