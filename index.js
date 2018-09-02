/******************************************************************************
  Main (where all magic starts to happen)
*******************************************************************************/

// load the settings
var config = require('./settings'),
    logger = require('./server/logger'),
    commandLineArgs = require('command-line-args'),
    commandLineUsage = require('command-line-usage');

var cli_definitions = [
  {
    name: 'help',
    type: Boolean,
    description: 'Print usage instructions',
  },
  {
    name: 'log-level',
    typeLabel: '[info|debug|error]',
    type: String,
    description: 'Set log level',
  },
  {
    name: 'config',
    typeLabel: '<path to config.json>',
    type: String,
    description: 'Use custom config file',
  },

  {
    name: 'setup',
    type: Boolean,
    description: 'Setup database (should be called once)',
  },
  {
    name: 'migrate',
    type: Boolean,
    description: 'Migrate database changes',
  },
  {
    name: 'teardown',
    type: Boolean,
    description: 'Tear down database (WILL DESTROY ALL DATA)',
  },

  {
    name: 'list-apps',
    type: Boolean,
    description: 'List all apps',
  },
  {
    name: 'gc-app',
    typeLabel: '<app_id>',
    type: String,
    description: 'Purge archived docs',
  },
  {
    name: 'reset-users',
    typeLabel: '<app_id>',
    type: String,
    description: 'Delete all app users',
  },
  {
    name: 'list-users',
    typeLabel: '<app_id>',
    type: String,
    description: 'List all app users',
  },
  {
    name: 'search-users',
    typeLabel: '<app_id> --value <query>',
    type: String,
    description: 'Search for users in app',
  },
  {
    name: 'delete-user',
    typeLabel: '<app_id> --value <userid>',
    type: String,
    description: 'Delete user',
  },
  {
    name: 'add-app',
    typeLabel: '<app_id> [...params...]',
    type: String,
    description: 'Add new app',
  },
  {
    name: 'update-app',
    typeLabel: '<app_id> [...params...]',
    type: String,
    description: 'Update app',
  },
  {
    name: 'name',
    typeLabel: '<name>',
    type: String,
    description: 'App name for [...params...]',
  },
  {
    name: 'description',
    typeLabel: '<description>',
    type: String,
    description: 'App description for [...params...]',
  },
  {
    name: 'url',
    typeLabel: '<url>',
    type: String,
    description: 'Website url for [...params...]',
  },
  {
    name: 'auth-url',
    typeLabel: '<url>',
    type: String,
    description: 'Authentication url for [...params...]',
  },
  {
    name: 'fullpage-url',
    typeLabel: '<url>',
    type: String,
    description: 'Full page url for [...params...]',
  },
  {
    name: 'pushstate',
    typeLabel: '[true|false]',
    type: String,
    description: 'Pushstate on fullpage for [...params...]',
  },
  {
    name: 'theme',
    typeLabel: '<string>',
    type: String,
    description: 'Set theme for [...params...]',
  },
  {
    name: 'notifications-email',
    typeLabel: '<email>',
    type: String,
    description: 'Notifications email for [...params...]',
  },
  {
    name: 'contact-email',
    typeLabel: '<email>',
    type: String,
    description: 'Contact email <string> for [...params...]',
  },
  {
    name: 'delete-app',
    typeLabel: '<app_id>',
    type: String,
    description: 'Delete app',
  },

  {
    name: 'create-api-key',
    typeLabel: '<app_id> [--using <api_key>]',
    type: String,
    description: 'Create API key',
  },
  {
    name: 'using',
    typeLabel: '<api_key>',
    type: String,
    description: 'Optional param for create-api-key',
  },
  {
    name: 'list-api-keys',
    typeLabel: '<app_id>',
    type: String,
    description: 'List API keys',
  },
  {
    name: 'delete-api-key',
    typeLabel: '<api_key>',
    type: String,
    description: 'Delete API key',
  },

  {
    name: 'set-app-property',
    typeLabel: '<app_id> --property <key> --value <value>',
    type: String,
    description: 'Set app property',
  },
  {
    name: 'get-app-property',
    typeLabel: '<app_id> --property <key>',
    type: String,
    description: 'Get app property',
  },
  {
    name: 'property',
    typeLabel: '<key>',
    type: String,
    description: 'Property name',
  },
  {
    name: 'value',
    typeLabel: '<value>',
    type: String,
    description: 'Value name',
  }
];

var options = commandLineArgs(cli_definitions, { partial: true });
// parse command line values
var cli_cmd;

if (options.help) {
  console.log(commandLineUsage([
    {
      header: 'Fruum',
      content: 'Command line options',
    },
    {
      header: 'Options',
      optionList: cli_definitions,
    }
  ]));
} else {
  if (options.setup) {
    cli_cmd = { action: 'setup' };
  } else if (options.migrate) {
    cli_cmd = { action: 'migrate' };
  } else if (options.teardown) {
    cli_cmd = { action: 'teardown' };
  } else if (options['set-app-property']) {
    cli_cmd = {
      action: 'set_app_property',
      params: {
        app_id: options['set-app-property'],
        property: options['property'],
        value: options['value'],
      },
    };
  } else if (options['get-app-property']) {
    cli_cmd = {
      action: 'get_app_property',
      params: {
        app_id: options['get-app-property'],
        property: options['property'],
      },
    };
  } else if (options['create-api-key']) {
    cli_cmd = {
      action: 'create_api_key',
      params: {
        app_id: options['create-api-key'],
        using: options['using'],
      },
    };
  } else if (options['list-api-keys']) {
    cli_cmd = {
      action: 'list_api_keys',
      params: {
        app_id: options['list-api-keys'],
      },
    };
  } else if (options['delete-api-key']) {
    cli_cmd = {
      action: 'delete_api_key',
      params: {
        api_key: options['delete-api-key'],
      },
    };
  } else if (options['add-app']) {
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
        theme: options['theme'],
      },
    };
  } else if (options['update-app']) {
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
        theme: options['theme'],
      },
    };
  } else if (options['delete-app']) {
    cli_cmd = {
      action: 'delete_app',
      params: {
        app_id: options['delete-app'],
      },
    };
  } else if (options['list-apps']) {
    cli_cmd = { action: 'list_apps' };
  } else if (options['gc-app']) {
    cli_cmd = {
      action: 'gc_app',
      params: {
        app_id: options['gc-app'],
      },
    };
  } else if (options['reset-users']) {
    cli_cmd = {
      action: 'reset_users',
      params: {
        app_id: options['reset-users'],
      },
    };
  } else if (options['list-users']) {
    cli_cmd = {
      action: 'list_users',
      params: {
        app_id: options['list-users'],
      },
    };
  } else if (options['search-users']) {
    cli_cmd = {
      action: 'search_users',
      params: {
        app_id: options['search-users'],
        value: options['value'],
      },
    };
  } else if (options['delete-user']) {
    cli_cmd = {
      action: 'delete_user',
      params: {
        app_id: options['delete-user'],
        value: options['value'],
      },
    };
  }
  // set log level
  if (options['log-level']) {
    logger.level(options['log-level']);
  }
  // run startup script if present
  var conf = config(options);
  if (conf.scripts && conf.scripts.init) {
    logger.system('Running init script: ' + conf.scripts.init);
    require(conf.scripts.init);
  }
  // run the server
  var server = new require('./server/main')(conf, cli_cmd); // eslint-disable-line
}
