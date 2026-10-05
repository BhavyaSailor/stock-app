function TradeTable({ trades }) {
  return (
    <div>
      <h2>Trades</h2>

      <table>
        <thead>
          <tr>
            <th>Trade ID</th>
            <th>Client</th>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Timestamp</th>
          </tr>
        </thead>

        <tbody>
          {trades.map((trade) => (
            <tr key={trade.trade_id}>
              <td>{trade.trade_id}</td>
              <td>{trade.client}</td>
              <td>{trade.symbol}</td>
              <td>{trade.quantity}</td>
              <td>{trade.price}</td>
              <td>
                {new Date(trade.trade_timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TradeTable;