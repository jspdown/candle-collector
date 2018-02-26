DELIMITER //
CREATE PROCEDURE P_ADD_PAIR(
  IN exchange  VARCHAR(255),
  IN base      VARCHAR(10),
  IN quote     VARCHAR(10)
)
BEGIN
  INSERT INTO pairs (base_id, quote_id, exchange_id)
  VALUES (
    (SELECT id FROM coins      WHERE symbol = base),
    (SELECT id FROM coins      WHERE symbol = quote),
    (SELECT id FROM exchanges  WHERE name = exchange)
  );
END//
DELIMITER ;

INSERT INTO timeframes (value, unit)
VALUES
  (5, 'minute'),
  (15, 'minute'),
  (1, 'hour');

INSERT INTO coins (symbol, name, decimals)
VALUES
  ('BTC', 'Bitcoin', 8),
  ('ETH', 'Ethereum', 18),
  ('XRP', 'Ripple', 15),
  ('ZRX', '0x Project', 18),
  ('SC', 'Siacoin', 24);

INSERT INTO exchanges (name)
VALUES
  ('poloniex');

CALL P_ADD_PAIR('poloniex', 'ETH', 'BTC');
CALL P_ADD_PAIR('poloniex', 'ZRX', 'BTC');
CALL P_ADD_PAIR('poloniex', 'ZRX', 'ETH');
CALL P_ADD_PAIR('poloniex', 'XRP', 'BTC');
CALL P_ADD_PAIR('poloniex', 'SC', 'BTC');
