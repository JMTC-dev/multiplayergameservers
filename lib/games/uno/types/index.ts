// Card Types
export type CardColor = "red" | "blue" | "green" | "yellow";
export type CardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9";
export type ActionCard = "skip" | "reverse" | "draw2";
export type WildCard = "wild" | "wild_draw4";

export type CardType = CardValue | ActionCard | WildCard;

export interface Card {
  id: string; // Unique identifier for each card
  type: CardType;
  color: CardColor | null; // null for wild cards (before color selection)
}

// Player Types
export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isConnected: boolean;
}

// Game State Types
export type GamePhase =
  | "waiting" // Waiting for players to join
  | "playing" // Game in progress
  | "finished"; // Game over

export type Direction = "clockwise" | "counterclockwise";

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  direction: Direction;
  drawPile: Card[];
  discardPile: Card[];
  currentColor: CardColor; // Current active color (important for wild cards)
  pendingDrawCount: number; // For stacking Draw 2 and Wild Draw 4 cards
  lastAction: GameAction | null;
  winner: string | null; // Player ID of winner
  calledUno: string[]; // Player IDs who called UNO
}

// Action Types - what players can do
export type GameActionType =
  | "play_card"
  | "draw_card"
  | "call_uno"
  | "challenge_uno" // Challenge if someone didn't call UNO
  | "choose_color"; // After playing a wild card

export interface PlayCardAction {
  type: "play_card";
  playerId: string;
  card: Card;
  chosenColor?: CardColor; // Required for wild cards
}

export interface DrawCardAction {
  type: "draw_card";
  playerId: string;
}

export interface CallUnoAction {
  type: "call_uno";
  playerId: string;
}

export interface ChallengeUnoAction {
  type: "challenge_uno";
  challengerId: string;
  targetPlayerId: string;
}

export interface ChooseColorAction {
  type: "choose_color";
  playerId: string;
  color: CardColor;
}

export type GameAction =
  | PlayCardAction
  | DrawCardAction
  | CallUnoAction
  | ChallengeUnoAction
  | ChooseColorAction;

// Message Types - for communication between client and server
export type ClientMessageType =
  | "join_game"
  | "start_game"
  | "game_action"
  | "leave_game";

export interface JoinGameMessage {
  type: "join_game";
  playerName: string;
}

export interface StartGameMessage {
  type: "start_game";
}

export interface GameActionMessage {
  type: "game_action";
  action: GameAction;
}

export interface LeaveGameMessage {
  type: "leave_game";
}

export type ClientMessage =
  | JoinGameMessage
  | StartGameMessage
  | GameActionMessage
  | LeaveGameMessage;

// Server Messages
export type ServerMessageType =
  | "game_state"
  | "error"
  | "player_joined"
  | "player_left"
  | "game_started"
  | "game_over"
  | "invalid_move";

export interface GameStateMessage {
  type: "game_state";
  state: GameState;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export interface PlayerJoinedMessage {
  type: "player_joined";
  player: Player;
}

export interface PlayerLeftMessage {
  type: "player_left";
  playerId: string;
}

export interface GameStartedMessage {
  type: "game_started";
  state: GameState;
}

export interface GameOverMessage {
  type: "game_over";
  winnerId: string;
  winnerName: string;
}

export interface InvalidMoveMessage {
  type: "invalid_move";
  reason: string;
}

export type ServerMessage =
  | GameStateMessage
  | ErrorMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | GameStartedMessage
  | GameOverMessage
  | InvalidMoveMessage;

// Game Configuration
export interface GameConfig {
  minPlayers: number;
  maxPlayers: number;
  initialHandSize: number;
  drawPenalty: number; // Cards to draw when you can't play
  unoPenalty: number; // Cards to draw if you forget to call UNO
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  minPlayers: 2,
  maxPlayers: 4,
  initialHandSize: 7,
  drawPenalty: 1,
  unoPenalty: 2,
};
