CREATE TABLE IF NOT EXISTS click_stats_meta (
  id integer PRIMARY KEY CHECK (id = 1),
  started_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO click_stats_meta (id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS click_receipts (
  id uuid PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS click_receipts_received_at ON click_receipts(received_at);
CREATE TABLE IF NOT EXISTS click_daily (
  day date NOT NULL,
  placement text NOT NULL CHECK (placement IN ('list', 'detail')),
  page text NOT NULL CHECK (page IN ('home', 'share')),
  browser text NOT NULL CHECK (browser IN ('browser', 'in_app', 'standalone')),
  activation text NOT NULL CHECK (activation IN ('same_tab', 'new_tab')),
  clicks bigint NOT NULL CHECK (clicks >= 0),
  PRIMARY KEY (day, placement, page, browser, activation)
);
