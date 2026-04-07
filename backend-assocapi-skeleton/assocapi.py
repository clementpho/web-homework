from pathlib import Path

import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# -----------------
# CORS setup (it's black magic - keep as-is)
# -----------------
origins = [
    "*"  # allow all origins for simplicity (not recommended for production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],  # allow all HTTP methods
    allow_headers=["*"],  # allow all headers
)

# -----------------
# CSV data
# -----------------
# spot the data folder
data = Path(__file__).parent.absolute() / 'data'

# load the CSV data into pandas dataframes
associations_df = pd.read_csv(data / 'associations_etudiantes.csv')
evenements_df = pd.read_csv(data / 'evenements_associations.csv')

# -----------------
## your code (route handlers) goes here
# -----------------
@app.get("/api/alive")
def alive():
    return {"message" : "Alive"}

@app.get("/api/associations")
def get_associations():
    return associations_df["id"].tolist()

@app.get("/api/association/{id}")
def get_association_id(id : int):
    row = associations_df[associations_df["id"] == id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Association not found")
    return row.iloc[0].to_dict()
    
@app.get("/api/evenements")
def get_evenements():
    return evenements_df["id"].tolist()

@app.get("/api/evenement/{id}")
def get_evenement_id(id : int):
    row = evenements_df[evenements_df["id"] == id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Evenement not found")
    return row.iloc[0].to_dict()
    

@app.get("/api/association/{id}/evenements")
def get_evenement_associations(id : int):
    df = evenements_df[evenements_df["association_id"] == id]
    return df["nom"].to_list()


@app.get("/api/associations/type/{type}")
def association_by_type(type : str):
    return associations_df[associations_df["type"] == type]["nom"].tolist()

