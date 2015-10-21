/******************************************************************************
Emoji support
*******************************************************************************/

(function() {
  'use strict';

  function escape_re(re) {
    return re.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  window.Fruum.emoji = {
    symbols: {
      ':wide-smile:': 'wide-smile',
      ':D': 'wide-smile',
      ':P': 'stuck-out-tongue',
      ':stuck-out-tongue:': 'stuck-out-tongue',
      ':tongue-out:': 'stuck-out-tongue',
      ':(': 'sad-face',
      ':sadface:': 'sad-face',
      'xO': 'astonished',
      ':astonished:': 'astonished',
      ':smiling-eyes-grinning:': 'smiling-eyes-grinning',
      ':tears-of-joy:': 'tears-of-joy',
      ':smiling-open-mouth:': 'smiling-open-mouth',
      ':smiling-eyes-n-open-mouth:': 'smiling-eyes-n-open-mouth',
      ':smiling-mouth-w-sweat:': 'smiling-mouth-w-sweat',
      ':smiling-mouth-tight-eyes:': 'smiling-mouth-tight-eyes',
      'xD': 'smiling-mouth-tight-eyes',
      ':angel-smile:': 'angel-smile',
      ':devil-smile:': 'devil-smile',
      ':yummy-delicious:': 'yummy-delicious',
      ':smiling-heart-eyes:': 'smiling-heart-eyes',
      ':)': 'smiling-mouth-smiling-eyes',
      ':cool:': 'cool',
      ':neutral:': 'neutral',
      ':all-neutral:': 'all-neutral',
      ':confused:': 'confused',
      ':kissing:': 'kissing',
      ':throw-a-kiss:': 'throw-a-kiss',
      ':smiling-kiss:': 'smiling-kiss',
      ':smirking:': 'smirking',
      ':bored:': 'bored',
      ':cold-sweat:': 'cold-sweat',
      ':deep-thought:': 'deep-thought',
      ':confounded:': 'confounded',
      ':relieved:': 'relieved',
      ':winking:': 'winking',
      ';)': 'winking',
      ';P': 'wink-out-tongue',
      ':wink-out-tongue:': 'wink-out-tongue',
      ':closed-eyes-out-tongue:': 'closed-eyes-out-tongue',
      'xP': 'closed-eyes-out-tongue',
      ':worried:': 'worried',
      ':angry:': 'angry',
      ':redface-angry:': 'redface-angry',
      ':crying:': 'crying',
      ':stand-strong:': 'stand-strong',
      ':triumphant:': 'triumphant',
      ':so-close-yet:': 'so-close-yet',
      ':frowning-open-mouth:': 'frowning-open-mouth',
      ':anguish:': 'anguish',
      ':fearful:': 'fearful',
      ':weary:': 'weary',
      ':sleepy:': 'sleepy',
      ':tired:': 'tired',
      ':show-teeth:': 'show-teeth',
      ':8': 'show-teeth',
      ':crying-loud:': 'crying-loud',
      ':open-mouth:': 'open-mouth',
      ':O': 'open-mouth',
      ':I': 'hushed',
      ':|': 'hushed',
      ':hushed:': 'hushed',
      ':cold-sweat-fear:': 'cold-sweat-fear',
      '8O': 'screaming-fear',
      ':screaming-fear:': 'screaming-fear',
      ':/': 'flushed',
      ':flushed:': 'flushed',
      ':z': 'sleeping',
      ':sleeping:': 'sleeping',
      ':dizzy:': 'dizzy',
      ':no-mouth:': 'no-mouth',
      ':surgery:': 'doctor',
      ':doctor:': 'doctor',
      ':fist:': 'fist',
      ':hi-five:': 'hi-five',
      ':victory:': 'victory'
    },
    convert: function(input) {
      return input.replace(window.Fruum.emoji.re, function(all, emoji) {
        if (window.Fruum.emoji.symbols[emoji]) {
          return all.replace(emoji, '<span data-fruumemoji="' + window.Fruum.emoji.symbols[emoji] + '"></span>');
        }
        return all;
      });
    }
  }
  var keys = [];
  for (var key in window.Fruum.emoji.symbols) {
    keys.push(escape_re(key));
  }
  window.Fruum.emoji.re = RegExp('(?:^|\\s)(' + keys.join('|') + ')', 'g');
})();
