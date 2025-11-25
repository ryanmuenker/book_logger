def test_register_login_logout_flow(client):
    register_resp = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "super-secret"},
    )
    assert register_resp.status_code == 200
    assert register_resp.get_json()["ok"] is True

    me_resp = client.get("/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.get_json()["user"]["email"] == "user@example.com"

    logout_resp = client.post("/auth/logout")
    assert logout_resp.status_code == 200
    assert logout_resp.get_json()["ok"] is True

    after_logout = client.get("/auth/me")
    assert after_logout.status_code == 200
    assert after_logout.get_json()["user"] is None

    bad_login = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "wrong"},
    )
    assert bad_login.status_code == 401

    good_login = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "super-secret"},
    )
    assert good_login.status_code == 200
    assert good_login.get_json()["user"]["email"] == "user@example.com"


def test_html_auth_routes_render_and_post(client):
    get_register = client.get("/register")
    assert get_register.status_code == 200
    get_login = client.get("/login")
    assert get_login.status_code == 200

    form_register = client.post(
        "/register",
        data={"email": "form@example.com", "password": "pass123"},
        follow_redirects=True,
    )
    assert form_register.status_code == 200

    form_login = client.post(
        "/login",
        data={"email": "form@example.com", "password": "pass123"},
        follow_redirects=True,
    )
    assert form_login.status_code == 200


