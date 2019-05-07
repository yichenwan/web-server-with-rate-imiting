const express = require('express');
const requestIp = require('request-ip');
const {RateLimiterWithList, rateLimiterWithList} = require('./rateLimiter');
const app = express();

app.use(requestIp.mw());
app.use((req, res, next) => {
	const rateLimiterWithList = RateLimiterWithList(60, 60);
	rateLimiterWithList(req.clientIp, (err, numOfReq, ttl) => {
		if (err) 
			return res.send(err);
		req.numOfReq = numOfReq;
		req.ttl = ttl;
	    next();			
	})
});

app.get('/', (req, res) => {
	if (process.env.REDIS_URL) {
		res.send(`Req # : ${req.numOfReq}`);
	}  else {
		res.send(`IP: ${req.clientIp}, Req # : ${req.numOfReq}, TTL # : ${req.ttl}`);
	}
});

app.listen(process.env.PORT || 3000, () => {
	console.log('server is running');
});
