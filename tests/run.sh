#!/bin/bash
loglevel="none"

echo ">>> CREATING TEST DATABASE"
node index.js --log-level $loglevel --add-app test --config "./tests/config.test.json"
echo ">>> CREATING API KEY"
node index.js --log-level $loglevel --create-api-key test --using testkey --config "./tests/config.test.json"
echo ">>> RUNNING SERVER"
node index.js test-fruum-server-daemon --log-level $loglevel --config "./tests/config.test.json" &
sleep 3
pid=$(ps -ef | grep "test-fruum-server-daemon" | grep -v "grep" | awk '{print $2}')
echo "Server running on pid: $pid"
echo ">>> RUNNING TESTS"
./node_modules/.bin/jasmine-node tests --verbose --captureExceptions
echo ">>> KILLING SERVER"
kill -9 $pid
sleep 1
echo ">>> DELETING TEST DATABASE"
node index.js --log-level $loglevel --delete-app test --config "./tests/config.test.json"
echo ">>> DONE"
