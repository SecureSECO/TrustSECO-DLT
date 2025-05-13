module.exports = {
	root: true,
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: __dirname,
	},
	extends: ['klayr-base/ts'],
	rules: {
		'@typescript-eslint/member-ordering': 'off',
	},
	overrides: [
		{
			files: ['test/**/*.ts'],
			rules: {
				'@typescript-eslint/member-ordering': 'off',
			},
		},
	],
};
