import json
import logging
import os
import sys
from contextlib import asynccontextmanager
from typing import Any, Dict

from confluent_kafka import KafkaError, Producer
from fastapi import BackgroundTasks, FastAPI, status
from pydantic import BaseModel, Field

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("GuardianProducer")

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC_TICKS = "telemetry.mt5.ticks"
TOPIC_EVENTS = "telemetry.fsm.events"

producer_conf = {
    "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS,
    "enable.idempotence": True,
    "acks": "all",
    "retries": 5,
    "max.in.flight.requests.per.connection": 5,
    "compression.type": "snappy",
    "linger.ms": 10,
    "batch.num.messages": 1000,
}

producer: Producer = None

def get_producer() -> Producer:
    global producer
    if producer is None:
        producer = Producer(producer_conf)
    return producer

def delivery_report(err: KafkaError, msg: Any):
    if err is not None:
        logger.error(f"Kafka message delivery failed: {err}")
    else:
        logger.debug(f"Event delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")

class TickPayload(BaseModel):
    symbol: str
    broker_time_msc: int
    bid: float
    ask: float
    last: float = 0.0
    volume: float = 0.0

class TradeEventPayload(BaseModel):
    event_type: str = Field(..., regex="^(POSITION_OPENED|POSITION_CLOSED|CIRCUIT_BREAKER_TRIGGERED)$")
    broker_time_msc: int
    account_number: int
    ticket: int
    symbol: str
    order_type: str = "BUY"
    volume: float
    price_open: float = 0.0
    price_close: float = 0.0
    price_sl: float = 0.0
    price_tp: float = 0.0
    net_profit: float = 0.0
    balance: float
    equity: float

@asynccontextmanager
async def lifespan(app: FastAPI):
    global producer
    producer = get_producer()
    yield
    producer.flush(timeout=5)

app = FastAPI(title="Aegis Telemetry Ingestion Bridge", lifespan=lifespan)

def publish_to_broker(topic: str, key: str, payload: Dict[str, Any]):
    p = get_producer()
    try:
        p.produce(
            topic=topic,
            key=key.encode("utf-8"),
            value=json.dumps(payload).encode("utf-8"),
            on_delivery=delivery_report,
        )
        p.poll(0)
    except BufferError:
        p.poll(1.0)
        p.produce(
            topic=topic,
            key=key.encode("utf-8"),
            value=json.dumps(payload).encode("utf-8"),
            on_delivery=delivery_report,
        )

@app.post("/api/v1/telemetry/tick", status_code=status.HTTP_202_ACCEPTED)
async def ingest_tick(tick: TickPayload, bg_tasks: BackgroundTasks):
    bg_tasks.add_task(publish_to_broker, TOPIC_TICKS, tick.symbol, tick.model_dump())
    return {"status": "ENQUEUED"}

@app.post("/api/v1/telemetry/trade-event", status_code=status.HTTP_202_ACCEPTED)
async def ingest_trade_event(event: TradeEventPayload, bg_tasks: BackgroundTasks):
    routing_key = f"{event.account_number}_{event.ticket}"
    bg_tasks.add_task(publish_to_broker, TOPIC_EVENTS, routing_key, event.model_dump())
    return {"status": "ENQUEUED", "ticket": event.ticket}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("guardian_daemon:app", host="0.0.0.0", port=8000, reload=False, workers=2)