from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Updated Credentials Database
users_db = {
    "EMP-01": {"password": "9132", "role": "employee", "status": "active"},
    "ADMIN": {"password": "admin123", "role": "admin", "status": "active"}
}

system_status = {"lockdown_active": False}
incidents = []

# Mock data for the SOC Graph
graph_data = [
    {"time": "08:00", "threats": 2, "normal_traffic": 120},
    {"time": "09:00", "threats": 5, "normal_traffic": 150},
    {"time": "10:00", "threats": 3, "normal_traffic": 180},
    {"time": "11:00", "threats": 4, "normal_traffic": 210},
    {"time": "12:00", "threats": 1, "normal_traffic": 190},
]

class LoginRequest(BaseModel):
    username: str
    password: str

class ActionRequest(BaseModel):
    employee_id: str
    action: str

class AdminAction(BaseModel):
    target_user: str
    action: str

@app.post("/api/login")
async def login(req: LoginRequest):
    user = users_db.get(req.username)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Let suspended users "log in" so they see the red suspension screen
    return {"username": req.username, "role": user["role"], "status": user["status"]}

@app.post("/api/monitor")
async def monitor_endpoint(req: ActionRequest):
    # Trigger the suspension logic
    users_db[req.employee_id]["status"] = "suspended"
    system_status["lockdown_active"] = True
    
    # Spike the graph data for visual effect on the Admin Dashboard
    current_time = datetime.now().strftime("%H:%M")
    graph_data.append({"time": current_time, "threats": random.randint(40, 60), "normal_traffic": 200})
    
    alert = {
        "time": datetime.now().strftime("%H:%M:%S"),
        "severity": "CRITICAL",
        "message": f"Data Exfiltration Attempt detected. {req.employee_id} suspended automatically."
    }
    incidents.append(alert)
    return {"status": "BLOCKED"}

@app.post("/api/admin/resolve")
async def resolve_incident(req: AdminAction):
    if req.target_user in users_db:
        if req.action == "unblock":
            users_db[req.target_user]["status"] = "active"
            system_status["lockdown_active"] = False
            incidents.append({"time": datetime.now().strftime("%H:%M:%S"), "severity": "RESOLVED", "message": f"Admin restored access for {req.target_user}."})
    return {"status": "SUCCESS"}

@app.get("/api/admin/data")
async def get_admin_data():
    return {
        "users": users_db,
        "logs": incidents,
        "graph": graph_data[-8:] # Keep the last 8 data points for the graph
    }

@app.get("/api/user/status/{username}")
async def get_user_status(username: str):
    user = users_db.get(username)
    return {"status": user["status"] if user else "unknown"}

@app.get("/api/agent/status")
async def check_agent_status():
    return system_status