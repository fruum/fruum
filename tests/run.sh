#!/bin/bash

echo ">>> CREATING TEST DATABASE"
node index.js --log-level error --add-app test
echo ">>> CREATING API KEY"
node index.js --log-level error --create-api-key test --using testkey
echo ">>> RUNNING SERVER"
node index.js test-fruum-server-daemon --log-level error &
sleep 3
pid=$(ps -ef | grep "test-fruum-server-daemon" | grep -v "grep" | awk '{print $2}')
echo "Server running on pid: $pid"
echo ">>> RUNNING TESTS"
./node_modules/.bin/jasmine-node tests
echo ">>> KILLING SERVER"
kill -9 $pid
sleep 1
echo ">>> DELETING TEST DATABASE"
node index.js --log-level error --delete-app test
echo ">>> DONE"
