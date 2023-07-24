const express = require("express");
const { Client } = require("@elastic/elasticsearch");
const dotenv = require("dotenv");

// Load environment variables from the .env file
dotenv.config();

const app = express();
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

app.get("/search", async (req, res) => {
  const { category, price, gte, lte } = req.query;
  const searchQuery = {
    bool: {
      must: [],
      filter: [],
    },
  };

  if (category) {
    searchQuery.bool.must.push({
      match: { category },
    });
  }

  if (price) {
    searchQuery.bool.must.push({
      term: { price },
    });
  }

  if (gte || lte) {
    const rangeFilter = { price: {} };

    if (gte) {
      rangeFilter.price.gte = gte;
    }

    if (lte) {
      rangeFilter.price.lte = lte;
    }

    searchQuery.bool.filter.push({
      range: rangeFilter,
    });
  }

  try {
    const { hits } = await client.search({
      index: "btc-price-category",
      body: {
        query: searchQuery,
      },
    });

    const results = hits.hits.map((hit) => hit._source);

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
