/******************************************************************************
 Rebecca Blue persona
*******************************************************************************/

(function() {
  'use strict';
  var persona_avatar = 'data:image/png;base64,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';
  var persona_name = 'Rebecca Moon';
  // persona characteristics: sensitive, romantic, emotional, cute, book-reader

  // variables: <username>, <categoryname>, <search>
  var messages = {
    empty_home: {
      read: ['Hi <username>! Some people are writing nice thoughts to warm this place up :)'],
      write: [
        'Hi <username>, would love to see your thoughts expressed here!',
        'Hi <username>, you are the one that can bring some life in here! <b>Start writing amazing ideas and thoughts</b>!'
      ],
    },
    empty_category_article: {
      read: ['Hi, unfortunately there are no articles here yet. Please come back later!'],
      write: ['Hi <username>, no articles in here yet but we can change that can&#39;t we?<br><b>Add the first article of <categoryname>!</b>'],
    },
    empty_category_thread: {
      read: ['Hi <username>, no one has started a discussion in here yet. Hey! you could <b>login and share your thoughts now!</b>'],
      write: ['Hi <username>, no discussions here yet. You could <b>add a thread</b> here!'],
    },
    empty_category_blog: {
      read: ['Hi, people haven&#39;t added any blogpost in <categoryname>! Please do visit again for any updates!'],
      write: ['<categoryname> seems so empty with no blogposts. You can <b>add a blogpost</b> in here <username>!'],
    },
    empty_category_channel: {
      read: ['Empty, so sad! I wish this place was full of activity but that&#39;s not the case now.<br>You can visit again later, sorry!'],
      write: ['It&#39;s sad when no one is talking <username>.<br>Please consider <b>adding the first channel</b> in <categoryname>! People will come for sure!'],
    },
    empty_category: {
      read: ['This looks like a category in the making! Please consider revisiting later when content will be available, sorry.'],
      write: ['Hi <username>, I think we can add some nice things in here for &quot;<categoryname>&quot;'],
    },
    empty_article: {
      read: ['Hi... this is not good really!<br>I&#39;ll inform people in here to fix this!'],
      write: ['Oups <username>!<br>Here should be a really interesting article instead of me blubbing! Please consider <b>adding the actual article or deleting it</b>!'],
    },
    empty_thread: {
      read: ['Hi <username>, this doesn&#39;t look right!'],
      write: ['Hi <username>, nothing to read in here. If you came to <b>write your thought</b> this is great!'],
    },
    empty_blog: {
      read: ['Hi, don&#39;t know if this is normal :(<br>Someone forgot to add a proper description so we&#39;re left with a topic title!'],
      write: ['Hi <username>, no description set for this topic! But that&#39;s ok!<br>You can help by <b>writing the first reply</b>!'],
    },
    empty_channel: {
      read: [
        'Hi <username>! No one is chatting here at the moment!<br>Why not <b>login</b> and start typing?',
        'Hi, we&#39;re the only ones here! I would recommend some time away from the screen, grab a book instead :)'
      ],
      write: [
        'Hi! No one here yet, why not sparkle the talk yourself <username>?',
        'Hi! This is a great chance to set a good talk topic here <username>!<b>Post the first idea in <categoryname>!</b>',
        'Hi <username>, I&#39;d recommend coming back in a while since no one is here yet!'
      ],
    },
    no_search_results: {
      read: [
        'Oups! No results found for <b><search></b>!<br>I suggest we try rephrasing the search term :)',
        'Nothing found for <b>search</b>.<br>Sorry for the inconvenience <username>!'
      ],
      write: [
        'No results found for <b><search></b>',
        'No results for <b><search></b>,<br>please consider using a different search term'
      ],
    },
    type_to_search: {
      read: [
        'Start typing your search',
        'Hi, type your search to start searching for relevant data.'
      ],
      write: [
        'Type your search to find your answers',
        'Type your search above.<br>Hey! Search for a specific content by typing <b>type:thread|article|blog|post</b>.<br><i>example, &quot;type:article favorite books&quot;</i>'
      ],
    },
    not_found: {
      topic: [
        'Whoopsie! This is not a topic!'
      ],
      text: [
        'Hi <b><username></b>, this link is not working. I suggest we head back <a class="fruum-link" href="#" data-navigate="home">home</a>'
      ],
    },
    private_forum: {
      topic: [
        'This is private sorry <b><username></b>!'
      ],
      text: [
        'I&#39;m really sorry, but you don&#39;t have permissions to view the content in here.'
      ],
    },
    idle: {
      read: [],
      write: [],
    },
  };

  var defaults = {
    avatar_initials: 'REM',
    avatar_url: persona_avatar,
    name: persona_name,
    default_username: 'friend',
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
