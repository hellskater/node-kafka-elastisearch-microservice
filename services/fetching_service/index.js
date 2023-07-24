const { Kafka } = require("kafkajs");
const axios = require("axios");
const dotenv = require("dotenv");

// Load environment variables from the .env file
dotenv.config();

// Create a new instance of the Kafka client
const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["kafka:9092"],
});

const API_KEY = process.env.COINMARKETCAP_API_KEY;

const fetchDataAndProduce = async (producer) => {
  try {
    // Fetch the latest Bitcoin to USD conversion rate from the CoinMarketCap API
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v2/tools/price-conversion",
      {
        params: {
          symbol: "BTC",
          amount: 1,
          convert: "USD",
        },
        headers: { "X-CMC_PRO_API_KEY": API_KEY },
      }
    );

    // Send the response data to a Kafka topic
    await producer.send({
      topic: "coinmarketcap-btc-to-usd",
      messages: [{ value: JSON.stringify(response.data) }],
    });

    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error fetching data from CoinMarketCap:", error);
  }
};

const run = async () => {
  // Create a new producer
  const producer = kafka.producer();
  await producer.connect();

  fetchDataAndProduce(producer);
  setInterval(fetchDataAndProduce, 6000, producer);
};

run().catch(console.error);
