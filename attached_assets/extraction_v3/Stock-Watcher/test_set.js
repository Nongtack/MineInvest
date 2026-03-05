import https from 'https';
https.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ESET.BK', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(parsed.chart.result[0].meta.regularMarketPrice);
    } catch (e) { console.error(e); }
  });
});
