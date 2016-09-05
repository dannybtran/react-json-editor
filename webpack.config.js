module.exports = {
  module: {
    loaders: [
      {
        test : /\.jsx?/,
        loader : 'babel?cacheDirectory=true'
      }
    ]
  },
  entry: './src/sample.js',
  output: {
    filename: 'bundle.js',
    path: 'example'
  }
};
