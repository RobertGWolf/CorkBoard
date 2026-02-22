from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Board
from app.schemas import BoardCreate, BoardDetail, BoardRead, BoardUpdate

router = APIRouter(prefix="/api/boards", tags=["boards"])


@router.get("", response_model=list[BoardRead])
def list_boards(db: Session = Depends(get_db)):
    return db.query(Board).order_by(Board.updated_at.desc()).all()


@router.post("", response_model=BoardRead, status_code=201)
def create_board(data: BoardCreate, db: Session = Depends(get_db)):
    board = Board(name=data.name)
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.get("/{board_id}", response_model=BoardDetail)
def get_board(board_id: str, db: Session = Depends(get_db)):
    board = (
        db.query(Board)
        .options(joinedload(Board.cards), joinedload(Board.connections))
        .filter(Board.id == board_id)
        .first()
    )
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.patch("/{board_id}", response_model=BoardRead)
def update_board(board_id: str, data: BoardUpdate, db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    board.name = data.name
    db.commit()
    db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=204)
def delete_board(board_id: str, db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    db.delete(board)
    db.commit()
