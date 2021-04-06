# System requirements

The minimum system requirement for running fruum is a node.js environment.

Your node.js version must be greater than 8.x.x and npm greater than 5.x.x.

Fruum is using 3 sub modules in order operate:

- Database module
- Cache module
- Email module

Those modules can be replaced by drivers in order to glue with any backend system, such as sql or no-sql databases, email services, memcached or redis storage etc.

> Fruum comes with memory cache and elasticsearch database backends out of the box, so to get up and running you need to install node.js and elasticsearch.

# Installation instructions

Make sure you are running at least node.js 8.x.x and npm 5.x.x. Verify by doing the following in the console:

```
npm --version
5.5.1

node --version
v8.9.1
```

Grab the latest source code

```
git clone https://github.com/fruum/fruum.git
```

Install node.js dependencies

```
cd fruum
npm install
```

Edit `config.json` and map elasticsearch host to the proper value, or leave as is if running elasticsearch locally.

Setup the database

```
npm start -- --setup
```

Register an application xxxxxxxxx

```
npm start -- --add-app myforum
```

Start the server

```
npm start
```

Check for options by executing the command

```
npm start -- --help
```

# Website integration

## Basic integration

To install fruum to a website add the following snippet inside the `<head>` tag.

```
<script type="text/javascript">
window.fruumSettings = {
  // ... options here...
}
</script>
<script type="text/javascript"
  src="<host>/go/<app_id>"
></script>
```

Where `host` is the domain of the fruum server and `app_id` is the application name, e.g. if you where running a local instance on port 3000 and had an application named by myforum, the setup would be:

```
<script type="text/javascript"
  src="http://localhost:3000/go/myforum"
></script>
```

## Displaying fruum drawer

By default, fruum is hidden. To show it (in the embeddable form) you must do at least one of the following.

## HTML mode

Add HTML elements, e.g. buttons or anchors that link to fruum:

- For anchors set the `href` attribute to `#fruum:<id>`
- For any element type set the `fruum-link` attribute to `<id>`

`<id>` is either `*` to open the last visited fruum section or a specific section id, e.g. `home`.

For example:

```
<div>
  <a href="#fruum:home">Fruum home</a>
  <span fruum-link="home">Fruum home</span>
  <span fruum-link="docs">Fruum docs</a>
  <a href="#fruum:*">Restore fruum</a>
</div>
```

## Javascript mode

At any point after loader.js has been loaded, execute the

```
Fruum.launch();
```

command.

# Single Sign On authentication (SSO)

## Overview

Fruum is designed to easily hook to a website's existing user base using the following flow:

```
🌐 Website creates a user payload
⬇
🌐 Fruum sends the payload to an auth server using POST
⬇
💻 The auth server returns an authenticated payload in JSON format
⬇
💻 Fruum server registers the user
⬇
🌐 User permissions are sent back to browser
```

## Registering an authentication server

Before starting you must register a an authentication URL to the application's (hosting) server by using the command:

```
npm start -- --update-app <id> --auth-url <url>
```

For example:

```
npm start -- --update-app myforum --auth-url "https://awesomeapp.com/fruum/auth"
```

Every time a user logs in, this URL will be hit using a POST request with a body set to a JSON payload object. The url must respond with a JSON object such as:

```
{
        id: "12034"
        anonymous: false,
        admin: false,
        username: "mrcockpit",
        displayname: "Mr Cockpit",
        email: "mrcockpit@awesomeapp.com",
        avatar: "https://awesomeapp.com/avatars/mrcockpit/23.png"
}
```

Note that displayname, email, avatar fields are optional.

Returning an email, will enable email notifications for watched elements for the user.

## Setting the user payload

On the website page, you must define the user payload before the fruum integration code:

```
<script type="text/javascript">
  window.fruumSettings = {
     user: {
        id: <user id>,
        hash: <hash key>
     }
  }
</script>
```

Alternatively, if the authentication data is available at a later state, e.g. by javascript authentication, the process can be triggered using the following javascript code:

```
window.FruumData = window.FruumData || [];
window.FruumData.push({
  user: {
    id: <userid>,
    ....
  }
});
```

## Examples

### PHP

Client:

```
<script type="text/javascript">
window.fruumSettings = {
  user: {
    id: "<?php echo $userid; ?>",
    hash: "<?php echo md5($email); ?>"
  }
}
</script>
```

Server:

```
<?php
  $response = array();
  $payload = json_decode(file_get_contents('php://input'), true);
  if (isset($payload['id']) && isset($payload['hash'])) {
    $userid = mysql_real_escape_string($payload['id']);
    $hash = $payload['hash'];
    $results = mysql_query("SELECT username, fullname, email FROM accounts WHERE userid='$userid'");
    if ($row = mysql_fetch_assoc($results)) {
      if (!strcmp(md5('$row['email']), $payload['hash'])){
        $response['id'] = strval($userid);
        $response['anonymous'] = false;
        $response['admin'] = false;
        $response['email'] = $row['email'];
        $response['username'] = $row['username'];
        $response['displayname'] = $row['fullname'];
      }
    }
  }
  header('Content-Type: application/json');
  echo json_encode($response);
?>
```

### node.js

Client:

```
<script type="text/javascript">
window.fruumSettings = {
  user: {
    id: "<%= userid %>",
    hash: "<%= hash %>"
  }
}
</script>
```

Server:

```
var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    http = require('http').Server(app);

function get_user(id, hash) {
  //validate input
  return {
    id: id,
    admin: false,
    email: 'foo@example.com',
    username: 'foo'
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/auth', function(req, res) {
  var payload = req.body;
  if (payload.id && payload.hash) {
    var user = get_user(payload.id, payload.hash);
    if (user) {
      res.json({
        id: user.id,
        anonymous: false,
        admin: user.admin,
        username: user.username,
        displayname: user.username,
        email: user.email,
        avatar: user.avatar || ''
      });
      return;
    }
  }
  //continue as anonymous
  res.json({});
});
```

