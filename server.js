/* Express 3 requires that you instantiate a `http.Server` to attach socket.io to first */
var http = require('http');
var fs = require('fs');
var Twit = require('twit');

var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    port = 8080,
    url  = 'http://localhost:' + port + '/';
    

if(process.env.SUBDOMAIN){
  url = 'http://' + process.env.SUBDOMAIN + '.jit.su/';
}

server.listen(port);
console.log("Express server listening on port " + port);
console.log(url);

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/:id.html', function (req, res) {
  res.sendfile(__dirname + '/'+req.params.id+'.html');
});

app.get('/css/:id', function (req, res) {
  res.sendfile(__dirname + '/css/'+req.params.id);
});

app.get('/js/:id.js', function (req, res) {
  res.sendfile(__dirname + '/js/'+req.params.id+'.js');
});

app.get('/js/:id.json', function (req, res) {
  res.sendfile(__dirname + '/js/'+req.params.id+'.json');
});

app.get('/videos/:id', function (req, res) {
  res.sendfile(__dirname + '/videos/'+req.params.id);
});

app.get('/sounds/:id', function (req, res) {
  res.sendfile(__dirname + '/sounds/'+req.params.id);
});

app.get('/socket.io/socket.io.js', function (req, res) {
  res.sendfile(__dirname + '/socket.io/socket.io.js');
});

app.get('/img/:id', function (req, res) {
  res.sendfile(__dirname + '/img/'+req.params.id);
});

var theInstruments = new Array();
var theIdUsers = new Array();
var thePlace = null;
var thePlaces = null;
var theBg = null;

var limitUsers = 5;

var playing = false;

var T = new Twit({
    consumer_key: 'eDyJgaWesnpS1OSAh7wlDg',
    consumer_secret: 'O1xlcU8F41Nz5hxFVmpdOzTn6o786ZnipGY9dKH00',
    access_token: '323905773-VpsZ0bmMFzbKfO1MaGTYXzdBUOxTqjgJwA4tyZAC',
    access_token_secret: 'whf6N0tqiZx91JqZhUvPMpNFOQw162R8jzjZwWR18gWnz'
});

var stream = T.stream('statuses/filter', {track: '#apple'});

io.sockets.on('connection', function (socket) {

    /* L'utilisateur est détecté et connecté */
    socket.on('connect', function(who){
        console.log(who+" : I'm connected!");

        if(who == "index" && playing == false){
            console.log("première connexion index");
            thePlace = null;
            restart(); // On lance une partie
        }  
        else if(who == "index" && playing == true){
            console.log("autre connexion index");
            socket.broadcast.emit('thanks');  // On renvoie un merci
            restart(); // On relance une partie
        }

        if(playing == true){
            /* Quand le premier instrument se connecte, ça lance la musique  */
            if(who == "instrument" && theInstruments.length == 0){
                console.log("first instrument");
                console.log("start stream");
                stream.start(); // On lance le stream twitter lors de la première connexion d'un instrument
                socket.emit('connected', {place:thePlace, bg:theBg}); // On renvoie à l'utilisateur le lieu
                socket.broadcast.emit('connected', {place:thePlace, bg:theBg}); // On envoie à l'index qu'on a un utilisateur
            }    
            else if(who != "index"){
                 if(theIdUsers.length+1 <= 5){
                    socket.emit('connected', {place:thePlace, bg:theBg});
                 }
                 else{
                    socket.emit("sorry");
                 }
            }
        }    
    });

    /* L'utilisateur a choisi un instrument */
    socket.on('chooseInstrument', function(instrument){

        /* Défini l'id de l'utilisateur en fonction du nombre de joueurs */
        var idUser = theIdUsers.length+1;

        /* Check si la partie est pleine */
        if(idUser <= 5){


            socket.idUser = idUser;
            theIdUsers.push(idUser);
            /* On ajoute son instrument à la liste des instruments de la partie */
            theInstruments.push(instrument);

            console.log("Connexion de l'user "+socket.idUser+" avec l'instrument "+instrument);
            
            /* On renvoit à l'utilisateur son ID pour qu'on puisse le reconnaître plus tard */
            socket.emit('myId', idUser);
            socket.broadcast.emit('newUser', {id:idUser, instrument:instrument});
        }    
        else{
            socket.emit('sorry'); // On renvoit une erreur
        }
    });

    /* Lorsqu'un utilisateur joue */
	socket.on('click', function (theId){
        console.log("Réception click");
        /* On envoie à tout le monde que cet utilisateur a joué de son instrument */
        socket.broadcast.emit('clicked', {id:theId, instrument:theInstruments[theId-1]});
	});

    /* Fin d'une partie */
    socket.on('end', function(){
        socket.broadcast.emit('thanks');  // On renvoie un merci
        restart();
    });

    socket.on('goOut', function(){
        socket.idUser = undefined;
    })

    socket.on('playing', function(data){
        playing = data;
        console.log("playing "+playing);
    });

    /* Déconnection d'un utilisateur */
    socket.on('disconnect', function(){
        socket.leave('instrument');
        console.log(theInstruments);
        console.log("On déconnecte l'id "+socket.idUser+" et l'instrument "+theInstruments[socket.idUser-1]);
        delete theInstruments[socket.idUser];
        delete theIdUsers[socket.idUser];
        socket.idUser = undefined;
    });

    socket.on('message', function(msg){
        console.log(msg);
    });

    stream.on('tweet', function(tweet){
        socket.emit('photo', tweet.user.profile_image_url.replace('http', 'https'));
    });

    /* On remet tout à zéro pour accueillir une nouvelle partie */
    function restart(){
        console.log("stop stream");
        stream.stop(); // On stoppe le stream dès que c'est terminé
        theInstruments = null;
        theInstruments =  new Array();

        theIdUsers = null;
        theIdUsers = new Array();

        randPlace();
        playing = false;
        console.log("playing false");
    }

    function randPlace(){
        var places = new Array();
        var bgs = new Array();
        var url = 'http://aurelien.georget.jit.su/js/places.json';

        http.get(url, function(res) {
            var output = '';

            res.on('data', function(chunk) {
                output += chunk;
            });

            res.on('end', function() {
                var response = JSON.parse(output);
                thePlaces = response;

                for(var k in response) {
                    places.push(k);
                    bgs.push(response[k].bg);
                }

                /* Sélection aléatoire d'un fond */
                var nb = Math.floor(Math.random()*places.length);
                thePlace = places[nb];
                theBg = bgs[nb];
                socket.emit("place", thePlace); // Envoie du fond choisi à la fenêtre principale
            });
        }).on('error', function(e) {
              console.log("Got error: ", e);
        });
    }

});