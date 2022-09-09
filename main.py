from curses import echo
from operator import or_
from os import getenv
from time import time
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from pypinyin import pinyin, lazy_pinyin, Style
from sqlalchemy import create_engine, Column, String, Integer, or_, func, literal_column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

BUILD_TIME = getenv("BUILD_TIME")
SQLALCHEMY_DATABASE_URL = getenv("SQLALCHEMY_DATABASE_URL") or "sqlite:///./sql_app.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, echo=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String)
    name = Column(String)
    name_pinyin = Column(String)
    word_count = Column(Integer)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

homeHTML = open("./index.html", "r").read()

if BUILD_TIME != None:
    homeHTML = homeHTML.replace("/static/main.js", f'/static/main.js?{BUILD_TIME}')

def flatten(l):
    return [item for sublist in l for item in sublist]
    
def quote(content):
    return f'"{content}"'

@app.get("/")
def home():
    renderHTML = homeHTML
    if BUILD_TIME == None:
        renderHTML = renderHTML.replace("/static/main.js", f'/static/main.js?{time()}')
    return HTMLResponse(renderHTML)

class SearchReq(BaseModel):
    text: str

class SearchResp(BaseModel):
    group_name: str
    name: str
    name_pinyin: str
    hits: int
    score: float

@app.post("/search", response_model=list[SearchResp])
def search(input: SearchReq, db: Session = Depends(get_db)):
    size = len(input.text)
    keywords = list(map(quote, flatten(pinyin(input.text, style=Style.NORMAL))))
    pinyin_conditions = list(map(
        lambda quote_str: Member.name_pinyin.like(f"%{quote_str}%"),
        keywords
    ))
    hits = "(" + "+".join(
        map(
            lambda quote_str: f"(members.name_pinyin LIKE '%{quote_str}%')",
            keywords
        )
    ) + ")"
    score = f"({hits} / CAST(word_count AS FLOAT)) AS score"

    result = db.query(Member, literal_column(hits), literal_column(score)).filter(or_(*pinyin_conditions)).group_by(Member.name).order_by(literal_column("score").desc()).all()

    resp = list()
    for record in result:
        resp.append(
            SearchResp(
                group_name=record[0].group_name,
                name=record[0].name,
                name_pinyin=record[0].name_pinyin,
                hits=record[1],
                score="{:.2f}".format(record[2]),
            )
        )
    return resp

class Group(BaseModel):
    name: str
    members: list[str]

@app.post("/source")
def source(input: list[Group], db: Session = Depends(get_db)):
    if db.query(Member).count() > 0:
        return JSONResponse(status_code=400, content={"messsage": "skip preparing source since the table exists"})

    count = 0
    
    for group in input:
        for member in group.members:
            clean_name = member.translate({ord(c): "" for c in "!@#$%^&*()[]{};:,./<>?\|`~-=_+"})
            name_pinyin = "".join(map(quote, flatten(pinyin(clean_name, style=Style.NORMAL))))
            new_member = Member(group_name=group.name, name=clean_name, name_pinyin=name_pinyin, word_count=len(clean_name))
            db.add(new_member)
            db.commit()
            db.refresh(new_member)
            count += 1

    return JSONResponse(content={"created": count})
