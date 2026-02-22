from datetime import datetime

from pydantic import BaseModel, Field


# --- Board schemas ---


class BoardCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class BoardUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class CardRead(BaseModel):
    id: str
    board_id: str
    content: str
    x: float
    y: float
    width: float
    height: float
    color: str
    z_index: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConnectionRead(BaseModel):
    id: str
    board_id: str
    from_card_id: str
    to_card_id: str
    color: str

    model_config = {"from_attributes": True}


class BoardRead(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BoardDetail(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    cards: list[CardRead]
    connections: list[ConnectionRead]

    model_config = {"from_attributes": True}


# --- Card schemas ---


class CardCreate(BaseModel):
    content: str = ""
    x: float = Field(default=10.0, ge=0, le=100)
    y: float = Field(default=10.0, ge=0, le=100)
    width: float = Field(default=15.0, ge=10, le=50)
    height: float = Field(default=10.0, ge=5, le=50)
    color: str = Field(default="#FEF3C7", pattern=r"^#[0-9a-fA-F]{6}$")
    z_index: int = 0


class CardUpdate(BaseModel):
    content: str | None = None
    x: float | None = Field(default=None, ge=0, le=100)
    y: float | None = Field(default=None, ge=0, le=100)
    width: float | None = Field(default=None, ge=10, le=50)
    height: float | None = Field(default=None, ge=5, le=50)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    z_index: int | None = None


class CardBatchItem(BaseModel):
    id: str
    x: float | None = Field(default=None, ge=0, le=100)
    y: float | None = Field(default=None, ge=0, le=100)
    z_index: int | None = None


class CardBatchUpdate(BaseModel):
    cards: list[CardBatchItem]


# --- Connection schemas ---


class ConnectionCreate(BaseModel):
    from_card_id: str
    to_card_id: str
    color: str = Field(default="#92400E", pattern=r"^#[0-9a-fA-F]{6}$")


class ConnectionUpdate(BaseModel):
    color: str = Field(..., pattern=r"^#[0-9a-fA-F]{6}$")
