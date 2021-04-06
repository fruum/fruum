# Generating API keys

To use the API you must generate API keys for your forum. Assuming that your forum is being register as myforum, execute the following command to generate an api key:

```
npm start -- --create-api-key myforum
```

This will return an API key, e.g. ABCD

API requests are HTTP REST calls that are made to the hosting server by using the URL pattern:

```
[https|http]://<host>/api/v1/<command>
```

The API is 100% JSON based, meaning that the body part of the request is a JSON object and the response is a JSON object as well.

To delete or list the available API keys of a forum see the management commands documentation.

# Authentication

Authentication is performed using HTTP Basic Authentication, with the following credentials:

- Username: Forum name, e.g. "myforum"
- Password: API key

For example:

```
curl --user 'myforum:ABCDEF' http://localhost:3000/api/v1/docs/home
```

or in the browser

```
https://myform:ABCDEF@localhost:3000/api/v1/docs/home
```

# Document API

With the document api you can manage categories, articles, threads, channels, chat messages and thread posts or article comments.

Each and everyone of the above is a document in the database and is treated using the same structure with optional fields, depending on the case.

## Document structure

```
{
    //document id
    id: '',

    //document parent id
    parent: '',

    //document type: category, thread, article, blog, bookmark, post, channel
    type: '',

    //creation date in unix timestamp
    created: 0,

    //last update date in unix timestamp
    updated: 0,

    //category initials
    initials: '',

    //header e.g. category or thread or article title
    header: '',

    //body e.g. description or post message
    body: '',

    //if thread is sticky
    sticky: false,

    //permissions
    locked: false,
    visible: true,
    inappropriate: false,
    //0: everyone, 1: logged-in, 2: admins
    permission: 0,
    //0: discussion, 1: helpdesk, 2: blog, 3: chat, 4: categories
    usage: 0,

    //denormalized author details
    user_id: '',
    user_username: '',
    user_displayname: '',
    user_avatar: '',

    //reactions (array of usernames)
    react_up: [],
    react_down: [],

    //category/article order
    order: 0,

    //if document is marked for deletion
    archived: false,
    //archived date unix timestamp
    archived_ts: 0
}
```

## Get a document (select)

GET: `/api/v1/docs/<id>`

Example:

```
curl --user 'myforum:ABCDEF' -X GET -H "Content-Type: application/json" 'http://localhost:3000/api/v1/docs/home'
```

## Insert a document (insert)

POST: `/api/v1/docs`

Example:

```
curl --user 'myforum:ABCDEF' -X POST -H "Content-Type: application/json" -d '{
    "parent": "bugs",
    "type": "thread",
    "header": "Fruum crashes my servers",
    "body": "Hello, please fix this",
    "user_id": "5",
    "user_username": "bob",
    "user_displayname": "Bob",
    "created": 1433463835232,
    "updated": 1433463835232
}' 'http://localhost:3000/api/v1/docs/'
```

## Update an existing document (update)

PUT: `/api/v1/docs/<id>`

Example:

```
curl --user 'myforum:ABCDEF' -X PUT -H "Content-Type: application/json" -d '{
    "body": "Hello, please fix that",
}' 'http://localhost:3000/api/v1/docs/hello-fix-this'
```

## Delete a document (delete)

DELETE: `/api/v1/docs/<id>`

Example:

```
curl --user 'myforum:ABCDEF' -X DELETE -H "Content-Type: application/json" 'http://localhost:3000/api/v1/docs/my-category'
```

# User API

Use the User API to manage your users. Get info about their profile and their activity.

## User structure

```
{
  //user id
  id: '',

  //is administrator?
  admin: false,

  //is blocked?
  blocked: false,

  //user details
  username: '',
  displayname: '',
  email: '',

  //link to avatar
  avatar: '',

  //creation date in unix timestamp
  created: 0,

  //last login date in unix timestamp
  last_login: 0,

  //last logout date in unix timestamp
  last_logout: 0,

  //karma
  karma: 0
}
```

