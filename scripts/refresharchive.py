#!/usr/bin/python3

import datetime, re
from sys import argv


def repl(line):
  return re.sub(
    r'\d\d\d\d-\d\d-\d\d',
    lambda m: str(datetime.datetime.strptime(m.group(), "%Y-%m-%d") + datetime.timedelta(days=180))[:-9],
    line)


def main(fname):
  head = ''
  tail = ''
  with open(fname, 'r', encoding="utf8") as f:
    for line in f.readlines():
      if tail == '':
        if re.search(r'latest completed item', line):
          tail += repl(line)    
        else:
          head += repl(line)
      else:
        tail += repl(line)
  print(head + tail)
      

if __name__=='__main__':
  if len(argv) > 1:
    main(argv[1])
  else:
    print(f"usage: {argv[0]} {{todo_filename}}")
