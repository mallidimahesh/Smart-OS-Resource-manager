import pytest
import json
from app import create_app
from app.database import db

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_auth_workflow(client):
    # 1. Register
    reg_res = client.post("/api/auth/register", json={
        "username": "os_student",
        "email": "student@university.edu",
        "password": "password123"
    })
    assert reg_res.status_code == 201
    token = reg_res.get_json()["token"]

    # 2. Login
    login_res = client.post("/api/auth/login", json={
        "username": "os_student",
        "password": "password123"
    })
    assert login_res.status_code == 200

    # 3. Get profile
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.get_json()["user"]["username"] == "os_student"

def test_experiment_saving_and_isolation(client):
    # User 1 registers
    r1 = client.post("/api/auth/register", json={
        "username": "user1",
        "email": "u1@test.com",
        "password": "password123"
    })
    t1 = r1.get_json()["token"]

    # User 2 registers
    r2 = client.post("/api/auth/register", json={
        "username": "user2",
        "email": "u2@test.com",
        "password": "password123"
    })
    t2 = r2.get_json()["token"]

    # User 1 creates experiment
    exp_res = client.post("/api/experiments", headers={"Authorization": f"Bearer {t1}"}, json={
        "title": "FCFS Test 1",
        "module": "cpu_scheduling",
        "algorithm": "FCFS",
        "input_data": {"processes": []},
        "result_data": {"avg_waiting_time": 2.5},
        "metrics": {"avg_waiting_time": 2.5}
    })
    assert exp_res.status_code == 201
    exp_id = exp_res.get_json()["experiment"]["id"]

    # User 1 can view it
    get_res = client.get(f"/api/experiments/{exp_id}", headers={"Authorization": f"Bearer {t1}"})
    assert get_res.status_code == 200

    # User 2 cannot access private experiment of User 1
    unauth_res = client.get(f"/api/experiments/{exp_id}", headers={"Authorization": f"Bearer {t2}"})
    assert unauth_res.status_code == 403

def test_tutor_and_export_endpoints(client):
    # Topics
    topics_res = client.get("/api/tutor/topics")
    assert topics_res.status_code == 200

    # Quiz
    quiz_res = client.get("/api/tutor/quiz")
    assert quiz_res.status_code == 200
    assert len(quiz_res.get_json()["questions"]) > 0

    # CSV Export
    csv_res = client.post("/api/exports/csv", json={
        "module": "cpu_scheduling",
        "result": {
            "algorithm": "FCFS",
            "total_time": 10,
            "processes": [],
            "gantt_chart": []
        }
    })
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.content_type
