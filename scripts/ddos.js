var url = getSystemProperty('ddos_sonify.url') || '/script/ddos-protect~ddos.js/trend/json';
logInfo(url);
setHttpHandler(function(request) {
  var res;
  try {
    var after = request.query && request.query.after && request.query.after[0];
    resp = http(url + (after ? '?after='+after : ''));
    res = JSON.parse(resp);
  } catch(e) {
    throw 'service_unavailable';
  }
  return res;
});
