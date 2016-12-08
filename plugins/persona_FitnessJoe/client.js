/******************************************************************************
 Fitness Joe persona
*******************************************************************************/

(function() {
  'use strict';
  var persona_avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAaVBMVEWZmZlDQ0Obm5tAQEA+Pj6enp6goKCVlZU7OztLS0t1dXWIiIhgYGBSUlKPj4+CgoJISEhqampdXV1aWlpOTk5FRUU5OTmioqKRkZFycnJnZ2dlZWVjY2Ofn595eXlubm5XV1eMjIx9fX0pNPL+AAACSElEQVRYw92W2bKjMAxEJUu2CTuEJQTCkv//yLlVFw8DMQkmb9OvlA/tliwb/nOJH32zXMbBLQZ5mhH3EY6RP+lawRnJsCJkTos88/UZF6pg/BERe55fn1ifERpR2mjXAG854yKizJGg/Ar/BUSTcDQw8gpwCSQ46V7hSlXyABfpltcAzhx74OmtAVTEwgmQbAD4FPAVgB1DFAmu5fmOzezzBhBqxyrQOsNycuyDYd0HfHc9CtCUtIpAORNy/goAjywr6CTAeBgXQOU/wJ2Q8DJQEgnukg0ZQBkoOCGRGgt8ic8Q9JUWgn/CgM6XGAlzDcKtkHG4aefG4ZYSNQQXxrU4jDUo+Tl9VT+mviPCrbxLmDVJLd4vh+e97SL20CJir0qH2zuCSoqUPWbcFXutfrP3AJnwg7iXb0rP+FF8vYldA4wHVAa7KVzxiKrdGX2jQwC+78Xo4zHxzj0luoMAiuA7AFJvJwx4VIW0OmgOAy72LYzHAbHtHAx0HHCz3eklfeVAtYTHAdoCCNkBYOmk+i+ADpTxFSDAHGW+fAaMr4D6aRq9TT4D8heANFOYIi1StGuZVuGrg6yaR28vIbSn4A057QFkMEfndSAgI/sogymlnS0I8zZlXwF0NgBxo6R5NFw3AKEL8xctILYf4UEB6LlC0dZBz/M22xpEaF3/+8y57zRSanLqFEBpA7QK3gCCZV4qOVgTnI9fYQWI3PhMe/mIyLKB+3zzlNYMhGleHiVYATwJM7NsVdAGUD4lSAuAfx/by7fOAP4AojAcLR3Ak5UAAAAASUVORK5CYII=';
  var persona_name = 'Fitness Joe';
  // persona characteristics: fitness, motivational, nutrition

  // variables: <username>, <categoryname>, <search>
  var messages = {
    empty_home: {
      read: ['Hey <username>, we have nothing to show yet! People here are working hard to bring you the best content!'],
      write: [
        'Hey <username>. Seems like you are the right person to start creating some content in here!<br>Step 1: Clear your mind and try to relax!',
        'Hey <username>, seems like there is no content here yet! You are the person to start fixing this! If you have an idea start adding you content. Otherwise I advise a small walk outside to clear your mind, this works miracles on me!'
      ],
    },
    empty_category_article: {
      read: ['Hey, no articles here yet. Users will add meaningful articles later on so consider paying a visit later!'],
      write: ['Hey <username>, do you have a nice thought or idea to share in here? Writing something that people will find interesting gives a great sense of accomplishment!'],
    },
    empty_category_thread: {
      read: ['Hey <username>, no discussions here yet. You can visit again later or <b>login and add a thread</b>!'],
      write: ['Hey <username>, no discussions here yet. Sharing an idea is not like writing it on a stone or something! Work with others to mold an idea into something great!'],
    },
    empty_category_blog: {
      read: ['Hey <username>, no blogposts here yet. Visit again later for updates, in the meantime get up from your chair to stretch and relax your eyes.'],
      write: ['Hey, noone has added a blogpost here yet. You can be the first to <b>add a good blogpost</b>, <username>!'],
    },
    empty_category_channel: {
      read: ['No chats in here yet. Could be because people are currently away or never made it in here :). Consider coming back later!'],
      write: ['No chats in here yet <username>. But you can change that! Pick your topic and <b>add a chat</b> in here!'],
    },
    empty_category: {
      read: ['Noone has added content here yet. But people are working hard to populate this category! Be sure to come back later!'],
      write: ['Hey <username>, seems <categoryname> is in need of content! I know you can do it so I&#39;ll help you out on this! Start by thinking what is perfectly described by <categoryname>.'],
    },
    empty_article: {
      read: ['Hey, this is awkward! A single title! Please visit again later to see if the story is updated'],
      write: ['Hey <username>, seems like someone forgot to add the actual story in here. That didn&#39;t stop you from entering so you probably are the right person to share your thoughts on this subject!'],
    },
    empty_thread: {
      read: ['Hey, this is awkward! A single title! You can visit again later or walk the extra mile and login to share your own thought! You visited this page for a reason right?'],
      write: ['Hey <username>, seems like someone forgot to add the actual story in here. That didn&#39;t stop you from entering so you probably are the right person to share your thoughts on this subject!'],
    },
    empty_blog: {
      read: ['Hey, this is awkward! A single title! Please visit again later to see if the story is updated'],
      write: ['Hey <username>, seems like someone forgot to add the actual story in here. That didn&#39;t stop you from entering so you probably are the right person to share your thoughts on this subject!'],
    },
    empty_channel: {
      read: [
        'I&#39;m the only one here! Take your time and wonder around! I&#39;m pretty sure people will come here later.',
        'Hey there it&#39;s Fitness Joe! Seems like you came here for a reason. Login and start chatting!'
      ],
      write: [
        'Hey <username>, Joe here! Since we are alone, I&#39;ve got a small tip for you: Do not ever forget to drink water! For real this single thing can do miracles for your body!',
        'Hello <username>, Fitness Joe here. I know you came to say something and found noone here. Start typing your thought and people will follow!'
      ],
    },
    no_search_results: {
      read: [
        'Sorry <b><username></b>, but no results found for <b><search></b>',
        'No results found for <b><search></b>.<br>You can try using a different search term'
      ],
      write: [
        'No results found for <b><search></b>',
        'No results for <b><search></b>,<br>please consider using a different search term'
      ],
    },
    type_to_search: {
      read: [
        'Type your search to find answers',
        'Start by typing your search. Did you know you can search on tags by typing <b>#tag</b>, like <i>#bug</i>?'
      ],
      write: [
        'Type your search to find your answers',
        'Start by typing your search. Did you know you can search on tags by typing <b>#tag</b>, like <i>#bug</i>?'
      ],
    },
    not_found: {
      topic: [
        'Sorry <b><username></b>, topic not found!'
      ],
      text: [
        'Seems like somebody gave you a wrong link. Don&#39;t give up!<br>Try searching for something similar or return <a class="fruum-link" href="javascript:;" data-navigate="home">Home</a>.'
      ],
    },
    private_forum: {
      topic: [
        'Sorry <b><username></b>, this is a private area!'
      ],
      text: [
        'If somebody gave you that link, you can tell him that you have a permission problem accessing that topic.'
      ],
    },
    idle: {
      read: [],
      write: [],
    },
  };

  var defaults = {
    avatar_initials: 'JOE',
    avatar_url: persona_avatar,
    name: persona_name,
    default_username: 'guest',
  };

  window.Fruum.plugins.push(function() {
    var _ = window.Fruum.libs._;

    this.personaSays = function(payload) {
      var perm = payload.permission || 'read',
          action = messages[payload.action];
      if (payload.action == 'not_found' || payload.action == 'private_forum') {
        return _.extend({
          topic: action.topic[_.random(0, action.topic.length - 1)],
          text: action.text[_.random(0, action.text.length - 1)],
        }, defaults);
      }
      if (action && action[perm] && action[perm].length) {
        var entries = action[perm];
        var entry = entries[_.random(0, entries.length - 1)];
        return _.extend({ text: entry }, defaults);
      }
    };
  });
})();
