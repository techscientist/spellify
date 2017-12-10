$(document).ready(function() {
    var UPLOAD_IMG = $('#uploadBtn');
    var BTN_CONTAINER = $('#btnContainer');

    var WORDS = [];

    var WORD_INDEX = 0;

    var SPEAKER = null;

    var sentence_example;

    var sentences = {};

    // Greet user.
    speak('Welcome to Spellify! Please upload your spelling answer key to continue.');



    UPLOAD_IMG.click(function() {
        $("#fileInput").click();
    });

    $("#fileInput").change(function() {
        //get file object
        var file = document.getElementById('fileInput').files[0];

        if (file.type !== "application/pdf") {
            alert("Please upload a PDF file.");
            return;
        }


        if (file) {
            // POST to server
            console.log('Sending to server...');
            var data;

            data = new FormData();
            data.append('document', file);

            $.ajax({
                url: '/uploadDocument',
                data: data,
                async: true,
                cache: false,
                contentType: false,
                processData: false,
                type: 'POST',
                success: function(data) {
                    if (data.success) {
                        console.log('File upload successfull!');
                        if (data.words) {
                            loadWords(data.words);
                        }
                        else {
                            console.log('Did not find any words!');
                            alert('Spellify was unable to extract any words from the document. Sorry for the inconvenience.');
                            return;
                        }
                    }
                    else {
                        console.log('File upload was NOT successfull!');
                        alert('File upload was unsuccessful. Please refresh the page to try again.');
                        return;
                    }
                    console.log(data);
                    return;
                }
            });
        }
    });



    function speak(something, cb) {
        if (!SPEAKER) {
            SPEAKER = new SpeechSynthesisUtterance();
            SPEAKER.lang = 'en-US';

        }
        SPEAKER.onend = function(event) {
            console.log('Speech complete');
            if (cb)
                cb();
        }
        SPEAKER.text = something.trim();
        speechSynthesis.speak(SPEAKER);
        console.log('Speaking: ' + something.trim());
    }

    function loadWords(resp) {
        console.log('Loading ' + resp.length + ' words...');

        for (var i in resp) {
            WORDS.push(resp[i]);
        }

        console.log(WORDS);

        // Remove the upload icon
        BTN_CONTAINER.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
            BTN_CONTAINER.remove();
            console.log("Removed upload icon.");
        });

        BTN_CONTAINER.removeClass("animated fadeInUp");
        BTN_CONTAINER.addClass("animated flipOutY");


        var Label = $('#lbl');

        Label.animate({
            marginTop: '40px'
        }, 1000, function() {
            console.log('Moved the label.');
        });


        Label.text('Loaded ' + WORDS.length + ' words.');

        // Put up the control icons.
        console.log('Adding the controls...');
        var CONTROLS = $('<div id="controller" class="animated zoomInUp center noselect"></div>');
        CONTROLS.appendTo('body');

        var PREVIOUS_BTN = $('<div class="animated zoomInLeft media-element-special-left"><img id="prev-btn" src="/img/Prev.png" style="width:25px;"></div>');
        PREVIOUS_BTN.appendTo('#controller');

        PREVIOUS_BTN.click(function() {
            console.log('Previous.');
            WORD_INDEX -= 1;
            showWordStatus(WORD_INDEX);
        });

        var PLAY_BTN = $('<div class="animated zoomInLeft media-element"><img id="play-btn" src="/img/play.png" style="width:25px;"></div>');
        PLAY_BTN.appendTo('#controller');

        PLAY_BTN.click(function() {
            console.log('Play');
            showWordStatus(WORD_INDEX);
        });

        var PAUSE_BTN = $('<div class="animated zoomInLeft media-element"><img id="pause-btn" src="/img/pause.png" style="width:25px;"></div>');
        PAUSE_BTN.appendTo('#controller');

        PAUSE_BTN.click(function() {
            console.log('Pause');
            pause();
        });

        var NEXT_BTN = $('<div class="animated zoomInLeft media-element-special-right"><img id="next-btn" src="/img/next.png" style="width:25px;"></div>');
        NEXT_BTN.appendTo('#controller');

        NEXT_BTN.click(function() {
            console.log('Next');
            WORD_INDEX += 1;
            showWordStatus(WORD_INDEX);
        });

        // Also add the 'Hear the word in a sentence' label
        var SENTENCE_LBL = $('<div id="lbl" class="pin noselect animated fadeInUp" style="cursor:pointer; text-decoration: underline; margin-top:60px;">Hear the word in a sentence.</div>');
        SENTENCE_LBL.appendTo("body");
        SENTENCE_LBL.click(function() {
            speakSentenceExample(WORDS[WORD_INDEX]);
        });

        /*  var REPEAT_BTN = $('<div class="animated zoomInLeft media-element"><img id="repeat-btn" src="/img/Repeat.png" style="width:25px;"></div>');
          REPEAT_BTN.appendTo(CONTROLS);*/

        console.log('Added the controls!');

        speak("Great! Let's start!", function() {
            showWordStatus(WORD_INDEX);
        });

    }

    function pause() {
        if (SPEAKER) {
            try {
                SPEAKER.cancel();
                console.log('Speech cancelled.');
            }
            catch (e) {
                console.log('ERROR! ' + e);
            }
        }
    }

    function getGetOrdinal(n) {
        var s = ["th", "st", "nd", "rd"],
            v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function showWordStatus(index) {
        WORD_INDEX = index;

        console.log('Showing word (index= ' + WORD_INDEX);

        var word = WORDS[WORD_INDEX];
        if (word) {
            word = word.trim();
            console.log('Word: ' + word);

            if (index === (WORDS.length - 1)) {
                speak(getPrompt(word, WORD_INDEX), function() {
                    speak("Congratulations! We're done!");
                    return;
                });
                return;
            }
            speak(getPrompt(word, WORD_INDEX));
        }
        else {
            console.log('Word does not exist. Starting from the beginning!');
            showWordStatus(0); //Start from the beginning.
        }
    }

    function speakSentenceExample(word) {
        if (!word)
            return;

        if (sentences[word]) {
            // Already stored in memory.
            sentence_example = sentences[word];
            var rannum = _.random(0, 5);

            if (rannum === 0) {
                speak('Here you go. ' + sentence_example);
                return;
            }
            if (rannum === 1) {
                speak(sentence_example);
                return;
            }
            if (rannum === 2) {
                speak('OK. ' + sentence_example);
                return;
            }
            if (rannum === 3) {
                speak("Here's one. " + sentence_example);
                return;
            }

            if (rannum === 4) {
                speak("Here's one I could think of. " + sentence_example);
                return;
            }

            if (rannum === 5) {
                speak('Hope this helps. ' + sentence_example);
                return;
            }
            return;
        }

        word = word.trim();
        console.log('Getting an example sentence for: ' + word);
        var url = 'https://api.wordnik.com/v4/word.json/' + word + '/examples?includeDuplicates=false&useCanonical=false&skip=0&limit=1&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';

        var jqxhr = $.getJSON(url, function(data) {
                console.log("successful request");
                console.log(data);

                if (data) {
                    if (data.examples) {
                        sentence_example = data.examples[0].text.replace(/\*/g, '').trim();
                        console.log('Sentence example: ' + sentence_example);
                        sentences[word] = sentence_example;
                        var rannum = _.random(0, 5);

                        if (rannum === 0) {
                            speak('Here you go. ' + sentence_example);
                            return;
                        }
                        if (rannum === 1) {
                            speak(sentence_example);
                            return;
                        }
                        if (rannum === 2) {
                            speak('OK. ' + sentence_example);
                            return;
                        }
                        if (rannum === 3) {
                            speak("Here's one. " + sentence_example);
                            return;
                        }

                        if (rannum === 4) {
                            speak("Here's one I could think of. " + sentence_example);
                            return;
                        }

                        if (rannum === 5) {
                            speak('Hope this helps. ' + sentence_example);
                            return;
                        }

                        return;
                    }
                    else {
                        console.log("error: no data.examples");
                        speak('Unfortunately, I could not retreive an example sentence. Sorry, but try your best!');
                        return;
                    }
                }
                else {
                    console.log("error: no data");
                    speak('Unfortunately, I could not retreive an example sentence. Sorry, but try your best!');
                    return;
                }
            })
            .done(function() {
                console.log("Request complete.");
            })
            .fail(function() {
                console.log("error");
                speak('Unfortunately, I could not retreive an example sentence. Sorry, but try your best!');
            });

    }


    function getPrompt(word, index) {
        var num = _.random(0, 4);

        if (index + 1 === WORDS.length) {
            // Last word
            if (num === 1)
                return 'Your last word is: ' + word;

            if (num === 0)
                return 'Last word is: ' + word;

            return word;
        }

        if (index === 0 && num === 0) {
            return 'The first word is: ' + word;
        }


        if (num === 0) {
            return 'Number ' + (index + 1) + ': ' + word;
        }

        if (num === 1) {
            return word;
        }

        if (num === 3 || num === 2) {
            return 'The ' + getGetOrdinal(index + 1) + ' word is: ' + word;
        }

        if (num === 4) {
            return 'The word is: ' + word;
        }

    }


});