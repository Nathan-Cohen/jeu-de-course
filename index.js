//////////////serveur////////////////
const mongo = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').Server(app);
const PORT = process.env.PORT || 5000
app.use("/html", express.static(path.join(__dirname + "/public/html/")));
app.use("/images", express.static(path.join(__dirname + "/public/images/")));
app.use("/js", express.static(path.join(__dirname + "/public/js/")));
app.use("/css", express.static(path.join(__dirname + "/public/css/")));
app.use("/lib", express.static(path.join(__dirname + "/public/lib/jQuery")));
app.use("/socket", express.static(path.join(__dirname + "/node_modules/socket.io-client/dist/")));


    app.get('/', function(requete, reponse, next){
        reponse.sendFile('index-client.html', {root: './public/html/'});
        
    })


///////////parti websocket////////////

var socketIO = require('socket.io');
var io = socketIO(server);
var tabConnection = [];
var tableauDesJoueurs = []
var tabjoueur = [];
var tableauPerso = [];
var connexion = {connecter: false, username: ''}
function functionConstruc(id, name, avatar){
    this.id = id;
    this.name = name;
    this.avatar = avatar;
}

io.on('connection', function(socket){
    tabConnection.push(socket);

    // CONNEXION
    socket.on('name', function(data){
            var url = "mongodb://heroku_xxbnv843:m1tp1ts1p4deps3isa7f6dlcgm@ds141932.mlab.com:41932/heroku_xxbnv843";
            mongo.connect(url, {useNewUrlParser: true}, function (err, client) {
                var collection = client.db('heroku_xxbnv843').collection('joueurs');
                collection.findOne({username: data.username, password: data.password}, function(err, o) {
                    if (err) {
                        console.log(err.message);
                    }
                    else { 
                        if(o === null){
                            collection.insertOne({username: data.username, password: data.password, idUnique: data.id, date: new Date()}, function(err, o) {
                                if (err) {
                                    console.log(err.message);
                                } 
                                else{ 
                                        console.log("Nouvel utilisateur : ", data.username, data.password, data.id);
                                        connexion.connecter = true;
                                        connexion.idUnique = data.id;
                                        socket.user = data.id;
                                        tabjoueur.push(data.id)
                                        connexion.avatar = data.avatar;                                                                                              
                                        objDesJoueurs = new functionConstruc(data.id, data.username, data.avatar)
                                        tableauDesJoueurs.push(objDesJoueurs)
                                        connexion.tableauDesJoueurs = tableauDesJoueurs;
                                        connexion.username = data.username;
                                        socket.join('room')
                                        socket.emit('connection', connexion); 
                                        socket.emit('pret', {message: 'pret', connexion: connexion}); 
                                }
                            });
                        }
                        else{
                            var tabJoueurCo = []
                            var tabJoueurPasCo = []
                            // si le tableau des joueur connecter est plus grand que 0
                            if(tabjoueur.length > 0){
                                // si le tableau des joueurs est deja egal a 2 alors la parti est deja rempli
                                if(tableauDesJoueurs.length === 2){
                                    connexion.connecter = false;
                                    connexion.messageDeConnexion = "La parti est déjà prise !"
                                    socket.emit('connection', connexion); 
                                }
                                else{
                                    // boucle sur le tableau des joueurs déjà connecter si un utilisateur deja connecter a le meme nom il envoie un message d'erreur 
                                    for(var i=0; i<tableauDesJoueurs.length; i++){
                                        if(tableauDesJoueurs[i].name == data.username){
                                            tabJoueurCo.push(tableauDesJoueurs[i].name)
                                            connexion.connecter = false;
                                            connexion.messageDeConnexion = "Utilisateur déjà connecter"                                            
                                            socket.emit('connection', connexion);                                        
                                        }else{ 
                                            tabJoueurPasCo.push(tableauDesJoueurs[i].name)
                                        }
                                    }
                                    // si la boucle sur le tableau des joueurs connecter n'a pas trouver de nom deja existant
                                    if(tabJoueurCo.length < 1){
                                        console.log('bienvenue')   
                                        connexion.connecter = true;
                                        connexion.idUnique = o.idUnique;
                                        tabjoueur.push(o.idUnique)
                                        connexion.avatar = data.avatar;   
                                        objDesJoueurs = new functionConstruc(o.idUnique, data.username, data.avatar)
                                        tableauDesJoueurs.push(objDesJoueurs)
                                        connexion.tableauDesJoueurs = tableauDesJoueurs;
                                        connexion.username = data.username;
                                        socket.join('room') 
                                        console.log(tableauDesJoueurs)
                                        socket.emit('connection', connexion);                                        
                                        socket.emit('pret', {connexion: connexion}); 
                                        // socket.broadcast.emit('pret', {message: 'pret', connexion: tableauDesJoueurs[0]});                                                                             
                                    }
                                }
                            }else{
                                connexion.connecter = true;
                                connexion.idUnique = o.idUnique;
                                socket.user = o.idUnique;
                                tabjoueur.push(o.idUnique)
                                connexion.avatar = data.avatar;                                                                
                                objDesJoueurs = new functionConstruc(o.idUnique, data.username, data.avatar)
                                tableauDesJoueurs.push(objDesJoueurs)
                                connexion.tableauDesJoueurs = tableauDesJoueurs;
                                connexion.username = data.username;
                                // connexion.divJeuOffsetLeft = data.
                                socket.join('room')                           
                                socket.emit('connection', connexion);   
                                socket.emit('pret', {connexion: connexion});

                            }
                        }
                    }
                });
            });

        // fin de la parti connexion

    });
    
    // envoie le boolean true et ajoute la mise de depart a l'utilisateur
    socket.on('connecter', function(data){
        io.to('room').emit('lancement', data);                   
        
    });

    socket.on('gagnant', function(data){
        console.log('gagnant', data)
        var tempNombre = parseFloat(data.tempsEcoule)
        var url = "mongodb://heroku_xxbnv843:m1tp1ts1p4deps3isa7f6dlcgm@ds141932.mlab.com:41932/heroku_xxbnv843";
        mongo.connect(url, {useNewUrlParser: true}, function (err, client) {
            var collection = client.db('heroku_xxbnv843').collection('joueurs');
            collection.updateOne({'idUnique': data.idUnique}, {$set: {'temp': tempNombre}}, function(err, result){
                if(result){
                    io.to('room').emit('result', {message: 'Win', idUnique: data.idUnique})                  
                    // console.log('result', result)
                    
                }
                else{
                    console.log('err', err)
                }
            })

        });        
    });

    socket.on('avance', function(data){
        console.log('avance', data)
        tableauPerso.push(data);  
        io.to('room').emit('caracPerso', tableauPerso)  
    })

    socket.on('activeChrono', function(data){
        io.to('room').emit('chronometre', data)
    })

     ////////////PARTI SCORE DES JOUEURS////////////
     socket.on('demandeLesScoresDesJoueurs', function(){
        var url = "mongodb://heroku_xxbnv843:m1tp1ts1p4deps3isa7f6dlcgm@ds141932.mlab.com:41932/heroku_xxbnv843";
            mongo.connect(url, {useNewUrlParser: true}, function (err, client) {
                var collection = client.db('heroku_xxbnv843').collection('joueurs');
                collection.find().sort({ temp : 1}).toArray(function(err, result) {
                    if (err) {
                        console.log(err.message);
                    }else{
                        console.log(result)
                        socket.emit('afficheLesScoresDesJoueurs', result)
                    }
                });
            });
    });

     ////////////PARTI DECONNEXION////////////
    socket.on("disconnect", function(){
        tableauPerso = []
        tableauDesJoueurs.pop();
        tableauDesJoueurs.pop();
        socket.to('room').broadcast.emit('deconnection', socket.user)
        socket.leave('room');
    });
    
});



server.listen(PORT);