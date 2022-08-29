from typing import Union
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

homeHTML = open('./index.html', 'r').read()

@app.get("/")
def home():
    return HTMLResponse(homeHTML)
