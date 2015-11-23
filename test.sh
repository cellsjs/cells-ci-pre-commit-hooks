#/bin/bash

find . -iname .git |
while read filename
do
	hook="${filename}/hooks/pre-commit"
	echo $hook;

	if [ -f $hook ] 
	then
		echo "ok"
	else
		echo "nak"
		break
	fi
done 
