from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone

class Payload(SQLModel,table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    species_name: str
    scientific_name: str
    category: str
    rarity: str
    toxicity_warning: str
    fun_fact: str
    xp_reward: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScanRequestMeta(SQLModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
