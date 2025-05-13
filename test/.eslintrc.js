module.exports = {
	extends: ['klayr-base/ts-jest'],
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: __dirname,
	},
	"rules": {
	    "@typescript-eslint/member-ordering": "off"
	}
};
