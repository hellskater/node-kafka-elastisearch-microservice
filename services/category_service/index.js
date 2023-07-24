const { Kafka } = require("kafkajs");

// Create a new instance of the Kafka client
const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["kafka:9092"],
});

// Function to categorize prices
const categorizePrice = (price) => {
  if (price < 10000) {
    return "low";
  } else if (price < 20000) {
    return "medium";
  } else {
    return "high";
  }
};

const run = async () => {
  // Create a new producer
  const producer = kafka.producer();
  await producer.connect();

  // Create a new consumer
  const consumer = kafka.consumer({ groupId: "categorization-group" });
  await consumer.connect();

  // Subscribe to the "coinmarketcap-btc-to-usd" topic
  await consumer.subscribe({
    topic: "coinmarketcap-btc-to-usd",
    fromBeginning: true,
  });

  // Run the consumer
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = JSON.parse(message.value.toString());

      // Get the price and categorize it
      const price = value.data[0].quote.USD.price;
      const category = categorizePrice(price);

      console.log(`Price: ${price}, Category: ${category}`);

      // Produce a message to the "btc-price-category" topic
      await producer.send({
        topic: "btc-price-category",
        messages: [{ value: JSON.stringify({ price, category }) }],
      });

      console.log("Message sent successfully");
    },
  });
};

run().catch(console.error);
