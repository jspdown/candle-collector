# candle-collector

Collects markets prices, aggregate them into OHLC buckets and make them available
over HTTP.

Markets and timeframes are just entries in the database. Please see
`sql-data/V1_1__Add_timeframes_and_pairs.sql`.

Markets prices are fetched directly on the exchange. Currently, only one
exchange is available: Poloniex.

# Setup

Prerequisites:
- NodeJs v8.9.3
- MySQL v5.7.21
- Flyway v5.0.7

Environment variables:

```bash
export CANDLE_COLLECTOR_MYSQL_USER="root"
export CANDLE_COLLECTOR_MYSQL_PASS=""
export CANDLE_COLLECTOR_MYSQL_HOST='localhost'
export CANDLE_COLLECTOR_MYSQL_PORT=3306
export CANDLE_COLLECTOR_MYSQL_DATABASE='candle_collector'
export CANDLE_COLLECTOR_PORT=8080
```

Start the API:

```bash
npm start
```

Start collecting candles:

```bash
npm run collector
```

# "REST" API:

| Method  | Path        | Description              |
| ------- |-------------| ------------------------ |
| GET     | /timeframes | Get available timeframes |
| GET     | /pairs      | Get collected pairs      |
| GET     | /candles    | Get collected candles    |

Errors have to following format:

```
{
  "code": 2,
  "message": "Error message"
}
```

Errors codes:

| Name               | Code | Status |
| ------------------ |----- | ------ |
| INTERNAL_ERROR     | 1    | 500    |
| NOT_FOUND          | 2    | 404    |
| INVALID_PARAMETERS | 3    | 400    |
| MISSING_PARAMETERS | 4    | 400    |

### GET /timeframes

```bash
$> http GET localhost:8080/timeframes

HTTP/1.1 200 OK
[
    {
        "unit": "minute",
        "value": 1
    }
]
```

### GET /pairs

Query parameters:

| Name     | Required | Description              |
| -------- |----------| ------------------------ |
| exchange | no       | Filter by exchange       |

```bash
$> http GET localhost:8080/pairs

HTTP/1.1 200 OK
[
    {
        "base": "ETH",
        "decimals": 8,
        "exchange": "poloniex",
        "quote": "BTC"
    }
]
```

### GET /candles

Query parameters:

| Name     | Required | Description                                 |
| -------- |----------| ------------------------------------------- |
| exchange | yes      | Exchange name                               |
| pair     | yes      | Pair you want (format: {BASE}_{QUOTE})      |
| timeframe| yes      | Timeframe you want (format: {VALUE}_{UNIT}) |

Errors:
- `INVALID_PARAMETERS`: Parameter doesn't conform to pair/timeframe's format
- `MISSING_PARAMETERS`: Missing query parameter
- `NOT_FOUND`: Pair/exchange/timeframe not found

```bash
$> http GET localhost:8080/candles exchange==poloniex pair==ETH_BTC timeframe==1_minute

HTTP/1.1 200 OK
[
    {
        "close": "0.08667571",
        "date": "2018-02-25T11:29:00.000Z",
        "high": "0.08683594",
        "low": "0.0866757",
        "open": "0.08671316",
        "volume": "95.5340148"
    },
    ...
]
```

# Licence

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
