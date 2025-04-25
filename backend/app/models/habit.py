from pydantic import BaseModel
from typing import List

class Habit(BaseModel):
    title: str
    tags: List[str]
