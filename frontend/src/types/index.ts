export interface Board {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  board_id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  z_index: number;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  board_id: string;
  from_card_id: string;
  to_card_id: string;
  color: string;
}

export interface BoardDetail extends Board {
  cards: Card[];
  connections: Connection[];
}

export interface Position {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
