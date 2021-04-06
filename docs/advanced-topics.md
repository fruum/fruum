# Extending the backend using drivers

Fruum uses drivers to drive a set of operations concerning storage, authentication, cache and email.

A developer can create custom implementations to hook several data
bases and systems based on a specific server stack.

This section is a primer on how to do this for each driver type.

# Writing storage drivers

By default, fruum comes with an elasticsearch storage driver. Potential examples for this driver could be MySQL, Postgres or MongoDB integrations.

To create a new storage driver do the following:

Create a new file under `server/backends/storage/` e.g `server/backends/storage/mystorage.js`

Add the basic code that inherits the master interface for this driver:

```
'use strict';

var _ = require('underscore'),
    Base = require('./base');

function MyStorage(options) {
  _.extend(this, new Base(options));
}
module.exports = MyStorage;
```

Change the `config.json` and declare to use your driver, e.g.

```
{
  ...
  "storage_engine": "mystorage",
  ...
}
```

Start overriding the default methods of the driver, e.g.

```
'use strict';

var _ = require('underscore'),
    Base = require('./base');

function MyStorage(options) {
  _.extend(this, new Base(options));

  this.setup = function() {
    // my setup code
  };
}
module.exports = MyStorage;
```

See a list of overridable methods by viewing the source.

# Writing authentication drivers

By default, fruum comes with remote authentication driver. Potential examples for this driver could be using Passport for authentication.

To create a new authentication driver do the following:

Create a new file under `server/backends/auth/` e.g `server/backends/auth/myauth.js`

Add the basic code that inherits the master interface for this driver:

```
'use strict';

var _ = require('underscore'),
    Base = require('./base');

function MyAuth(options) {
  _.extend(this, new Base(options));
}
module.exports = MyAuth;
```

Change the `config.json` and declare to use your driver, e.g.

```
{
  ...
  "auth_engine": "myauth",
  ...
}
```

Start overriding the default methods of the driver, e.g.

```
'use strict';

var _ = require('underscore'),
    Base = require('./base');

function MyAuth(options) {
  _.extend(this, new Base(options));

  this.authenticate = function(application, user_payload, callback) {
    callback();
  }
}
module.exports = MyAuth;
```

See a list of overridable methods by viewing the source.

# Writing email drivers

By default, fruum comes with mandrill, mailgun and a generic SMTP email driver. Other examples could be Sendgrid or gmail drivers.

To create a new email driver do the following:

Create a new file under `server/backends/email/` e.g `server/backends/email/myemail.js`

Add the basic code that inherits the master interface for this driver:

```
'use strict';

var _ = require('underscore'),
    Base = require('./base');

function MyEmail(options) {
  _.extend(this, new Base(options));
}
module.exports = MyEmail;
```

Change the config.json and declare to use your driver, e.g.

```
{
  ...
  "email_engine": "myemail",
  ...
}
```

Start overriding the default methods of the driver, e.g.

```
'use strict';

var _ = require('underscore'),
    Base = require('./base');

function MyEmail(options) {
  _.extend(this, new Base(options));

  this.send = function(application, user, message, callback) {
    callback();
  }
}
module.exports = MyEmail;
```

See a list of overridable methods by viewing the source.

# Writing cache drivers

By default, fruum comes with simple memory storage cache. Examples for this could be redis or memcached integrations.

To create a new cache driver do the following:

Create a new file under `server/backends/cache/` e.g `server/backends/cache/mycache.js`

Add the basic code that inherits the master interface for this driver:

```
'use strict';

var _ = require('underscore'),
    Base = require('./base');

function MyCache(options) {
  _.extend(this, new Base(options));
}
module.exports = MyCache;
```

Change the config.json and declare to use your driver, e.g.

```
{
  ...
  "cache_engine": "mycache",
  ...
}
```

Start overriding the default methods of the driver, e.g.

```
'use strict';

var _ = require('underscore'),
    Base = require('./base');

function MyCache(options) {
  _.extend(this, new Base(options));

  this.put = function(key, value) {};
}
module.exports = MyCache;
```

See a list of overridable methods by viewing the source.

# Plugin development guide

Plugins are divided in two categories, server and client plugins.

Server plugins run in the node.js server and are able to modify content, send notifications or implement user commands.

On the other side, client plugins are loaded in the browser and can modify the output of the content, e.g. convert image links to actual images, replace youtube links with youtube embedded video etc.

Plugins are located under the `plugins/` folder and follow the structure:

```
plugins/
  <name>/
    /server.js
    /client.js
    /template.html
```

A plugin can be either server side, client side or both. This is defined by the existence of the server.js or client.js files.

In order for a plugin to be used by the system, it must be defined in `config.json`, for example:

```
{
  ...
  "plugins": [
    "myplugin"
    ...
  ]
  ...
}
```

## Server plugins

Server plugins work like node.js modules. Under the server.js file define a module using:

```
function MyPlugin(options) {
}
module.exports = MyPlugin;
```

For a list of methods that can be implemented, check the [reference](https://github.com/fruum/fruum/blob/master/plugins/reference/server.js) plugin.

Also a good example is the [giphy plugin](https://github.com/fruum/fruum/tree/master/plugins/giphy), which implements a user command such as `/giphy hello`.

## Client plugins

Client plugins follow a different initialization structure as they run in the fruum client code. The client.js file, defines a list of methods to implement and the optional template.html file, define [underscore templates](http://underscorejs.org/) that can be used by the plugin.

The basic code for the client.js file is:

```
(function() {
  'use strict';
  window.Fruum.plugins.push(function () {
  });
})();
```

For a list of methods that can be implemented, check the [reference plugin](https://github.com/fruum/fruum/blob/master/plugins/reference/client.js).

Also a good example is the [youtube plugin](https://github.com/fruum/fruum/tree/master/plugins/youtube), which replaces youtube links with video.

# Theme customization

Fruum comes with a default theme. Themes are built in SASS language with certain parts being overridable.

To change the default theme of a forum (application) use the following command:

```
npm start -- --update-app <appid> --theme <theme>
```

Theme parameter can be one of the following:

- theme:<file>: a sass file located under the `theme/` folder
- URL: a sass file located on a remote host

Examples:

```
npm start -- --update-app myforym --theme "theme:dark"
```

will load a theme located under the `themes/dark.scss` file, whereas

```
npm start -- --update-app myforym --theme "http://myawesomeapp.com/theme/dark.scss"
```

will load a theme located under the `http://myawesomeapp.com/theme/dark.scss` remote host.

For a full list of SASS variables that can be modified check the source.
