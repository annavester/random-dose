var express = require('express');
var app = express();
var request = require('request');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var consumer_key = process.env.POCKET_KEY;
var access_token = process.env.POCKET_TOKEN;

io.on('connection', function (socket) {
    console.log("io connection");

    socket.on('delete article', function(itemId) {
        console.log('deleting article: ', itemId);
        var url = 'https://getpocket.com/v3/send?actions=%5B%7B%22action%22%3A%22delete' +
         '%22%2C%22item_id%22%3A'+itemId+'%7D%5D&access_token=' + access_token +
         '&consumer_key='+consumer_key;
        console.log(url);
        request.post(url, {
            headers: {'content-type':'application/json'},
            body: JSON.stringify({
                consumer_key: consumer_key,
                access_token: access_token,
                actions: [
                    {action: "delete", item_id: itemId, time: new Date().getTime()}
                ]
            })
        }).on('error', function(err) {
            console.log("Error: ", err);
        }).on('response', function(response) {
            console.log(response.statusCode) // 200
            console.log(response.headers['content-type'])
        }).pipe(request.get("http://localhost:8080/"));
    }, function() {
        console.log(arguments);
    });
});

app.use(express.static('public'));
app.set('view engine', 'ejs');
var getRandom = function(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len;
    }
    return result;
};

// index page
app.get('/', function(req, resp) {
    request.post('https://getpocket.com/v3/get', {
        headers: {'content-type':'application/json'},
        body: JSON.stringify({
            consumer_key: consumer_key,
            access_token: access_token,
            detailType: "complete"
        })
    }, function (err, res, body) {
        var articles = [], random = [], sorted = [];
        body = JSON.parse(body).list;

        for (var article in body) {
            articles.push([article, body[article]]);
        }

        random = getRandom(articles, 10);

        sorted = random.sort(function(a, b) {
            return a[1].word_count - b[1].word_count;
        });

        resp.render("pages/index", {
            articles: sorted,
            articlesCount: articles.length
        })
    });
});


server.listen(8080, function() {
    console.log("running on port 8080");
});