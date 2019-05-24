# foldClientLoader

This is a webpack loader that pairs up with foldClient Extension to build only included region tags

### To Use:

Add a `web-loaders` folder to your projects root directory, then include the `client-capture` within this directory.
After which you will be able to use it within wepback:

```
{
  loader: "client-capture",
  options: {
    client: argv.CLIENT
  }
}
```

This needs to be the first loader used on all js/jsx files. i.e. last in the array

e.g.

```
{
  test: /\.jsx?$/,
  exclude: /(node_modules|bower_components)/,
  include: path.resolve(__dirname, 'src'),
  loaders: [
    {
      loader: 'babel-loader',
      options: {
        cacheDirectory: true,
        presets: ['@babel/preset-react', ['@babel/preset-env', { useBuiltIns: 'usage', modules: false }]],
        plugins: [
          'react-html-attrs',
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-transform-react-jsx-source'
        ],
      }
    },
    {
      loader: "client-capture",
      options: {
        client: argv.CLIENT
      }
    }
  ]
}
```