exports.lambdaHandler = (event, context, callback) => {
  
    const request   = event.Records[0].cf.request;
    let is_crawler  = undefined;
    let prerender   = true;
    let host;
    
    if ('host' in request['headers']) {
        host = request['headers']['host'][0].value.toLowerCase();
    }
    
    if ('x-is-crawler' in request['headers']) {
      is_crawler = request['headers']['x-is-crawler'][0].value.toLowerCase();
    }

    if ('x-is-prerender' in request['headers']) {
      if(request['headers']['x-is-prerender'][0].value.toLowerCase() == 'true'){
        prerender = false;
      }
    }
    
    // request targets non-html files
    if (request.uri.match(/\.(html|js|json|css|xml|less|png|jpg|jpeg|gif|pdf|txt|ico|rss|zip|mp3|rar|exe|wmv|doc|xls|ppt|docx|xlsx|pptx|avi|mpg|mpeg|tif|wav|mov|psd|ai|mp4|m4a|swf|dat|dmg|iso|flv|m4v|torrent|ttf|woff|svg|eot)/i)) {
      prerender = false;
    }
    
    //special case for cbd.int to prerender only SPA portions
    if(prerender && host === 'www.cbd.int'){
      prerender = canPrerenderWWWRequest(request.uri);
    }
    
    if (is_crawler === 'true' && prerender == true) {
      
        let prerenderDomain = 'npirw8odh2.execute-api.us-east-1.amazonaws.com'  
        let path = '/Prod/render-html?url=https://' + request.headers['host'][0].value;
        
        request.headers['host'] = [{ key: 'host', value: prerenderDomain}];
        
        request.origin = {
            custom: {
                protocol            : 'https',
                port                : 443,
                domainName          : prerenderDomain,
                path                : path,
                sslProtocols        : ['TLSv1', 'TLSv1.1', 'TLSv1.2'],
                readTimeout         : 30,
                keepaliveTimeout    : 30,
                customHeaders       : {}
          }
        };
         
    }
    
    callback(null, request);

  };

  function canPrerenderWWWRequest(locationPath){

    if(/^\/decisions($|\/.*)/.test(locationPath))
      return true;

    // /conferences/**
    if(/^\/conferences($|\/.*)/.test(locationPath))
        return true;

    if(/^\/meetings($|\/.*)/.test(locationPath))
        return true;

    // /aichi-targets/*
    if(/^\/aichi\-targets($|\/.*)/.test(locationPath))
        return true;

    // /kronos/*
    // No prerendering for Kronos

    //bbi/*
    if(/^\/biobridge($|\/.*)/.test(locationPath))
        return true;

    //idb/celebrations/* \/20(?!0[0-9]|1[0-7])\d\d\/celebrations
    if(/^\/idb\/20(?!0[0-9]|1[0-7])\d\d\/celebrations($|\/.*)/.test(locationPath))
        return true;

    //es/*
    if(/^\/participation($|\/.*)/.test(locationPath))
        return true;

    if(/^\/notifications\/.+/.test(locationPath))
      return true;

    if(/^\/side\-events\/.+/.test(locationPath))
      return true;

    if(/^\/2011\-2020\/.+/.test(locationPath))
      return true;

    return false;
      
  }