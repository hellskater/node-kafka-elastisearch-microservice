const { Kafka } = require("kafkajs");
const { Client } = require("@elastic/elasticsearch");
const dotenv = require("dotenv");

// Load environment variables from the .env file
dotenv.config();

// Create a new instance of the Kafka client
const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["kafka:9092"],
});

// Create a new Elasticsearch client
const client = new Client({
  node: "https://localhost:9200",
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD,
  },
  tls: {
    // If using a self-signed certificate
    rejectUnauthorized: false,
  },
});

const run = async () => {
  // Create a new consumer
  const consumer = kafka.consumer({ groupId: "indexing-group" });
  await consumer.connect();

  // Subscribe to the "btc-price-category" topic
  await consumer.subscribe({
    topic: "btc-price-category",
    fromBeginning: true,
  });

  // Run the consumer
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = JSON.parse(message.value.toString());

      // Store the data in Elasticsearch
      const { body } = await client.index({
        index: "btc-price-category", // name of the index
        body: value,
      });

      console.log(`Indexed data: ${JSON.stringify(value)}`);
    },
  });
};

run().catch(console.error);
