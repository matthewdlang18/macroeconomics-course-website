#!/bin/bash

# Run Investment Odyssey class game tests

echo "Opening test page in browser..."

# Determine the OS and open the browser accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open test-class-game.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open test-class-game.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  start test-class-game.html
else
  echo "Unsupported OS. Please open test-class-game.html manually."
fi

echo "Test page opened. Please run the tests in the browser."
