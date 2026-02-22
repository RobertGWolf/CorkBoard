def test_create_card(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    resp = client.post(
        f"/api/boards/{board['id']}/cards",
        json={"content": "Hello", "x": 20.0, "y": 30.0},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["content"] == "Hello"
    assert data["x"] == 20.0
    assert data["y"] == 30.0
    assert data["board_id"] == board["id"]
    assert data["color"] == "#FEF3C7"


def test_create_card_defaults(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    resp = client.post(f"/api/boards/{board['id']}/cards", json={})
    assert resp.status_code == 201
    data = resp.json()
    assert data["content"] == ""
    assert data["x"] == 10.0
    assert data["y"] == 10.0
    assert data["width"] == 15.0
    assert data["height"] == 10.0
    assert data["color"] == "#FEF3C7"
    assert data["z_index"] == 0


def test_create_card_board_not_found(client):
    resp = client.post("/api/boards/nonexistent-id/cards", json={"content": "Hi"})
    assert resp.status_code == 404


def test_update_card(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    card = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Old"}
    ).json()
    resp = client.patch(
        f"/api/cards/{card['id']}",
        json={"content": "New", "x": 50.0, "color": "#DBEAFE"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["content"] == "New"
    assert data["x"] == 50.0
    assert data["color"] == "#DBEAFE"
    # Unchanged fields stay the same
    assert data["y"] == 10.0


def test_update_card_partial(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    card = client.post(
        f"/api/boards/{board['id']}/cards",
        json={"content": "Test", "x": 25.0, "y": 35.0},
    ).json()
    # Update only x
    resp = client.patch(f"/api/cards/{card['id']}", json={"x": 75.0})
    assert resp.status_code == 200
    data = resp.json()
    assert data["x"] == 75.0
    assert data["y"] == 35.0
    assert data["content"] == "Test"


def test_update_card_not_found(client):
    resp = client.patch("/api/cards/nonexistent-id", json={"content": "Hi"})
    assert resp.status_code == 404


def test_delete_card(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    card = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Delete me"}
    ).json()
    resp = client.delete(f"/api/cards/{card['id']}")
    assert resp.status_code == 204
    # Verify it's gone
    resp = client.patch(f"/api/cards/{card['id']}", json={"content": "Still here?"})
    assert resp.status_code == 404


def test_delete_card_not_found(client):
    resp = client.delete("/api/cards/nonexistent-id")
    assert resp.status_code == 404


def test_delete_card_cascades_connections(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    card1 = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Card 1"}
    ).json()
    card2 = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Card 2"}
    ).json()
    conn = client.post(
        f"/api/boards/{board['id']}/connections",
        json={"from_card_id": card1["id"], "to_card_id": card2["id"]},
    ).json()
    # Delete card1
    client.delete(f"/api/cards/{card1['id']}")
    # Connection should be gone
    resp = client.delete(f"/api/connections/{conn['id']}")
    assert resp.status_code == 404


def test_batch_update_cards(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    card1 = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Card 1"}
    ).json()
    card2 = client.post(
        f"/api/boards/{board['id']}/cards", json={"content": "Card 2"}
    ).json()
    resp = client.patch(
        "/api/cards/batch",
        json={
            "cards": [
                {"id": card1["id"], "x": 50.0, "y": 60.0},
                {"id": card2["id"], "x": 70.0, "y": 80.0},
            ]
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["x"] == 50.0
    assert data[0]["y"] == 60.0
    assert data[1]["x"] == 70.0
    assert data[1]["y"] == 80.0


def test_batch_update_card_not_found(client):
    resp = client.patch(
        "/api/cards/batch",
        json={"cards": [{"id": "nonexistent", "x": 50.0}]},
    )
    assert resp.status_code == 404


def test_card_position_validation(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    # x out of range
    resp = client.post(
        f"/api/boards/{board['id']}/cards", json={"x": 150.0}
    )
    assert resp.status_code == 422
    # width too small
    resp = client.post(
        f"/api/boards/{board['id']}/cards", json={"width": 5.0}
    )
    assert resp.status_code == 422
    # width too large
    resp = client.post(
        f"/api/boards/{board['id']}/cards", json={"width": 60.0}
    )
    assert resp.status_code == 422


def test_card_invalid_color(client):
    board = client.post("/api/boards", json={"name": "Board"}).json()
    resp = client.post(
        f"/api/boards/{board['id']}/cards", json={"color": "red"}
    )
    assert resp.status_code == 422
