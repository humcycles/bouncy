var test = require('tap').test;
var bouncy = require('../');
var http = require('http');

var net = require('net');
var Stream = function () {
    var s = new net.Stream;
    s.readable = true;
    s.writable = true;
    s.write = function (buf) { s.emit('data', buf) };
    s.end = function () { s.emit('end') };
    return s;
};

test('GET with http', function (t) {
    var port = Math.floor(Math.random() * (Math.pow(2,16) - 1e4) + 1e4);
    t.plan(3);
    var s = bouncy(function (req, proxy) {
        t.equal(req.headers.host, 'localhost:' + port);
        
        var stream = Stream();
        proxy(stream);
        
        stream.write([
            'HTTP/1.1 200 200 OK',
            'Content-Type: text/plain',
            'Connection: close',
            '',
            'oh hello'
        ].join('\r\n'));
        stream.end();
    });
    
    s.listen(port, function () {
        var opts = {
            method : 'GET',
            host : 'localhost',
            port : port,
            path : '/'
        };
        var req = http.request(opts, function (res) {
            t.equal(res.headers['content-type'], 'text/plain');
            
            var data = '';
            res.on('data', function (buf) {
                data += buf.toString();
            });
            
            res.on('end', function () {
                t.equal(data, 'oh hello');
                s.close();
                t.end();
            });
        });
        
        req.end();
    });
});
