import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, Session, create_engine
from supabase import create_client, Client


load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

# Supabase Storage & Auth Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

#TODO: remove create_all during production
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session