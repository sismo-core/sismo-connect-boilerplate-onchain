#!/bin/bash

# Define the URL
url="http://localhost:3000"

# Define the ASCII block
ascii_block="
#############################################
#      Access your local application        #
#                                           #
#      ->  ${url}  <-        #
#                                           #
#  Press CTRL+C to stop the application     #
#############################################
"

# Print the ASCII block
echo "$ascii_block"