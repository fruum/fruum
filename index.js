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
  { name: 'delete-app', type: String, description: 'Delete app <app_id>' },
  { name: 'create-api-key', type: String, description: 'Create API key <app_id>' },
  { name: 'list-api-keys', type: String, description: 'List API keys <app_id>' },
  { name: 'delete-api-key', type: String, description: 'List API keys <api_key>' },
  { name: 'gc-app', type: String, description: 'Purge archived docs of <app_id>' }
]);
//parse command line values
var options = cli.parse();

if (options.help) {
  console.log(cli.getUsage({
    header: 'Fruum command line arguments',
    footer: ''
  }));
}
else {
  if (options.setup) {
    config.setup = true;
  }
  else if (options.migrate) {
    config.migrate = true;
  }
  else if (options.teardown) {
    config.teardown = true;
  }
  else if (options['create-api-key']) {
    config.app = {
      action: 'create_api_key',
      app_id: options['create-api-key']
    }
  }
  else if (options['list-api-keys']) {
    config.app = {
      action: 'list_api_keys',
      app_id: options['list-api-keys']
    }
  }
  else if (options['delete-api-key']) {
    config.app = {
      action: 'delete_api_key',
      api_key: options['delete-api-key']
    }
  }
  else if (options['add-app']) {
    config.app = {
      action: 'add',
      app_id: options['add-app'],
      name: options.name,
      description: options.description,
      url: options.url,
      auth_url: options['auth-url'],
      fullpage_url: options['fullpage-url'],
      theme: options.theme,
      tier: options.tier
    }
  }
  else if (options['update-app']) {
    config.app = {
      action: 'update',
      app_id: options['update-app'],
      name: options.name,
      description: options.description,
      url: options.url,
      auth_url: options['auth-url'],
      fullpage_url: options['fullpage-url'],
      theme: options.theme,
      tier: options.tier
    }
  }
  else if (options['delete-app']) {
    config.app = {
      action: 'delete',
      app_id: options['delete-app']
    }
  }
  else if (options['list-apps']) {
    config.app = {
      action: 'list'
    }
  }
  else if (options['gc-app']) {
    config.app = {
      action: 'gc',
      app_id: options['gc-app']
    }
  }
  //run the server
  var server = new FruumServer(config);
}
