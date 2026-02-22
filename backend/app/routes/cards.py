from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Board, Card
from app.schemas import CardBatchUpdate, CardCreate, CardRead, CardUpdate

router = APIRouter(tags=["cards"])


@router.post("/api/boards/{board_id}/cards", response_model=CardRead, status_code=201)
def create_card(board_id: str, data: CardCreate, db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    card = Card(
        board_id=board_id,
        content=data.content,
        x=data.x,
        y=data.y,
        width=data.width,
        height=data.height,
        color=data.color,
        z_index=data.z_index,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


# Batch must come before {card_id} routes to avoid "batch" matching as a card_id
@router.patch("/api/cards/batch", response_model=list[CardRead])
def batch_update_cards(data: CardBatchUpdate, db: Session = Depends(get_db)):
    updated_cards = []
    for item in data.cards:
        card = db.query(Card).filter(Card.id == item.id).first()
        if not card:
            raise HTTPException(
                status_code=404, detail=f"Card {item.id} not found"
            )
        update_data = item.model_dump(exclude_unset=True, exclude={"id"})
        for key, value in update_data.items():
            setattr(card, key, value)
        updated_cards.append(card)
    db.commit()
    for card in updated_cards:
        db.refresh(card)
    return updated_cards


@router.patch("/api/cards/{card_id}", response_model=CardRead)
def update_card(card_id: str, data: CardUpdate, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(card, key, value)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/api/cards/{card_id}", status_code=204)
def delete_card(card_id: str, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
