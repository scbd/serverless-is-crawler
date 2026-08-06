'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;

function mkEvent({ uri = '/', host = 'absch.cbd.int', userAgent = 'curl/7.51.0', isCrawler, isPrerender, xPrerender } = {}) {
  const headers = {
    host: [{ key: 'Host', value: host }],
    'user-agent': [{ key: 'User-Agent', value: userAgent }],
  };
  if (isCrawler !== undefined) headers['x-is-crawler'] = [{ key: 'X-Is-Crawler', value: String(isCrawler) }];
  if (isPrerender !== undefined) headers['x-is-prerender'] = [{ key: 'X-Is-Prerender', value: String(isPrerender) }];
  if (xPrerender !== undefined) headers['x-prerender'] = [{ key: 'X-Prerender', value: String(xPrerender) }];

  return {
    Records: [{ cf: { request: { uri, method: 'GET', headers } } }],
  };
}

function invoke(event) {
  let result;
  app.lambdaHandler(event, {}, (_err, r) => { result = r; });
  return result;
}

describe('redirect-crawler', function () {
  it('blocks bad-spider user agents with 403', function () {
    const result = invoke(mkEvent({ userAgent: 'foo spider-feedback@bytedance.com bar', isCrawler: true }));
    expect(result.status).to.equal('403');
  });

  it('404s on duplicate /countries/ path segments', function () {
    const result = invoke(mkEvent({ uri: '/zh/database/IRCC/ABSCH-IRCC-FR-265514/countries/countries/countries/KI', isCrawler: true }));
    expect(result.status).to.equal('404');
  });

  it('404s on duplicate /kb/ path segments', function () {
    const result = invoke(mkEvent({ uri: '/zh/database/IRCC/ABSCH-IRCC-IN-265059/kb/tags/about/countries/kb/faqs', isCrawler: true }));
    expect(result.status).to.equal('404');
  });

  it('404s on database/.../countries paths', function () {
    const result = invoke(mkEvent({ uri: '/database/abc/def/countries', isCrawler: true }));
    expect(result.status).to.equal('404');
  });

  it('404s on pdf/.../kb paths', function () {
    const result = invoke(mkEvent({ uri: '/pdf/abc/def/kb', isCrawler: true }));
    expect(result.status).to.equal('404');
  });

  it('passes through paths that only look suspicious', function () {
    const result = invoke(mkEvent({ uri: '/database/abc/def/normal', isCrawler: true }));
    expect(result.uri).to.equal('/database/abc/def/normal');
  });

  it('skips prerender when x-is-prerender is true', function () {
    const result = invoke(mkEvent({ uri: '/some/page', isCrawler: true, isPrerender: true }));
    expect(result.origin).to.be.undefined;
  });

  it('skips prerender when x-prerender is 1', function () {
    const result = invoke(mkEvent({ uri: '/some/page', isCrawler: true, xPrerender: 1 }));
    expect(result.origin).to.be.undefined;
  });

  it('skips prerender for non-html asset requests', function () {
    const result = invoke(mkEvent({ uri: '/assets/logo.png', isCrawler: true }));
    expect(result.origin).to.be.undefined;
  });

  it('skips prerender on www.cbd.int outside the SPA allowlist', function () {
    const result = invoke(mkEvent({ uri: '/random/path', host: 'www.cbd.int', isCrawler: true }));
    expect(result.origin).to.be.undefined;
  });

  it('prerenders www.cbd.int /decisions via the local prerender service', function () {
    const result = invoke(mkEvent({ uri: '/decisions/foo', host: 'www.cbd.int', isCrawler: true }));
    expect(result.origin.custom.domainName).to.equal('prerender.infra.cbd.int');
    expect(result.origin.custom.path).to.equal('/api/render-html?_escaped_fragment_=true&url=https://www.cbd.int');
    expect(result.headers.host[0].value).to.equal('prerender.infra.cbd.int');
  });

  it('prerenders crawler requests via the local prerender service', function () {
    const result = invoke(mkEvent({ uri: '/some/page', host: 'absch.cbd.int', isCrawler: true }));
    expect(result.origin.custom.domainName).to.equal('prerender.infra.cbd.int');
    expect(result.origin.custom.path).to.equal('/api/render-html?_escaped_fragment_=true&url=https://absch.cbd.int');
  });

  it('passes through non-crawler requests untouched', function () {
    const result = invoke(mkEvent({ uri: '/some/page', host: 'absch.cbd.int', isCrawler: false }));
    expect(result.origin).to.be.undefined;
  });
});
