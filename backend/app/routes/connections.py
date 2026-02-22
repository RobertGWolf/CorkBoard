from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Board, Card, Connection
from app.schemas import ConnectionCreate, ConnectionRead, ConnectionUpdate

router = APIRouter(tags=["connections"])


@router.post(
    "/api/boards/{board_id}/connections",
    response_model=ConnectionRead,
    status_code=201,
)
def create_connection(
    board_id: str, data: ConnectionCreate, db: Session = Depends(get_db)
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    # Validate: cannot connect a card to itself
    if data.from_card_id == data.to_card_id:
        raise HTTPException(status_code=400, detail="Cannot connect a card to itself")

    # Validate: both cards exist and belong to this board
    from_card = (
        db.query(Card)
        .filter(Card.id == data.from_card_id, Card.board_id == board_id)
        .first()
    )
    if not from_card:
        raise HTTPException(status_code=404, detail="Source card not found on this board")

    to_card = (
        db.query(Card)
        .filter(Card.id == data.to_card_id, Card.board_id == board_id)
        .first()
    )
    if not to_card:
        raise HTTPException(status_code=404, detail="Target card not found on this board")

    # Validate: no duplicate connection (check both directions)
    existing = (
        db.query(Connection)
        .filter(
            (
                (Connection.from_card_id == data.from_card_id)
                & (Connection.to_card_id == data.to_card_id)
            )
            | (
                (Connection.from_card_id == data.to_card_id)
                & (Connection.to_card_id == data.from_card_id)
            )
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="Connection between these cards already exists"
        )

    connection = Connection(
        board_id=board_id,
        from_card_id=data.from_card_id,
        to_card_id=data.to_card_id,
        color=data.color,
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return connection


@router.patch("/api/connections/{connection_id}", response_model=ConnectionRead)
def update_connection(
    connection_id: str, data: ConnectionUpdate, db: Session = Depends(get_db)
):
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    connection.color = data.color
    db.commit()
    db.refresh(connection)
    return connection


@router.delete("/api/connections/{connection_id}", status_code=204)
def delete_connection(connection_id: str, db: Session = Depends(get_db)):
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    db.delete(connection)
    db.commit()
