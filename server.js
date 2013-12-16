var http = require('http')
  , server = http.createServer()
  , io = require('socket.io').listen(server);

server.listen(1337);

var theInstruments = new Array();
var theIdUsers = new Array();
var thePlace = null;
var thePlaces = null;

var limitUsers = 5;

io.sockets.on('connection', function (socket) {

    /* L'utilisateur est détecté et connecté */
    socket.on('connect', function(who){
        console.log(who+" : I'm connected!");

        /* Quand un utilisateur est détecté, on va chercher l'ensemble des lieux */
        if(thePlace == null){
            randPlace();
        }

        /* Quand le premier instrument se connecte, ça lance la musique  */
        if(who == "instrument" && theInstruments.length == 0){
            socket.emit('connected', thePlace); // On renvoie à l'utilisateur le lieu
            socket.broadcast.emit('connected', thePlace); // On envoie à l'index qu'on a un utilisateur
        }    
        else if(who != "index"){
             if(theIdUsers.length+1 <= 5){
                socket.emit('connected', thePlace);
             }
             else{
                socket.emit("sorry");
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

        /* On remet tout à zéro pour accueillir une nouvelle partie */
        theInstruments = null;
        theInstruments =  new Array();

        theIdUsers = null;
        theIdUsers = new Array();

        randPlace();
        
        socket.broadcast.emit('thanks');  // On renvoie un merci
    });

    socket.on('goOut', function(){
        socket.idUser = undefined;
    })

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

    function randPlace(){
        var places = new Array();
        var url = 'http://aurelien-georget.local/maorie/js/places.json';

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
                }

                /* Sélection aléatoire d'un fond */
                thePlace = places[Math.floor(Math.random()*places.length)];
                socket.emit("place", thePlace); // Envoie du fond choisi à la fenêtre principale
            });
        }).on('error', function(e) {
              console.log("Got error: ", e);
        });
    }

});