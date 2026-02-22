import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Board(Base):
    __tablename__ = "boards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)

    cards: Mapped[list["Card"]] = relationship(
        back_populates="board", cascade="all, delete-orphan"
    )
    connections: Mapped[list["Connection"]] = relationship(
        back_populates="board", cascade="all, delete-orphan"
    )


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    board_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, default="")
    x: Mapped[float] = mapped_column(Float, default=10.0)
    y: Mapped[float] = mapped_column(Float, default=10.0)
    width: Mapped[float] = mapped_column(Float, default=15.0)
    height: Mapped[float] = mapped_column(Float, default=10.0)
    color: Mapped[str] = mapped_column(String(7), default="#FEF3C7")
    z_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)

    board: Mapped["Board"] = relationship(back_populates="cards")
    connections_from: Mapped[list["Connection"]] = relationship(
        foreign_keys="Connection.from_card_id",
        back_populates="from_card",
        cascade="all, delete-orphan",
    )
    connections_to: Mapped[list["Connection"]] = relationship(
        foreign_keys="Connection.to_card_id",
        back_populates="to_card",
        cascade="all, delete-orphan",
    )


class Connection(Base):
    __tablename__ = "connections"
    __table_args__ = (
        UniqueConstraint("from_card_id", "to_card_id", name="uq_connection_pair"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    board_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False
    )
    from_card_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False
    )
    to_card_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False
    )
    color: Mapped[str] = mapped_column(String(7), default="#92400E")

    board: Mapped["Board"] = relationship(back_populates="connections")
    from_card: Mapped["Card"] = relationship(
        foreign_keys=[from_card_id], back_populates="connections_from"
    )
    to_card: Mapped["Card"] = relationship(
        foreign_keys=[to_card_id], back_populates="connections_to"
    )
