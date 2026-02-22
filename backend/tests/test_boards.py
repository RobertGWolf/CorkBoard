def test_create_board(client):
    resp = client.post("/api/boards", json={"name": "My Board"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "My Board"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_list_boards(client):
    client.post("/api/boards", json={"name": "Board 1"})
    client.post("/api/boards", json={"name": "Board 2"})
    resp = client.get("/api/boards")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


def test_get_board_detail(client):
    board = client.post("/api/boards", json={"name": "Test Board"}).json()
    resp = client.get(f"/api/boards/{board['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Test Board"
    assert data["cards"] == []
    assert data["connections"] == []


def test_get_board_not_found(client):
    resp = client.get("/api/boards/nonexistent-id")
    assert resp.status_code == 404


def test_update_board(client):
    board = client.post("/api/boards", json={"name": "Old Name"}).json()
    resp = client.patch(f"/api/boards/{board['id']}", json={"name": "New Name"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


def test_update_board_not_found(client):
    resp = client.patch("/api/boards/nonexistent-id", json={"name": "New"})
    assert resp.status_code == 404


def test_delete_board(client):
    board = client.post("/api/boards", json={"name": "To Delete"}).json()
    resp = client.delete(f"/api/boards/{board['id']}")
    assert resp.status_code == 204
    # Verify it's gone
    resp = client.get(f"/api/boards/{board['id']}")
    assert resp.status_code == 404


def test_delete_board_not_found(client):
    resp = client.delete("/api/boards/nonexistent-id")
    assert resp.status_code == 404


def test_delete_board_cascades_cards(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    card = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Note"}
    ).json()
    # Delete the board
    resp = client.delete(f"/api/boards/{board['id']}")
    assert resp.status_code == 204
    # Card should be gone too
    resp = client.patch(f"/api/cards/{card['id']}", json={"content": "Updated"})
    assert resp.status_code == 404


def test_get_board_with_cards_and_connections(client):
    board = client.post("/api/boards", json={"name": "Full Board"}).json()
    card1 = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Card 1"}
    ).json()
    card2 = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Card 2"}
    ).json()
    client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card2["id"]},
    )
    resp = client.get(f"/api/boards/{board['id']}")
    data = resp.json()
    assert len(data["cards"]) == 2
    assert len(data["connections"]) == 1


def test_create_board_empty_name(client):
    resp = client.post("/api/boards", json={"name": ""})
    assert resp.status_code == 422
