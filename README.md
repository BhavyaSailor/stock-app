To restart the trades in Mock-BSE you need to refresh trades.json ("bse\data\trades.json") with []
to refresh the tables , run this command -> TRUNCATE TABLE trades, pull_jobs RESTART IDENTITY CASCADE;
