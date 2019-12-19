exports.lambdaHandler = async (event, context, callback) => {
    
    let Crawler   = require('es6-crawler-detect/src').Crawler;
    let request   = event;
    
    if(event.Records)
        request = event.Records[0].cf.request;
        
    try{    
        
        let userAgent       = request['headers']['user-agent'][0].value;
        let CrawlerDetector = new Crawler(request);
    
        let isCrawler = CrawlerDetector.isCrawler(userAgent);
        
        request['headers']['X-Is-Crawler'] = [{
            key: 'X-Is-Crawler',
            value: isCrawler.toString()
        }];
        
    }
    catch(err){
        console.error(err)
    }

    callback(null, request)
};


