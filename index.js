/******************************************************************************
  Main (where all magic starts to happen)
*******************************************************************************/

//load the settings
var config = require('./settings');
var FruumServer = require('./server/main.js');
var cliArgs = require('command-line-args');
var cli = cliArgs([
  { name: 'help', type: Boolean, description: 'Print usage instructions' },
  { name: 'setup', type: Boolean, description: 'Setup database (should be called once)' },
  { name: 'migrate', type: Boolean, description: 'Migrate database changes' },
  { name: 'teardown', type: Boolean, description: 'Tear down database (WILL DESTROY ALL DATA)' },
  { name: 'list-apps', type: Boolean, description: 'List all apps' },
  { name: 'add-app', type: String, description: 'Register app <app_id>' },
  { name: 'update-app', type: String, description: 'Update app <app_id>' },
  { name: 'name', type: String, description: 'App name <name>' },
  { name: 'description', type: String, description: 'App description <description>' },
  { name: 'url', type: String, description: 'Website url <url>' },
  { name: 'auth-url', type: String, description: 'Authentication url <url>' },
  { name: 'fullpage-url', type: String, description: 'Full page url <url>' },
  { name: 'theme', type: String, description: 'Custom theme <string>' },
  { name: 'tier', type: String, description: 'Application tier <string>' },
  { name: 'notifications-email', type: String, description: 'Application notifications email <string>' },
  { name: 'contact-email', type: String, description: 'Application contact email <string>' },
  { name: 'delete-app', type: String, description: 'Delete app <app_id>' },
  { name: 'create-api-key', type: String, description: 'Create API key <app_id>' },
  { name: 'list-api-keys', type: String, description: 'List API keys <app_id>' },
  { name: 'delete-api-key', type: String, description: 'List API keys <api_key>' },
  { name: 'gc-app', type: String, description: 'Purge archived docs of <app_id>' }
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
  else if (options['create-api-key']) {
    cli_cmd = {
      action: 'create_api_key',
      params: {
        app_id: options['create-api-key']
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
        name: options.name,
        description: options.description,
        url: options.url,
        auth_url: options['auth-url'],
        fullpage_url: options['fullpage-url'],
        notifications_email: options['notifications-email'],
        contact_email: options['contact-email'],
        theme: options.theme,
        tier: options.tier
      }
    }
  }
  else if (options['update-app']) {
    cli_cmd = {
      action: 'update_app',
      params: {
        app_id: options['update-app'],
        name: options.name,
        description: options.description,
        url: options.url,
        auth_url: options['auth-url'],
        fullpage_url: options['fullpage-url'],
        notifications_email: options['notifications-email'],
        contact_email: options['contact-email'],
        theme: options.theme,
        tier: options.tier
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
  //run the server
  var server = new FruumServer(config, cli_cmd);
}