# Email notifications

When users watch a topic or a stream in general they get notifications when someone replies.

Users watch streams when they manually hit the watch button on the header or when they create or reply to topics.

To setup email notifications for your forum you must do the following:

First, make sure you have successfully setup an email backend. Currently there is support for Mandrill, Mailgun or SMTP emails, so select the appropriate backend and update config.json file (see below).

Then setup a sender email for your notifications by executing the command:

```
npm start -- --update-app <appid> --notifications-email <email>
```

For example:

```
npm start -- --update-app myforum --notifications-email "notifications@myawesomeapp.com"
```

## Using mandrill

First of all make sure you have obtained an API key from Mandrill website.

Edit `config.json` and set the email engine to:

```
{
  ...
  "email_engine": "mandrill",
  ...
}
```

On the same file, there is a mandrill section. Set the API key and you are good to go.

```
{
  ...
  "mandrill": {
    "api_key": "abcdef"
  },
  ...
}
```

## Using mailgun

First of all make sure you have correctly setup a Mailgun account at mailgun.com and you have properly registered your domain.

Edit `config.json` and set the email engine to:

```
{
  ...
  "email_engine": "mailgun",
  ...
}
```

On the same file, there is a `mailgun` section. Set the API key and domain as provided by Mailgun and you are good to go.

```
{
  ...
  "mailgun": {
    "api_key": "key-abcdef",
    "domain": "example.com"
  },
  ...
}
```

## Using generic SMTP

This is an email driver that handles generic SMTP servers. To enable it, edit `config.json` and set the email engine to:

```
{
  ...
  "email_engine": "smtp",
  ...
}
```

On the same file, there is a `smtp` section. Provide the section with the SMTP credentials.

```
{
  ...
  "smtp": {
    "host": "smtp.example.com",
    "port": 25,
    "secure": true,
    "auth": {
      "user": "foo",
      "pass": "bar"
    }
  },
  ...
}
```

The SMTP driver is build upon Nodemailer so you may also use this documentation for more options to setup the service.

For example:

```
{
  ...
  "smtp": {
    "service": "hotmail",
    "auth": {
      "user": "foo@hotmail.com",
      "pass": "bar"
    }
  },
  ...
}
```

# Setting up full page forums

Basic setup
By default fruum is loaded in the embedded mode. However there are cases where developers want a dedicated forum page, where fruum is always visible by default in par with the embedded mode.

This has the following benefits:

- Allow the creation of permalinks to share to other users
- Allow spiders to index your forum

The first step is to declare the URL of the full page in fruum server by invoking the following command:

```
npm start -- --update-app <app> --fullpage-url <url>
```

For example:

```
npm start -- --update-app myforum --fullpage-url "https://myawesomeapp.com/forum"
```

Then, you must create a placeholder div in your forum page that will host the fruum content, e.g.

```
<div id="forum-container"></div>
```

Fruum will fit inside that area and it is up to the developer to maintain the size of the container.

Final step is to tell fruum the name of the container object to use by modifying the
fruumSettings object, e.g.

```
window.fruumSettings = {
  ...
  container: '#forum-container'
  ...
}
```

## Enabling pushState

Enabling pushState on a full page forum is very important for SEO to work.

The first step is to modify your server URL parser to serve all paths under your base forum path on the same page, e.g.

```
https://myawesomeapp.com/forum
https://myawesomeapp.com/forum/foo
https://myawesomeapp.com/forum/foo/bar
```

should all serve the same page as with `https://myawesomeapp.com/forum`.

You can do that with apache mod_rewrite or with a django URL pattern for example.

Next step is to tell fruum that your full page forum makes use of pushState by executing the following command:

```
npm start -- --update-app <app> --pushstate true
```

# Search Engine Optimization (SEO)

Modern search engines are able to execute Javascript and index your pages. However for fruum to be indexed by spiders you should provide a page where your fruum forum appears in full page mode in par with the embedded one.

The reason for using the full page mode, is that you must provide to the crawler full url paths for each fruum section, e.g.

```
https://fruum.github.io/#v/how-it-works
```

for the section you are reading.

Google and Microsoft propose the use of pushState Javascript API for indexing.
Fruum supports the pushState api, however the hosting website must make a few modifications for this to work.

To enable pushState make you sure you setup your full page forum with the pushState instructions on the guide.

# Management commands

Use fruum command line tool to manage forum apps.

To invoke command line tools use either

```
npm start -- <arguments>
```

or

```
node index.js <arguments>
```

Here is a list of commands:

```
npm start -- --help
```

Displays a help message.

```
npm start --  --add-app <myforum>
```

Registers a new forum.

```
npm start --  --list-apps
```

Lists all registered forums.

```
npm start --  --update-app <myforum>
  [--name <name>]   [--description <description>]
  [--url <host url>] [--auth-url <auth_webhook>]
  [--fullpage-url <fullpage_url>] [--theme <theme>]
  [--pushstate <true|false>]
  [--notifications-email <email>]
  [--contact-email <email>]
```

Update settings. You can also use the parameters when adding a new forum.

```
npm start -- --delete-app <myforum>
```

Remove a forum.

```
npm start -- --create-api-key <myforum>
```

Generate a new api key.

```
npm start -- --list-api-keys <myforum>
```

List all forum api keys.

```
npm start -- --delete-api-key <key>
```

Remove an api key.

```
npm start -- --reset-users <myforum>
```

Removes all registered users from forum.

```
npm start -- --gc-app <myforum>
```

Force purge archived documents.
