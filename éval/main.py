from sqlmodel import Field, Relationship, SQLModel
from fastapi import FastAPI, StaticFiles, Depends
from fastapi.responses import FileResponse
from sqlmodel import SQLModel, create_engine, Field, Relationship, Session, select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
# ici, on définit les modèles de données et les routes de l'API
app = FastAPI()
sqlite_url = "sqlite:///database.db"
engine = create_engine(sqlite_url)
# Modèle de données pour les utilisateurs, les chats et les messages    
class UserChatLink(SQLModel, table=True):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    chat_id: Optional[int] = Field(default=None, foreign_key="chat.id", primary_key=True)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    chats: List["Chat"] = Relationship(back_populates="users", link_model=UserChatLink)
    messages: List["Message"] = Relationship(back_populates="sender")

class Chat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(default=None)
    # si is_group est False, c'est une conversation privée entre 2 utilisateurs, sinon c'est un groupe de discussion
    is_group: bool = Field(default=False)
    users: List[User] = Relationship(back_populates="chats", link_model=UserChatLink)
    messages: List["Message"] = Relationship(back_populates="chat")

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.now)
    sender_id: int = Field(foreign_key="user.id")
    chat_id: int = Field(foreign_key="chat.id")
    sender: User = Relationship(back_populates="messages")
    chat: Chat = Relationship(back_populates="messages")

class MessageCreate(BaseModel):
    content: str
    sender_id: int
    chat_id: int
# ici, on initialise la base de données et on ajoute des données de test au démarrage de l'application
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        if not session.exec(select(User)).first():
            moi = User(username="Moi")
            alice = User(username="Alice")
            bob = User(username="Bob")
            groupe = Chat(name="Général (Groupe)", is_group=True)
            groupe.users = [moi, alice, bob]
            session.add_all([moi, alice, bob, groupe])
            session.commit()
# ici, on définit les routes de l'API pour récupérer les utilisateurs, envoyer des messages et récupérer les messages d'un chat
@app.get("/api/users")
def get_users():
    with Session(engine) as session:
        return session.exec(select(User)).all()

@app.post("/api/messages")
def send_message(msg: MessageCreate):
    with Session(engine) as session:
        db_msg = Message(content=msg.content, sender_id=msg.sender_id, chat_id=msg.chat_id)
        session.add(db_msg)
        session.commit()
        session.refresh(db_msg)
        return db_msg

@app.get("/api/chats/{chat_id}/messages")
def get_chat_messages(chat_id: int):
    with Session(engine) as session:
        return session.exec(select(Message).where(Message.chat_id == chat_id)).all()
# ici, on sert les fichiers statiques pour le frontend
app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
app.mount("/js", StaticFiles(directory="frontend/js"), name="js")
# ici, on sert la page d'accueil du frontend
@app.get("/")
async def read_index():
    return FileResponse("frontend/index.html")