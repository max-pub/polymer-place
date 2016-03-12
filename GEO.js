GEO = {
    provider: {
        search: {
            demo: { // replace demo.search by function for syntax-cosistency with GeoIP
                search: function(query, callback) {
                    GEO.log('search.DEMO', query);
                    GEO.ajax("demo.search.json", function(raw) {
                        var places = JSON.parse(raw);
                        GEO.log('search', places);
                        if (callback) callback(places);
                    });
                }
            }
        },
        ip: {
            demo: function(callback) {
                GEO.log('ip.DEMO');
                GEO.location.ip.provider = 'demo';
                GEO.location.ip.lat = 5.12345;
                GEO.location.ip.lon = 5.12345;
                if (callback) callback(GEO.location.ip);
            }
        }
    },



    location: {
        ip: {},
        gps: {}
    },



    ajax: function(url, callback) { // simple AJAX implementation
        var req = new XMLHttpRequest();
        if (!req) return;
        req.open('GET', url, true);
        req.onreadystatechange = function() {
            if (req.readyState == 4)
                if (callback) callback(req.responseText);
        };
        req.onerror = function() {}; /// replace by ADD-EVENT-HANDLER
        req.send();
    },


    log: function(p, q) {
        if (q) console.log('GEO.js:', p, q);
        else console.log('GEO.js:', p);
    },

    ip: function(callback) {
        if (GEO.provider.ip.ipinfo_io)
            GEO.provider.ip.ipinfo_io(callback);
        else
            GEO.provider.ip.demo(callback);
    },

    gps: function(callback) {
        console.time('GEO.gps');
        // .watchPosition     .getCurrentPosition
        navigator.geolocation.watchPosition(function(pos) { // success
            console.timeEnd('GEO.gps');
            if (pos.coords.latitude.toFixed(5) != GEO.location.gps.lat) var latDiff = true;
            if (pos.coords.longitude.toFixed(5) != GEO.location.gps.lon) var lonDiff = true;

            GEO.location.gps.lat = pos.coords.latitude.toFixed(5) * 1;
            GEO.location.gps.lon = pos.coords.longitude.toFixed(5) * 1;
            GEO.location.gps.accuracy = pos.coords.accuracy;
            GEO.location.gps.raw = pos;
            if (latDiff || lonDiff) {
                GEO.log('gps', GEO.location.gps);
                if (callback) callback(GEO.location.gps);
            }
        }, function(error) { // error
            console.error('geo.gps.error', error)
        });
    },


    locate: function(callback) {
        GEO.ip(function(data) {
            if (GEO.location.gps.lat) return;
            if (callback) callback(data, 'ip');
        });

        GEO.gps(callback, 'gps');
    },

    locateAndName: function(callback, filter) { // remove this -> build into locate(location, name);
        GEO.locate(function(data) {
            GEO.search(data.lat + ',' + data.lon, function(list) {
                // GEO.log('locateAndName', list[0]);
                if (callback) callback(list[0]);
            }, filter);
        });
    },



    filter: function(loc, filter) { // filter results e.g. {type:'city'} to see just cities...
        var ret = [];
        for (var i = 0; i < loc.length; i++) {
            var use = true;
            for (var f in filter)
                if (loc[i][f] != filter[f]) use = false;
            if (use) ret.push(loc[i]);
        }
        return ret;
    },
    searchAndFilter: function(provider, query, callback, filter) {
        GEO.provider.search[provider].search(query, function(list) {
            if (filter) list = GEO.filter(list, filter);
            if (callback) callback(list);
        });
    },

    search: function(query, callback, filter) {
        if (GEO.provider.search.google)
            GEO.searchAndFilter('google', query, callback, filter);
        else
            GEO.searchAndFilter('demo', query, callback, filter);
    },
};