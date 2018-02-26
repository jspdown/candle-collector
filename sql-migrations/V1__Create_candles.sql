
CREATE TABLE timeframes (
  id      SMALLINT    NOT NULL AUTO_INCREMENT,
  unit    VARCHAR(25) NOT NULL,
  value   INTEGER     NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT u_unit_value UNIQUE (unit, value)
) ENGINE=INNODB;

CREATE TABLE exchanges (
  id    SMALLINT     NOT NULL AUTO_INCREMENT,
  name  VARCHAR(255) NOT NULL,

  PRIMARY KEY (id),
  UNIQUE (name)
) ENGINE=INNODB;

CREATE TABLE coins (
  id          SMALLINT       NOT NULL AUTO_INCREMENT,
  symbol      VARCHAR(10)    NOT NULL,
  name        VARCHAR(255)   NOT NULL,
  decimals    SMALLINT       NOT NULL,
  created_at  DATETIME       DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE (symbol)
) ENGINE=INNODB;

CREATE TABLE pairs (
  id          SMALLINT  NOT NULL AUTO_INCREMENT,
  base_id     SMALLINT  NOT NULL,
  quote_id    SMALLINT  NOT NULL,
  exchange_id SMALLINT  NOT NULL,
  created_at  DATETIME  DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  FOREIGN KEY (base_id)
    REFERENCES coins(id)
    ON DELETE CASCADE,

  FOREIGN KEY (quote_id)
    REFERENCES coins(id)
    ON DELETE CASCADE,

  FOREIGN KEY (exchange_id)
    REFERENCES exchanges(id)
    ON DELETE CASCADE,

  CONSTRAINT u_base_quote_exchange
    UNIQUE (exchange_id, quote_id, base_id)
) ENGINE=INNODB;

CREATE TABLE candles (
  id            BIGINT      NOT NULL AUTO_INCREMENT,
  date          DATETIME    NOT NULL,
  timeframe_id  SMALLINT    NOT NULL,
  pair_id       SMALLINT    NOT NULL,
  low           BIGINT      NOT NULL,
  high          BIGINT      NOT NULL,
  open          BIGINT      NOT NULL,
  close         BIGINT      NOT NULL,
  volume        BIGINT      NOT NULL,

  PRIMARY KEY (id),

  FOREIGN KEY (timeframe_id)
    REFERENCES timeframes(id)
    ON DELETE CASCADE,

  FOREIGN KEY (pair_id)
    REFERENCES pairs(id)
    ON DELETE CASCADE,

  CONSTRAINT u_date_timeframe
    UNIQUE (timeframe_id, date, pair_id)
) ENGINE=INNODB;
