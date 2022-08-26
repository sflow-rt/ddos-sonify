$(function() {

  var dataURL = '../scripts/ddos.js/json';

  var db = {};
  var showThreshold = true;
  var lastControlsID = 0;

  $('a[href^="#"]').on('click', function(e) {
    e.preventDefault();
  });

  var voices = {};
  var loop;
  var loopInterval = '4n';
  $('#sonify').click(function() {
    if($(this).prop("checked")) {
      voices.synth = new Tone.PolySynth(Tone.Synth).toDestination();
      voices.metal = new Tone.PolySynth(Tone.MetalSynth).toDestination();
      voices.pluck = new Tone.PolySynth(Tone.PluckSynth).toDestination();
      voices.membrane = new Tone.PolySynth(Tone.MembraneSynth).toDestination();
      voices.am = new Tone.PolySynth(Tone.AMSynth).toDestination();
      voices.fm = new Tone.PolySynth(Tone.FMSynth).toDestination();
      voices.duo = new Tone.PolySynth(Tone.DuoSynth).toDestination();
      Tone.Transport.bpm.value=80;
      loop = new Tone.Loop((now) => {
        sonify(now);
      },loopInterval).start(0);
      Tone.Transport.start();
    } else {
      loop.stop();
      loop.dispose();
      Tone.Transport.stop();
    }
  });

  var protocols = {
    '1':'icmp',
    '6':'tcp',
    '17':'udp',
    '47':'gre',
    '50':'esp'
  };

  var ports = {
    '19':'chargen',
    '53':'dns',
    '80':'http',
    '123':'ntp',
    '137':'netbios',
    '161':'snmp',
    '389':'cldap',
    '443':'https',
    '1900':'ssdp',
    '4500':'ipsec'
  };

  function label(key,map) {
    var label = map[key];
    return label ? label+'('+key+')' : key; 
  }

  var colors = $.inmon.stripchart.prototype.options.colors;
  $('#ip-flood').chart({
    type: 'topn',
    stack: false,
    includeOther:false,
    metric: 'top-5-ip-flood',
    legendHeadings: ['Target','Group','Protocol'],
    keyName: (key,idx) => idx == 2 ? label(key,protocols) : key,
    hrule:[{name:'threshold_ip_flood',color:colors[1],scale:showThreshold}],
    units: 'Packets per Second'},
  db);
  $('#ip-fragmentation').chart({
    type: 'topn',
    stack: false,
    includeOther:false,
    metric: 'top-5-ip-fragmentation',
    legendHeadings: ['Target','Group','Protocol'],
    keyName: (key,idx) => idx == 2 ? label(key,protocols) : key,
    hrule:[{name:'threshold_ip_fragmentation',color:colors[1],scale:showThreshold}],
    units: 'Packets per Second'},
  db);
  $('#udp-flood').chart({
    type: 'topn',
    stack: false,
    includeOther: false,
    metric: 'top-5-udp-flood',
    legendHeadings: ['Target','Group','Port'],
    keyName: (key,idx) => idx == 2 ? label(key,ports) : key,
    hrule: [{name:'threshold_udp_flood',color:colors[1],scale:showThreshold}],
    units: 'Packets per Second'},
  db);
  $('#udp-amplification').chart({
    type: 'topn',
    stack: false,
    includeOther: false,
    metric: 'top-5-udp-amplification',
    legendHeadings: ['Target','Group','Port'],
    keyName: (key,idx) => idx == 2 ? label(key,ports) : key,
    hrule: [{name:'threshold_udp_amplification',color:colors[1],scale:showThreshold}],
    units: 'Packets per Second'},
  db);
  $('#tcp-flood').chart({
    type: 'topn',
    stack: false,
    includeOther: false,
    metric: 'top-5-tcp-flood',
    legendHeadings: ['Target','Group','Port'],
    keyName: (key,idx) => idx == 2 ? label(key,ports) : key,
    hrule: [{name:'threshold_tcp_flood',color:colors[1],scale:showThreshold}],
    units: 'Packets per Second'},
  db);
  $('#tcp-amplification').chart({
    type: 'topn',
    stack: false,
    includeOther: false,
    metric: 'top-5-tcp-amplification',
    legendHeadings: ['Target','Group','Port'],
    keyName: (key,idx) => idx == 2 ? label(key,ports) : key,
    hrule: [{name:'threshold_tcp_amplification',color:colors[1],scale:showThreshold}],
    units: 'Packets per Second'},
  db);
  $('#icmp-flood').chart({
    type: 'topn',
    stack: false,
    includeOther: false,
    metric: 'top-5-icmp-flood',
    legendHeadings: ['Target','Group','Type'],
    hrule: [{name:'threshold_icmp_flood',color:colors[1],scale:showThreshold}],
    units: 'Packets per Second'},
  db);
  $('#attacks').chart({
    type: 'trend',
    stack: true,
    legend: ['Active','Failed','Pending'],
    metrics: ['controls_blocked','controls_failed','controls_pending'],
    units: 'Number of Controls'},
  db);
  $('#connections').chart({
    type: 'trend',
    stack: false,
    metrics: ['connections'],
    hrule: [{name:'threshold_connections',color:colors[3],scale:showThreshold}],
    units: 'BGP Connections'},
  db);

  var metrics = [
    {name:'top-5-ip-flood', threshold:'threshold_ip_flood', voice:'synth'},
    {name:'top-5-ip-fragmentation', threshold:'threshold_ip_fragmentation', voice:'duo'},
    {name:'top-5-icmp-flood', threshold:'threshold_icmp_flood', voice:'pluck'},
    {name:'top-5-udp-flood', threshold:'threshold_udp_flood', voice:'membrane'},
    {name:'top-5-udp-amplification', threshold:'threshold_udp_amplification', voice:'metal'},
    {name:'top-5-tcp-flood', threshold:'threshold_tcp_flood', voice:'am'},
    {name:'top-5-tcp-amplification', threshold:'threshold_tcp_amplification', voice:'fm'}
  ];
  var notes = ['C4','D4','E4','F4','G4','A4','B4','C5'];
  function sonify(now) {
    var sounds = {};
    var max = {};
    metrics.forEach(function(metric) {
      let vals = db.trend.trends[metric.name];
      let topn = vals[vals.length - 1];
      let thresh = db.trend.values[metric.threshold];
      let chord = sounds[metric.voice];
      if(!chord) {
        chord = {};
        sounds[metric.voice] = chord;
      }
      for(var key in topn) {
        let [tgt,group,port] = key.split(',');
        let note = notes[port % notes.length];
        chord[note] = Math.max(chord[note] || 0, Math.min(1,topn[key] / thresh));
        max[metric.voice] = Math.max(max[metric.voice] || 0, chord[note]);
      };
    });
    var interval = Tone.Time(loopInterval).toSeconds();
    var delay = 0;
    for(let voice in sounds) {
      let synth = voices[voice];
      let chord = sounds[voice];
      let maxval = max[voice];
      if(maxval) {
        let volume = Math.min(0,(maxval - 1) * 20);
        synth.volume.value=volume;
        let note_array = [];
        for(let note in chord) {
          let val = chord[note];
          if((val / maxval) < 0.7) continue;
          note_array.push(note);
        }
        let duration = Tone.Time(maxval*interval).quantize('64n');
        if(duration > 0) synth.triggerAttackRelease(note_array,duration,now+delay);
      } 
      delay += Tone.Time('16n').toSeconds();
    }
  }

  function updateData(data) {
    if(!data 
      || !data.trend 
      || !data.trend.times 
      || data.trend.times.length == 0) return;
    
    if(db.trend) {
      // merge in new data
      var maxPoints = db.trend.maxPoints;
      db.trend.times = db.trend.times.concat(data.trend.times);
      var remove = db.trend.times.length > maxPoints ? db.trend.times.length - maxPoints : 0;
      if(remove) db.trend.times = db.trend.times.slice(remove);
      for(var name in db.trend.trends) {
        db.trend.trends[name] = db.trend.trends[name].concat(data.trend.trends[name]);
        if(remove) db.trend.trends[name] = db.trend.trends[name].slice(remove);
      }
    } else db.trend = data.trend;
    
    db.trend.start = new Date(db.trend.times[0]);
    db.trend.end = new Date(db.trend.times[db.trend.times.length - 1]);
    db.trend.values = data.trend.values;

    $.event.trigger({type:'updateChart'});
  }

  (function pollTrends() {
    $.ajax({
      url: dataURL,
      dataType: 'json',
      data: db.trend && db.trend.end ? {after:db.trend.end.getTime()} : null,
      success: function(data) {
        updateData(data);
      },
      complete: function(result,status,errorThrown) {
        setTimeout(pollTrends,1000);
      },
      timeout: 60000
    });
  })();

  $(window).resize(function() {
    $.event.trigger({type:'updateChart'});
  });
});
