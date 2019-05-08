const {RateLimiterWithList} = require('./rateLimiter');
const redis = require('fakeredis');
const async = require("async");

const RateLimiterWithListResult = (Client) => {
	let numOfReq = {};
	const rateLimiterWithList = RateLimiterWithList(60, 1, Client);	
	return {
		request(ip, cb) {
			rateLimiterWithList(ip, (err, result) => {
				numOfReq[ip] = result;
				if (cb)
					cb(err, result);
			});	
		},
		getNumOfReq(ip) {
			return numOfReq[ip];
		}
	}
}

test('Two requests in the interval', (done) => {
  const Client = redis.createClient();	
  const result = RateLimiterWithListResult(Client);
  result.request(1, (err, numOfReq1) => {
  	result.request(1, (err, numOfReq2) => {
  		expect(numOfReq1).toBe(1);
  		expect(numOfReq2).toBe(2);
  		done();
  	})
  })
});

test('Request that does not exceed the limit in the interval', (done) => {
  const Client = redis.createClient();	
  const result = RateLimiterWithListResult(Client);
  async.times(50, (n, next) => {
    result.request(1, next); 
  }, (err) => {
  	if (err) throw err;
    expect(result.getNumOfReq(1)).toBe(50);
    done();
  })
});

test('Multiple users\'s requests that does not exceed the limit in the interval', (done) => {
  const Client = redis.createClient();	
  const result = RateLimiterWithListResult(Client);
  async.times(60, (n, next) => {
    result.request(n % 2 + 1, next); 
  }, (err) => {
  	if (err) throw err;
    expect(result.getNumOfReq(1)).toBe(30);
    expect(result.getNumOfReq(2)).toBe(30);
    done();
  })
});

test('Throws an error when requests exceed the limit of requests in the interval', (done) => {
  const Client = redis.createClient();	
  const result = RateLimiterWithListResult(Client);
  async.times(61, (n, next) => {
    result.request('1', next); 
  }, (err, res) => {	
    expect(err).toBe('ERROR "too many requests per minute"');
    done();
  })
});

test('Allow requests after the small interval  ', (done) => {
  const Client = redis.createClient();	
  const result = RateLimiterWithListResult(Client);
  async.times(10, (n, next) => {
    result.request(1, next); 
  }, (err) => {
	  	if (err) throw err;
	  	expect(result.getNumOfReq(1)).toBe(10);		  	
	  	setTimeout(() => {
		  async.times(1, (n, next) => {
		    result.request(1, next); 
		  }, (err) => {
		  	if (err) throw err;  		
		    expect(result.getNumOfReq(1)).toBe(11);
		    done();
	  	})
	     },  1);
	  });
});	

test('Throws an error when requests exceed the limit of requests after a small interval  ', (done) => { // 10 + 51
  const Client = redis.createClient();	
  const result = RateLimiterWithListResult(Client);
  async.times(10, (n, next) => {
    result.request(1, next); 
  }, (err) => {
	  	if (err) throw err;
	  	expect(result.getNumOfReq(1)).toBe(10);		  	
	  	setTimeout(() => {
		  async.times(51, (n, next) => {
		    result.request(1, next); 
		  }, (err) => {		
		    expect(err).toBe('ERROR "too many requests per minute"');
		    done();
	  	})
	     },  1);
	  });
});

test('Keep throwing errors when requests exceed the limit of requests', (done) => { // 10 + 51
  const Client = redis.createClient();	
  const result = RateLimiterWithListResult(Client);
  async.times(10, (n, next) => {
    result.request(1, next); 
  }, (err) => {
	  	if (err) throw err;
	  	expect(result.getNumOfReq(1)).toBe(10);		  	
	  	setTimeout(() => {
		  async.times(51, (n, next) => {
		    result.request(1, next); 
		  }, (err) => {		
		    expect(err).toBe('ERROR "too many requests per minute"');
		    setTimeout(() => {
			  async.times(51, (n, next) => {
			    result.request(1, next); 
			  }, (err) => {		
			    expect(err).toBe('ERROR "too many requests per minute"');
		        done();			    
			    }
			  );		    
		    }, 2)
	  	  })
	     },  1);
	  });
});

test('Reset number of requests after key expires', (done) => {
  const Client = redis.createClient();	
  const result = RateLimiterWithListResult(Client);
  async.times(10, (n, next) => {
    result.request(1, next); 
  }, (err) => {
	  	if (err) throw err;
	  	expect(result.getNumOfReq(1)).toBe(10);		  	
	  	setTimeout(() => {
		  async.times(1, (n, next) => {
		    result.request(1, next); 
		  }, (err) => {
		  	if (err) throw err;  		
		    expect(result.getNumOfReq(1)).toBe(1);
		    done();
	  	  })
	     },  1000);
	  });
});	

test('After an error occurs, reset the request when the key expires', (done) => {
  const Client = redis.createClient();	
  const result = RateLimiterWithListResult(Client);
  async.times(61, (n, next) => {
    result.request(1, next); 
  }, (err) => {
	  	expect(err).toBe('ERROR "too many requests per minute"');	
	  	setTimeout(() => {
		  async.times(1, (n, next) => {
		    result.request(1, next); 
		  }, (err) => {
		  	if (err) throw err;  		
		    expect(result.getNumOfReq(1)).toBe(1);
		    done();
	  	})
	     },  1000);
	  });
});	

