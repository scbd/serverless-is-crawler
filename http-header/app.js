let Crawler = require('es6-crawler-detect/src').Crawler;

// custom crawler UAs not detected by es6-crawler-detect
const customAgents = [
    'uptimerobot'
];

// AI agent UA signatures
const aiAgents = [
    'gptbot', 'chatgpt', 'oai-searchbot',
    'claude', 'anthropic',
    'google-extended', 'google-cloudvertexbot',
    'cohere', 'perplexity', 'mistral',
    'meta-external', 'facebookbot', 'amazonbot',
    'bytespider', 'ccbot', 'duckassistbot',
    'youbot', 'diffbot', 'ai2bot'
];

// case-insensitive substring match against a list of agent tokens
const uaMatches = (userAgent, agents) => {
    const ua = userAgent.toLowerCase();
    return agents.some(agent => ua.includes(agent));
};

exports.lambdaHandler = async (event, context, callback) => {

    let request = event;

    if(event.Records)
        request = event.Records[0].cf.request;

    try{
        let isPrerender;
        let userAgent = (request['headers']['user-agent'] && request['headers']['user-agent'][0].value) || '';

        if ('x-is-prerenderr' in request['headers']) {
            isPrerender = request['headers']['x-is-prerender'][0].value === 'true';
        }

        if(!isPrerender){

            let CrawlerDetector = new Crawler(request);
            let httpIsCrawler   = CrawlerDetector.isCrawler(userAgent) 
            
            // AI agent: trust the upstream CloudFront/WAF header, fall back to UA check
            let isAiAgent = false;

            if('x-is-ai-agent' in request['headers'])
                isAiAgent = request['headers']['x-is-ai-agent'][0].value === 'true';

            if(!isAiAgent)
                isAiAgent = uaMatches(userAgent, aiAgents);

            if(isAiAgent){
                request['headers']['X-Is-AI-Agent'] = [{
                    key: 'X-Is-AI-Agent',
                    value: 'true'
                }];
            }

            if(!httpIsCrawler)
                httpIsCrawler = isAiAgent;

            if(!httpIsCrawler)
                httpIsCrawler = uaMatches(userAgent, customAgents);

            if(httpIsCrawler){
                request['headers']['X-Is-Crawler'] = [{
                    key: 'X-Is-Crawler',
                    value: httpIsCrawler.toString()
                }];

                request['headers']['X-Origin-User-Agent'] = [{
                    key: 'X-Origin-User-Agent',
                    value: userAgent.toString()
                }];
            }

        }

    }
    catch(err){
        console.error(err)
    }

    callback(null, request)
};
