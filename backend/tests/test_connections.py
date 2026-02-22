def _setup_board_with_cards(client):
    """Helper: create a board with two cards and return (board, card1, card2)."""
    board = client.post("/api/boards", json={"name": "Board"}).json()
    card1 = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Card 1"}
    ).json()
    card2 = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Card 2"}
    ).json()
    return board, card1, card2


def test_create_connection(client):
    board, card1, card2 = _setup_board_with_cards(client)
    resp = client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card2["id"]},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["from_card_id"] == card1["id"]
    assert data["to_card_id"] == card2["id"]
    assert data["board_id"] == board["id"]
    assert data["color"] == "#92400E"


def test_create_connection_custom_color(client):
    board, card1, card2 = _setup_board_with_cards(client)
    resp = client.post(
        f"/api/boards/{board['id']}/connections",
        json={
            "from_card_id": card1["id"],
            "to_card_id": card2["id"],
            "color": "#FF0000",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["color"] == "#FF0000"


def test_create_connection_self_reference(client):
    board, card1, _ = _setup_board_with_cards(client)
    resp = client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card1["id"]},
    )
    assert resp.status_code == 400
    assert "itself" in resp.json()["detail"].lower()


def test_create_connection_duplicate(client):
    board, card1, card2 = _setup_board_with_cards(client)
    client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card2["id"]},
    )
    # Same direction duplicate
    resp = client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card2["id"]},
    )
    assert resp.status_code == 409


def test_create_connection_reverse_duplicate(client):
    board, card1, card2 = _setup_board_with_cards(client)
    client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card2["id"]},
    )
    # Reverse direction duplicate
    resp = client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card2["id"], "to_card_id": card1["id"]},
    )
    assert resp.status_code == 409


def test_create_connection_board_not_found(client):
    resp = client.post(
        "/api/boards/nonexistent/connections",
        json={"from_card_id": "a", "to_card_id": "b"},
    )
    assert resp.status_code == 404


def test_create_connection_card_not_found(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    card1 = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Card"}
    ).json()
    resp = client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": "nonexistent"},
    )
    assert resp.status_code == 404


def test_create_connection_card_on_different_board(client):
    board1 = client.post("/api/boards", json={"name": "Board 1"}).json()
    board2 = client.post("/api/boards", json={"name": "Board 2"}).json()
    card1 = client.post(
        f"/api/boards/{board1['id']}/cards", json={"content": "Card 1"}
    ).json()
    card2 = client.post(
        f"/api/boards/{board2['id']}/cards", json={"content": "Card 2"}
    ).json()
    # Try to connect cards from different boards
    resp = client.post(
        f"/api/boards/{board1['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card2["id"]},
    )
    assert resp.status_code == 404


def test_update_connection_color(client):
    board, card1, card2 = _setup_board_with_cards(client)
    conn = client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card2["id"]},
    ).json()
    resp = client.patch(
        f"/api/connections/{conn['id']}", json={"color": "#0000FF"}
    )
    assert resp.status_code == 200
    assert resp.json()["color"] == "#0000FF"


def test_update_connection_not_found(client):
    resp = client.patch(
        "/api/connections/nonexistent", json={"color": "#0000FF"}
    )
    assert resp.status_code == 404


def test_delete_connection(client):
    board, card1, card2 = _setup_board_with_cards(client)
    conn = client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card2["id"]},
    ).json()
    resp = client.delete(f"/api/connections/{conn['id']}")
    assert resp.status_code == 204
    # Verify it's gone
    resp = client.delete(f"/api/connections/{conn['id']}")
    assert resp.status_code == 404


def test_delete_connection_not_found(client):
    resp = client.delete("/api/connections/nonexistent")
    assert resp.status_code == 404


def test_connection_invalid_color(client):
    board, card1, card2 = _setup_board_with_cards(client)
    resp = client.post(
        f"/api/boards/{board['id']}/connections",
        json={
            "from_card_id": card1["id"],
            "to_card_id": card2["id"],
            "color": "not-a-color",
        },
    )
    assert resp.status_code == 422
