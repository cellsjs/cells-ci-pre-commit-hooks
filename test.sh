#/bin/bash

find . -iname .git |
while read filename
do
	hook="${filename}/hooks/pre-push"
	echo $hook;

	if [ -f $hook ] 
	then
		echo "ok"
	else
		echo "nak"
		exit 1		
		break
	fi
done 
exit 0
