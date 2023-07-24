# Bitcoin Data Processing Pipeline

This project is a microservices-based application that fetches Bitcoin to USD conversion data, categorizes it based on the price range, indexes it in Elasticsearch, and provides a search interface. The services are orchestrated using Kafka.

## Services

### Fetching Service

The Fetching Service retrieves data from the CoinMarketCap API using an API key. It periodically sends a GET request to the endpoint `https://pro-api.coinmarketcap.com/v2/tools/price-conversion` to fetch the latest conversion rate for Bitcoin to USD.

This service also contains a Kafka producer that sends the raw data fetched from the API to the Kafka topic `coinmarketcap-btc-to-usd`.

### Category Service

The Category Service is a Kafka consumer that consumes data from the `coinmarketcap-btc-to-usd` Kafka topic. It processes the raw data, extracts the Bitcoin price in USD, and categorizes it based on the following rules:

- If the price is less than 10,000 USD, the category is "low".
- If the price is between 10,000 and 20,000 USD, the category is "medium".
- If the price is more than 20,000 USD, the category is "high".

The service then produces the categorized data to a new Kafka topic `btc-price-category`.

### Indexing Service

The Indexing Service is a Kafka consumer that consumes the categorized data from the `btc-price-category` Kafka topic. It then indexes this data into Elasticsearch for future search and analytics.

Each document indexed into Elasticsearch corresponds to a Bitcoin price data point and its associated category.

### Search Service

The Search Service exposes an Express.js API that lets users search the indexed Bitcoin data stored in Elasticsearch. It accepts query parameters to filter the data by category, price, and price range.

The search results are returned as an array of documents that match the search criteria.

## Kafka

Kafka is a distributed streaming platform used in this project for its pub/sub model to decouple the data pipeline into independent services that can run concurrently. The Fetching Service produces messages to the `coinmarketcap-btc-to-usd` topic. The Category Service consumes from this topic, processes the messages, and produces new ones to the `btc-price-category` topic. Finally, the Indexing Service consumes from this latter topic and indexes the data into Elasticsearch.

## Elasticsearch

Elasticsearch is a distributed, RESTful search and analytics engine that centrally stores your data for search use cases. In this project, it is used to index and search the Bitcoin price data that has been categorized. The data is stored in the `btc-price-category` index, which can then be queried by the Search Service.

Example of indexed data:

```json
{
  "price": 12345.67,
  "category": "medium"
}
```

The Search Service lets users filter this data by category, specific price, or a range of prices. The service then sends a search request to Elasticsearch and returns the matching documents as the response.

Example search request:

```http
GET /search?category=medium&price=12345.67
```

Example search response:

```json
[
  {
    "price": 12345.67,
    "category": "medium"
  }
]
```

Example search request:

```http
GET /search?gte=10000&lte=20000
```

Example search response:

```json
[
  {
    "price": 12345.67,
    "category": "medium"
  },
  {
    "price": 15000,
    "category": "medium"
  },
  {
    "price": 19999.99,
    "category": "medium"
  }
]
```

## Running the Application