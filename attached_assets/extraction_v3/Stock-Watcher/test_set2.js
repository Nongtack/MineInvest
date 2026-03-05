import https from 'https';

const options = {
  hostname: 'query1.finance.yahoo.com',
  path: '/v8/finance/chart/%5ESET.BK',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(parsed.chart.result[0].meta.regularMarketPrice);
    } catch (e) { 
      console.log(data);
      console.error(e); 
    }
  });
});
