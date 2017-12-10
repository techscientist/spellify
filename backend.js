var shortId = require('shortid');

var busboy = require('connect-busboy');

var fs = require("fs");

var favicon = require('serve-favicon');


var inspect = require('eyes').inspector({
    maxLength: 20000
});
var pdf_extract = require('pdf-extract');

var options = {
    type: 'text' // extract the actual text in the pdf file
}


// Express
var express = require('express');
var app = express();

var path = require("path");

app.configure(function() {
    app.use(busboy());
    app.use(express.static(__dirname + '/client'));
    app.use(favicon(__dirname + '/client/img/SpellifyFavicon.ico'));
});



/**
 * Home page.
 * */
app.get('/', function(req, res) {
    console.log(new Date() + ": Received a new request.");
    res.sendFile(path.join(__dirname + '/client/index.html'));
});

/**
 * Receive the uploaded answer key.
 * */
app.post('/uploadDocument', function(req, res) {

    var serverPath;
    var fstream;

    req.pipe(req.busboy);

    req.busboy.on('file', function(fieldname, file, filename) {
        console.log("Storing: " + filename);

        serverPath = __dirname + '/documents/' + filename;
        console.log("Path: " + serverPath);

        fstream = fs.createWriteStream(serverPath);
        file.pipe(fstream);
        fstream.on('close', function() {
            var processor = pdf_extract(serverPath, options, function(err) {
                if (err) {
                    return console.log(err);
                }
            });
            processor.on('complete', function(data) {
                var text = data.text_pages[0];
                console.log(data);
                console.log(text);

                var lines = text.match(/^.*((\r\n|\n|\r)|$)/gm);
                console.log('Reading lines...');

                var RES = {
                    success: true,
                    words: []
                };
                for (var i in lines) {
                    var txtline = lines[i].trim();
                    if (txtline.length === 0) {
                        // Line is empty!
                    }

                    if (txtline.match(/Spelling - Unit(.*)/igm) || txtline.match(/Name(.*)Date/igm) || txtline.match(/Unit (.*) Answer Key/igm) || txtline.match(/(.*)All rights reserved(.*)/igm) || txtline.match(/(.*)copying or distributing without(.*)/igm)) {
                        console.log("Ignored line!");
                    }
                    else {
                        var numberRegex = /\d+./igm;
                        var clearSpaceRegex = / +/igm;
                        txtline = txtline.replace(numberRegex, '');
                        txtline = txtline.replace(clearSpaceRegex, ",,");

                        txtline = txtline.replace(",,", '');
                        txtline = txtline.trim();

                        console.log('NEW TEXT: ' + txtline);
                        console.log();

                        if (txtline.match(/(.*),,Review,,Words/igm)) {
                            // The text contains the label: 'Review Words'
                            console.log("The text contains the label: 'Review Words'");
                            txtline = txtline.replace(',,Review,,Words', '').trim();
                            console.log('The word in this case is: ' + txtline);
                            RES.words.push(txtline);
                        }
                        else {

                            var words = txtline.split(',,');
                            console.log('Words:');
                            console.log(words);
                            if (!(words.length == 0 || words[0] == '')) {
                                for (var i in words) {
                                    RES.words.push(words[i]);
                                }
                            }
                        }

                        console.log(txtline);
                    }

                }
                console.log(RES.words);
                res.send(RES);
                RES = null;

                // Delete the file.
                fs.unlink(serverPath, function(err) {
                    if (err) console.log('Error when deleting file: ' + err);
                    console.log('successfully deleted: ' + serverPath);
                });
            });
            processor.on('error', function(err) {
                //  inspect(err, 'error while extracting pages');
                console.log(err);
                res.send({
                    success: false
                });
            });

        });

    });

    console.log('Done!');
    /*
    var serverPath = __dirname + '/documents/' + req.files.spellingFile.name;

    require('fs').rename(
        req.files.spellingFile.path, serverPath,
        function(error) {
            if (error) {
                console.log('Error: ' + error);
                res.send({
                    success: false,
                    error: 'An error occured!'
                });
                return;
            }

            // TODO Process the file and extract information.


            res.send({
                success: true,
                path: serverPath
            });
        }
    ); */
});


// Start server
var server = app.listen(process.env.PORT, process.env.IP, function() {
    var addr = server.address();
    console.log('Spellify server has initialized!');
    console.log('Listening at: ' + addr.address + ' , PORT: ' + addr.port);
});


/**
 * Generate a unique short id.
 */
function gen_id() {
    return shortId.generate();
}
