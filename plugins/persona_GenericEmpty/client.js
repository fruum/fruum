/******************************************************************************
 Empty states (persona default)
*******************************************************************************/

(function() {
  'use strict';
  var persona_avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA+lpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAxNi0wMS0yNVQwOToxNTozMiswMjowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTYtMDktMDJUMDY6MzY6MjIrMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTYtMDktMDJUMDY6MzY6MjIrMDM6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkU4MDM3NkVGNjhGQjExRTY5QUFEODY2QjQyRDk0NzRDIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkU4MDM3NkYwNjhGQjExRTY5QUFEODY2QjQyRDk0NzRDIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6RTgwMzc2RUQ2OEZCMTFFNjlBQUQ4NjZCNDJEOTQ3NEMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RTgwMzc2RUU2OEZCMTFFNjlBQUQ4NjZCNDJEOTQ3NEMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5ohObbAAAAGFBMVEWKiop3d3eEhISWlpaRkZF9fX10dHSZmZnPHIhgAAAAY0lEQVR42uzUwQrAMAgD0Fib7P//ePch3dZethKPIg8RFcdiwIABAxsDFMvSOl8Akkqgzhsw8Flg+Rb8UAwY2APInmtAUxB4oVyB0DB4C4Bj4sEQs6MxYrYDL5IBA78FTgEGAJmsbvJo4OB5AAAAAElFTkSuQmCC";

  // variables: <username>, <categoryname>, <search>
  var messages = {
    empty_home: {
      read: ['Sorry <username>, nothing to show here yet, please visit again later',],
      write: [
        'No content to display here yet. You can create categories and articles by using the actions below.',
        'Nothing to show here, <username>. You can populate this page using the actions at the bottom.'
      ],
    },
    empty_category_article: {
      read: ['Sorry, no articles here yet. Users will be adding articles so consider paying a visit later.'],
      write: ['Hello <b><username></b>, you can be the first writing an article here.'],
    },
    empty_category_thread: {
      read: ['Hello <username>, no discussions here yet. You can visit again later or <b>login and add a thread</b>!'],
      write: ['Hello <username>, no discussions here yet. You can start a discussion using the actions below.'],
    },
    empty_category_blog: {
      read: ['Hello <username>, no blogposts here yet. Visit again later for updates.'],
      write: ['Hello, noone has added a blogpost here yet. You can be the first to <b>add a good blogpost</b>, <username>!'],
    },
    empty_category_channel: {
      read: ['No chats added here yet. Consider coming back later!'],
      write: ['No chats in here yet <username>. You can pick your topic and <b>add a chat</b>.'],
    },
    empty_category: {
      read: ['Noone has added content here yet. Please visit later for updates.'],
      write: ['Hello <username>, seems <categoryname> has no content yet.<br>You can contribute with your thoughts and ideas on <b><categoryname></b>.'],
    },
    empty_article: {
      read: ['This is awkward! A single title! Please visit again later to see if the story is updated.'],
      write: ['Hello <username>, seems like someone forgot to add the actual story in here.You can share your thoughts on the matter or visit again later to see any updates.'],
    },
    empty_thread: {
      read: ['This is awkward! A single title! You can visit again later or login to share your own thoughts!'],
      write: ['Hello <username>, seems like someone forgot to add the actual story in here. You can share your thoughts or visit again later to see any updates.'],
    },
    empty_blog: {
      read: ['Hello, this is awkward! A single title! Please visit again later to see if the story is updated.'],
      write: ['Hello <username>, seems like someone forgot to add the actual story in here. If you have something to share, start typing!'],
    },
    empty_channel: {
      read: [
        'I&#39;m the only one here! Take your time and wonder around! I&#39;m pretty sure people will come later.'
      ],
      write: [
        'Hello <username>, I see you came to say something and found noone here. Start typing your thought and people will follow!'
      ],
    },
    no_search_results: {
      read: [
        'Sorry <b><username></b>, but no results found for <b><search></b>',
        'No results found for <b><search></b>.<br>You can try using a different search term.'
      ],
      write: [
        'No results found for <b><search></b>',
        'No results for <b><search></b>,<br>please consider using a different search term.'
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
        'Seems like somebody gave you a wrong link.<br>Try searching for something similar or return <a class="fruum-link" href="javascript:;" data-navigate="home">Home</a>.'
      ]
    },
    private_forum: {
      topic: [
        'Sorry <b><username></b>, this is a private area!'
      ],
      text: [
        'If somebody gave you that link, you can tell him that you have a permission problem accessing that topic.'
      ]
    },
    idle: {
      read: [],
      write: [],
    },
  }

  var defaults = {
    default_username: 'guest',
    avatar_url: persona_avatar,
  }


  window.Fruum.plugins.push(function () {
    var _ = window.Fruum.libs._;

    this.personaSays = function(payload) {
      var perm = payload.permission || 'read',
          action = messages[payload.action];
      if (payload.action == 'not_found' || payload.action == 'private_forum') {
        return _.extend({
          topic: action.topic[_.random(0, action.topic.length - 1)],
          text: action.text[_.random(0, action.text.length - 1)]
        }, defaults);
      }
      if (action && action[perm] && action[perm].length) {
        var entries = action[perm];
        var entry = entries[_.random(0, entries.length - 1)];
        return _.extend({ text: entry }, defaults);
      }
    }
  });
})();
