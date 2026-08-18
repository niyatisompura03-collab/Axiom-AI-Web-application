import requests
from datetime import datetime, timezone, timedelta

BASE_URL = "http://127.0.0.1:8000"

def test_profile_edge_cases():
    test_user = "test_user_profile_v1"
    test_user2 = "test_user_profile_v2"
    test_pass = "SecurePass123!"
    
    # 1. Register & Login
    requests.post(f"{BASE_URL}/auth/register", json={"username": test_user, "password": test_pass})
    login_resp = requests.post(f"{BASE_URL}/auth/login?username={test_user}&password={test_pass}")
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Check initial profile
    me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert me_resp.status_code == 200
    
    # 3. Avatar Case A: Set new avatar
    update_resp = requests.put(
        f"{BASE_URL}/auth/me", 
        json={"username": test_user, "avatar": "data:image/png;base64,avatar123"}, 
        headers=headers
    )
    assert update_resp.status_code == 200, update_resp.text
    assert update_resp.json()["user"]["avatar"] == "data:image/png;base64,avatar123"
    
    # Avatar Case B: Explicitly remove avatar (send null)
    update_resp = requests.put(
        f"{BASE_URL}/auth/me", 
        json={"username": test_user, "avatar": None}, 
        headers=headers
    )
    assert update_resp.status_code == 200, update_resp.text
    assert update_resp.json()["user"]["avatar"] is None
    
    # Verify via /auth/me
    me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert me_resp.json()["avatar"] is None
    
    # Avatar Case C: No avatar -> Save profile -> remains empty
    update_resp = requests.put(
        f"{BASE_URL}/auth/me", 
        json={"username": test_user, "avatar": None}, 
        headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["user"]["avatar"] is None
    
    # DOB Case A: Valid past DOB -> Save -> persists
    update_resp = requests.put(
        f"{BASE_URL}/auth/me", 
        json={"username": test_user, "dob": "1998-07-24"}, 
        headers=headers
    )
    assert update_resp.status_code == 200, update_resp.text
    assert update_resp.json()["user"]["dob"] == "1998-07-24"
    
    me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert me_resp.json()["dob"] == "1998-07-24"
    
    # DOB Case B: Future DOB -> rejected
    future_date = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d")
    update_resp = requests.put(
        f"{BASE_URL}/auth/me", 
        json={"username": test_user, "dob": future_date}, 
        headers=headers
    )
    assert update_resp.status_code == 400, f"Expected 400, got {update_resp.status_code}"
    
    # DOB Case C: Invalid calendar dates -> rejected
    invalid_cases = ["2023-02-29", "2023-04-31", "2023-13-01", "1850-01-01", "not-a-date", "2020-00-10"]
    for inv in invalid_cases:
        inv_resp = requests.put(
            f"{BASE_URL}/auth/me", 
            json={"username": test_user, "dob": inv}, 
            headers=headers
        )
        assert inv_resp.status_code == 400, f"Expected 400 for {inv}, got {inv_resp.status_code}"
    
    # DOB Case D: Existing DOB -> clear (send null) -> Save -> DOB removed
    update_resp = requests.put(
        f"{BASE_URL}/auth/me", 
        json={"username": test_user, "dob": None}, 
        headers=headers
    )
    assert update_resp.status_code == 200, update_resp.text
    assert update_resp.json()["user"]["dob"] is None
    
    me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert me_resp.json()["dob"] is None
    
    # DOB Case E: Empty DOB from beginning -> allowed
    requests.post(f"{BASE_URL}/auth/register", json={"username": test_user2, "password": test_pass})
    login_resp2 = requests.post(f"{BASE_URL}/auth/login?username={test_user2}&password={test_pass}")
    token2 = login_resp2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    me2 = requests.get(f"{BASE_URL}/auth/me", headers=headers2).json()
    assert me2["dob"] is None
    assert me2["avatar"] is None
    
    # Case F: Refresh / Logout / Login -> state remains correct
    login_resp3 = requests.post(f"{BASE_URL}/auth/login?username={test_user}&password={test_pass}")
    assert login_resp3.status_code == 200
    token3 = login_resp3.json()["access_token"]
    me3 = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token3}"}).json()
    assert me3["avatar"] is None
    assert me3["dob"] is None

if __name__ == "__main__":
    test_profile_edge_cases()
    print("All profile edge cases passed!")
