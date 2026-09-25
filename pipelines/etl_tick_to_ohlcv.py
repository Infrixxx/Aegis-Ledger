import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    from_json,
    first,
    max as spark_max,
    min as spark_min,
    last,
    sum as spark_sum,
    count,
    window,
    to_timestamp
)
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    LongType,
    DoubleType
)

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:9092")
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "localhost")
MINIO_BUCKET_PATH = "s3a://aegis-lake/lakehouse/silver/ohlcv_1m/"

tick_schema = StructType([
    StructField("symbol", StringType(), False),
    StructField("broker_time_msc", LongType(), False),
    StructField("bid", DoubleType(), False),
    StructField("ask", DoubleType(), False),
    StructField("last", DoubleType(), True),
    StructField("volume", DoubleType(), True)
])

def create_spark_session() -> SparkSession:
    return SparkSession.builder \
        .appName("Aegis-Tick-Aggregation-Pipeline") \
        .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0,org.apache.hadoop:hadoop-aws:3.3.4,com.clickhouse:clickhouse-spark-runtime-3.4_2.12:0.7.0") \
        .config("spark.hadoop.fs.s3a.endpoint", "http://localhost:9000") \
        .config("spark.hadoop.fs.s3a.access.key", "aegis_admin") \
        .config("spark.hadoop.fs.s3a.secret.key", "aegis_secure_password") \
        .config("spark.hadoop.fs.s3a.path.style.access", "true") \
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem") \
        .getOrCreate()

def main():
    spark = create_spark_session()
    spark.sparkContext.setLogLevel("WARN")

    raw_stream = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_BROKERS) \
        .option("subscribe", "telemetry.mt5.ticks") \
        .option("startingOffsets", "latest") \
        .load()

    parsed_ticks = raw_stream.selectExpr("CAST(value AS STRING) as json_payload") \
        .select(from_json(col("json_payload"), tick_schema).alias("data")) \
        .select("data.*") \
        .withColumn("timestamp", to_timestamp(col("broker_time_msc") / 1000)) \
        .withColumn("price", col("bid")) \
        .withWatermark("timestamp", "30 seconds")

    ohlcv_1m = parsed_ticks.groupBy(
        col("symbol"),
        window(col("timestamp"), "1 minute")
    ).agg(
        first("price").alias("open"),
        spark_max("price").alias("high"),
        spark_min("price").alias("low"),
        last("price").alias("close"),
        spark_sum("volume").alias("volume"),
        count("price").alias("tick_count")
    ).select(
        col("symbol"),
        col("window.start").alias("bar_time"),
        col("open"),
        col("high"),
        col("low"),
        col("close"),
        col("volume"),
        col("tick_count")
    )

    query_lake = ohlcv_1m.writeStream \
        .format("parquet") \
        .option("path", MINIO_BUCKET_PATH) \
        .option("checkpointLocation", "/tmp/spark_checkpoints/lake/") \
        .outputMode("append") \
        .start()

    query_lake.awaitTermination()

if __name__ == "__main__":
    main()