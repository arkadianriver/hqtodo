"""
See README.md for usage.
"""
import yaml, json

with open('../utils/serverApi.yml') as y, open('../utils/swaggerData.js', 'w', encoding='utf-8') as j:
  pydata = yaml.safe_load(y)
  jsondata = json.dumps(pydata)
  j.write(f'''const swaggerData = {jsondata};

export default swaggerData;''')
