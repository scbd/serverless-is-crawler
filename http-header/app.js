exports.lambdaHandler = async (event, context, callback) => {
    
    let Crawler   = require('es6-crawler-detect/src').Crawler;
    let request   = event;
    
    if(event.Records)
        request = event.Records[0].cf.request;
        
    try{    
        let isPrerender;
        
        if ('x-is-prerenderr' in request['headers']) {
            isPrerender = request['headers']['x-is-prerender'][0].value  === 'true';
        }
        
        if(!isPrerender){
                            
            let userAgent       = request['headers']['user-agent'][0].value;
            let CrawlerDetector = new Crawler(request);        
            let httpHeader       = CrawlerDetector.isCrawler(userAgent);
            
            if(httpHeader){
                request['headers']['X-Is-Crawler'] = [{
                    key: 'X-Is-Crawler',
                    value: httpHeader.toString()
                }];
            }
        
        }
            
    }
    catch(err){
        console.error(err)
    }

    callback(null, request)
};
