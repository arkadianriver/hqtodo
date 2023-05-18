module.exports = {
	apps : [
		{
			name: "hqtodo",
			script: "./bin/www",
			watch: true,
			env: {
				"NODE_ENV": "production",
			}
		}
	]
}
