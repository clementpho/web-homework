from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import SQLModel, create_engine, Field, Relationship, Session, select
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel
import json

# ici on définit les modèles de données, la base de données, les endpoints et la gestion des connexions WebSocket
app = FastAPI()
sqlite_url = "sqlite:///database.db"
engine = create_engine(sqlite_url)
# Modèles de données
class UserRoomLink(SQLModel, table=True):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    room_id: Optional[int] = Field(default=None, foreign_key="room.id", primary_key=True)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    #ajouts suite à la lecture des questions (idée que j'ai donc reprise)
    email: Optional[str] = Field(default=None, unique=True)
    phone: Optional[str] = Field(default=None)

    rooms: List["Room"] = Relationship(back_populates="users", link_model=UserRoomLink)
    messages: List["Message"] = Relationship(back_populates="sender")
# suppression en cascade : si un utilisateur est supprimé, ses messages le sont aussi
class Room(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    users: List[User] = Relationship(back_populates="rooms", link_model=UserRoomLink)
    # suppression en cascade :
    messages: List["Message"] = Relationship(back_populates="room", cascade_delete=True)
class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.now)
    sender_id: int = Field(foreign_key="user.id")
    room_id: int = Field(foreign_key="room.id")
    sender: User = Relationship(back_populates="messages")
    room: Room = Relationship(back_populates="messages")

class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None

class RoomCreate(BaseModel):
    name: str
# ici on crée les tables dans la base de données au démarrage de l'application
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
@app.delete("/rooms/{room_id}")
def delete_room(room_id: int):
    with Session(engine) as session:
        room = session.get(Room, room_id)
        
        if not room:
            return {"error": "Salon introuvable"}
            
        # grâce au cascade_delete, SQLModel supprimera aussi les messages
        session.delete(room)
        session.commit()
        
        return {"message": f"Le salon '{room.name}' et tous ses messages ont été supprimés."}

@app.post("/users")
def create_user(user: UserCreate):
    with Session(engine) as session:
        db_user = User(
            name=user.name, 
            email=user.email, 
            phone=user.phone
        )
        session.add(db_user)
        try:
            session.commit()
            session.refresh(db_user)
            return db_user
        except Exception:
            return {"error": "Ce nom ou cet email est déjà utilisé."}
@app.post("/rooms")
def create_room_body(room: RoomCreate):
    with Session(engine) as session:
        db_room = Room(name=room.name)
        session.add(db_room)
        session.commit()
        session.refresh(db_room)
        return db_room

@app.post("/rooms/{name}")
def create_room_path(name: str):
    with Session(engine) as session:
        db_room = Room(name=name)
        session.add(db_room)
        session.commit()
        session.refresh(db_room)
        return db_room

@app.get("/users")
def get_users():
    with Session(engine) as session:
        return session.exec(select(User)).all()

@app.get("/rooms")
def get_rooms():
    with Session(engine) as session:
        return session.exec(select(Room)).all()

@app.get("/rooms/{room_id}/messages")
def get_room_messages(room_id: int):
    with Session(engine) as session:
        statement = select(Message).where(Message.room_id == room_id)
        return session.exec(statement).all()

# Gestion des connexions WebSocket et diffusion des messages
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: int):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: int):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: int):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

manager = ConnectionManager()
# WebSocket endpoint pour gérer les connexions des clients et la diffusion des messages
@app.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: int, user_id: int):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            with Session(engine) as session:
                db_msg = Message(content=data, sender_id=user_id, room_id=room_id)
                session.add(db_msg)
                session.commit()
                
                user = session.get(User, user_id)
                sender_name = user.name if user else "Inconnu"

            message_data = {
                "sender_id": user_id,
                "sender_name": sender_name,
                "content": data
            }
            
            await manager.broadcast(json.dumps(message_data), room_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)


app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
app.mount("/js", StaticFiles(directory="frontend/js"), name="js")
# Endpoint pour servir la page d'accueil
@app.get("/")
async def read_index():
    return FileResponse("frontend/index.html")