## Get user profile

GET: `/api/v1/users/<id>`

Example:

```
curl --user 'myforum:ABCDEF' -X GET
     -H "Content-Type: application/json"
     'http://localhost:3000/api/v1/users/56'
```

Returns:

```
{
  id: <id>,
  admin: <boolean>,
  blocked: <boolean>,
  username: <string>,
  displayname: <string>,
  email: <string>,
  avatar: <string>,
  created: <date>,
  last_login: <date>,
  last_logout: <date>,
  karma: <number>
}
```

## Add user

POST: `/api/v1/users`

Example:

```
curl --user 'myforum:ABCDEF' -X POST -H "Content-Type: application/json" -d '{
    "id": 101,
    "username": "foo"
}' 'http://localhost:3000/api/v1/users'
```

Returns the user model (similar to GET)

## Update user

PUT: `/api/v1/users/<id>`

Returns the user model (similar to GET)

## Get user topics

GET: `/api/v1/users/<id>/topics[?admin]`

Returns:

```
[
  { id:.. , type: ... },
  { id:.. , type: ... },
  { id:.. , type: ... },
  ...
]
```

> By default only public topics are returned. To return all topics including administrator permissive ones, pass the `&admin` param to the request.

## Count user topics

GET: `/api/v1/users/<id>/topics?count[&admin]`

Returns the number of user created topics.

> By default only public topics are counted. To count all topics including administrator permissive ones, pass the &admin param to the request.

## Get user replies

GET: `/api/v1/users/<id>/replies[?admin]`

Returns:

```
[
  { id:.. , type: ... },
  { id:.. , type: ... },
  { id:.. , type: ... },
  ...
]
```

> By default only public replies are returned. To return all replies including administrator permissive ones, pass the &admin param to the request.

## Count user replies

GET: `/api/v1/users/<id>/replies?count[&admin]`

Returns the number of user replies.

> By default only public replies are counted. To count all replies including administrator permissive ones, pass the &admin param to the request.

# Presence API

## Count online users

GET: `/api/v1/presence/overview`

Example:

```
curl --user 'myforum:ABCDEF' -X GET
     -H "Content-Type: application/json"
     'http://localhost:3000/api/v1/presence/overview'
```

Returns:

```
{
  total: <X + Y>,
  anonymous: <X>,
  authenticated: <Y>
}
```

## Count online users under document

GET: `/api/v1/presence/overview/<id>`

Returns:

```
{
  total: <X + Y>,
  anonymous: <X>,
  authenticated: <Y>
}
```

> Passing the `?children` to the URL will also take into account users visiting document and any of its children.

## Count all users on per document breakdown

GET: `/api/v1/presence/docs`

Returns:

```
{
  docs: {
    "home": {
      total: X,
      anonymous: Y,
      authenticated: Z
    },
    "bugs": { ... },
    ...
  },
  paths: {
    "home": { ... },
    "home/bugs": { .. },
    "home/bugs/found-a-nasty-bug": { .. }
  }
}
```

Documents that have no visitors are NOT returned by the API.

## Get details of all online users

GET: `/api/v1/presence/users`

Returns:

```
[
  { id: "", username: "", displayname: "", ... },
  { id: "", username: "", displayname: "", ... }
  ...
]
```

## Get details of all online users viewing document

GET: `/api/v1/presence/users/<id>`

Returns:

```
[
  { id: "", username: "", displayname: "", ... },
  { id: "", username: "", displayname: "", ... }
  ...
]
```

> Passing the `?children` to the URL will also take into account users visiting document and any of its children.

# Errors

The API returns standard HTTP status codes:

| Code | Description |
| ---- | ----------- |
| 200	 | Success     |
| 400	 | Bad request (e.g. invalid payload format) |
| 401	 | Unauthorized (e.g. wrong forum name or api key) |
| 404	 | Not found (e.g. invalid document id) |
| 500	 | Internal server error |
