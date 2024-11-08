CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chatbot (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    embedding VECTOR(1536)
);