/******************************************************************************
  Main (where all magic starts to happen)
*******************************************************************************/

//load the settings
var config = require('./settings'),
    logger = require('./server/logger'),
    cliArgs = require('command-line-args');

var cli = cliArgs([
  { name: 'help', type: Boolean, description: 'Print usage instructions' },

  { name: 'log-level', type: String, description: 'Set log level [info, debug, error]' },
  { name: 'config', type: String, description: 'Use custom config file' },

  { name: 'setup', type: Boolean, description: 'Setup database (should be called once)' },
  { name: 'migrate', type: Boolean, description: 'Migrate database changes' },
  { name: 'teardown', type: Boolean, description: 'Tear down database (WILL DESTROY ALL DATA)' },

  { name: 'list-apps', type: Boolean, description: 'List all apps' },
  { name: 'gc-app', type: String, description: 'Purge archived docs of <app_id>' },
  { name: 'reset-users', type: String, description: 'Delete all users of app <api_key>' },
  { name: 'list-users', type: String, description: 'List all users of app <api_key>' },

  { name: 'add-app', type: String, description: 'Register app <app_id>' },
  { name: 'update-app', type: String, description: 'Update app <app_id>' },
  { name: 'name', type: String, description: 'App name <name>' },
  { name: 'description', type: String, description: 'App description <description>' },
  { name: 'url', type: String, description: 'Website url <url>' },
  { name: 'auth-url', type: String, description: 'Authentication url <url>' },
  { name: 'fullpage-url', type: String, description: 'Full page url <url>' },
  { name: 'pushstate', type: String, description: 'Pushstate on fullpage [true|false]' },
  { name: 'theme', type: String, description: 'Custom theme <string>' },
  { name: 'notifications-email', type: String, description: 'Application notifications email <string>' },
  { name: 'contact-email', type: String, description: 'Application contact email <string>' },
  { name: 'delete-app', type: String, description: 'Delete app <app_id>' },

  { name: 'create-api-key', type: String, description: 'Create API key <app_id>' },
  { name: 'using', type: String, description: 'Combined with --create-api-key to explicitely define the api key' },
  { name: 'list-api-keys', type: String, description: 'List API keys <app_id>' },
  { name: 'delete-api-key', type: String, description: 'Delete API key <api_key>' },

  { name: 'set-app-property', type: String, description: 'Set app property <app_id>' },
  { name: 'get-app-property', type: String, description: 'Get app property <app_id>' },
  { name: 'property', type: String, description: 'Property name' },
  { name: 'value', type: String, description: 'Value name' },

]);
//parse command line values
var options = cli.parse(), cli_cmd;

if (options.help) {
  console.log(cli.getUsage({
    header: 'Fruum command line arguments',
    footer: ''
  }));
}
else {
  if (options.setup) {
    cli_cmd = { action: 'setup' };
  }
  else if (options.migrate) {
    cli_cmd = { action: 'migrate' };
  }
  else if (options.teardown) {
    cli_cmd = { action: 'teardown' };
  }
  else if (options['set-app-property']) {
    cli_cmd = {
      action: 'set_app_property',
      params: {
        app_id: options['set-app-property'],
        property: options['property'],
        value: options['value']
      }
    }
  }
  else if (options['get-app-property']) {
    cli_cmd = {
      action: 'get_app_property',
      params: {
        app_id: options['get-app-property'],
        property: options['property']
      }
    }
  }
  else if (options['create-api-key']) {
    cli_cmd = {
      action: 'create_api_key',
      params: {
        app_id: options['create-api-key'],
        using: options['using']
      }
    }
  }
  else if (options['list-api-keys']) {
    cli_cmd = {
      action: 'list_api_keys',
      params: {
        app_id: options['list-api-keys']
      }
    }
  }
  else if (options['delete-api-key']) {
    cli_cmd = {
      action: 'delete_api_key',
      params: {
        api_key: options['delete-api-key']
      }
    }
  }
  else if (options['add-app']) {
    cli_cmd = {
      action: 'add_app',
      params: {
        app_id: options['add-app'],
        name: options['name'],
        description: options['description'],
        url: options['url'],
        auth_url: options['auth-url'],
        fullpage_url: options['fullpage-url'],
        pushstate: options['pushstate'],
        notifications_email: options['notifications-email'],
        contact_email: options['contact-email'],
        theme: options['theme']
      }
    }
  }
  else if (options['update-app']) {
    cli_cmd = {
      action: 'update_app',
      params: {
        app_id: options['update-app'],
        name: options['name'],
        description: options['description'],
        url: options['url'],
        auth_url: options['auth-url'],
        fullpage_url: options['fullpage-url'],
        pushstate: options['pushstate'],
        notifications_email: options['notifications-email'],
        contact_email: options['contact-email'],
        theme: options['theme']
      }
    }
  }
  else if (options['delete-app']) {
    cli_cmd = {
      action: 'delete_app',
      params: {
        app_id: options['delete-app']
      }
    }
  }
  else if (options['list-apps']) {
    cli_cmd = { action: 'list_apps' };
  }
  else if (options['gc-app']) {
    cli_cmd = {
      action: 'gc_app',
      params: {
        app_id: options['gc-app']
      }
    }
  }
  else if (options['reset-users']) {
    cli_cmd = {
      action: 'reset_users',
      params: {
        app_id: options['reset-users']
      }
    }
  }
  else if (options['list-users']) {
    cli_cmd = {
      action: 'list_users',
      params: {
        app_id: options['list-users']
      }
    }
  }
  //set log level
  if (options['log-level']) {
    logger.level(options['log-level']);
  }
  //run startup script if present
  var conf = config(options);
  if (conf.scripts && conf.scripts.init) {
    logger.system('Running init script: ' + conf.scripts.init);
    require(conf.scripts.init);
  }
  //run the server
  var server = new require('./server/main')(conf, cli_cmd);
}
