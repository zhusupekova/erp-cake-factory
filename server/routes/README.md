This folder is reserved for route modules. Current quick scaffold puts routes inline in `server/index.js` to stay minimal.

If you extract routes into separate files, register them in `server/index.js` like:

```js
const products = require('./routes/products');
app.use('/api/products', products);
```
