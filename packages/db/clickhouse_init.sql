CREATE DATABASE IF NOT EXISTS aegis_analytics;

CREATE TABLE IF NOT EXISTS aegis_analytics.raw_ticks
(
    symbol LowCardinality(String),
    broker_time_msc Int64,
    bid Float64,
    ask Float64,
    last Float64,
    volume Float64,
    ingested_at DateTime64(3, 'UTC') DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(toDateTime(broker_time_msc / 1000))
ORDER BY (symbol, broker_time_msc)
TTL toDateTime(broker_time_msc / 1000) + INTERVAL 90 DAY;

CREATE TABLE IF NOT EXISTS aegis_analytics.fsm_trade_events
(
    account_number UInt64,
    ticket UInt64,
    event_type LowCardinality(String),
    symbol LowCardinality(String),
    order_type LowCardinality(String),
    volume Float64,
    price_open Float64,
    price_close Float64,
    price_sl Float64,
    price_tp Float64,
    net_profit Float64,
    balance Float64,
    equity Float64,
    event_time DateTime64(3, 'UTC'),
    created_at DateTime64(3, 'UTC') DEFAULT now()
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(event_time)
ORDER BY (account_number, ticket, event_type);

CREATE TABLE IF NOT EXISTS aegis_analytics.ohlcv_1m
(
    symbol LowCardinality(String),
    bar_time DateTime64(0, 'UTC'),
    open Float64,
    high Float64,
    low Float64,
    close Float64,
    volume Float64,
    tick_count UInt32
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(bar_time)
ORDER BY (symbol, bar_time);