# M&O Store — Client (Storefront)

This is the React-based storefront for the M&O Store demo. It provides the customer-facing shopping experience (product listing, cart, checkout) and integrates with the server API for auth, orders and promotions.

Quick start

1. Install dependencies and start the dev server:

```bash
cd "c:/Users/moham/Desktop/MO Store/client"
npm install
npm start
```

2. The dev server runs on `http://localhost:3000` by default. The project has a `proxy` configured in `package.json` pointing to `http://localhost:3001` (server). During development the client will forward unknown requests to the API.

Build

```bash
npm run build
```

The static build output will be in `build/`. You can serve the build folder with any static file host or integrate it into the `server/public/` folder for production.

Environment and API

- The client expects the API to be available under the same origin when built for production, or proxied in development. If your API runs on a different origin in development, update the `proxy` field in `package.json` or configure axios base URL in `src/api.js`.
- The server uses cookie-based auth and a CSRF double-submit pattern. The client must:
  1. Send credentials with API requests (the provided `api` helper sets `withCredentials`).
  2. Call `GET /api/auth/csrf` or read the `csrf` cookie before any mutating request, and include `X-CSRF-Token` header matching that cookie for POST/PUT/DELETE requests.

Features

- Product listing and details
- Cart with quantity updates and persisted items
- Coupon entry on the Cart page: calls `/api/promotions/validate?code=CODE&total=...` to preview discount and then sends `couponCode` when creating an order
- Checkout creates an order via `POST /api/orders` (server re-validates coupons server-side)

Admin integration

- The admin SPA (separate app under `admin/`) uses the same API. Coupons created/edited in the Admin Promotions page are available immediately to the storefront via the `/api/promotions/validate` endpoint.

Testing and debugging

- Open browser devtools Network tab to verify cookies and CSRF header are exchanged.
- If you see `403 Missing CSRF cookie` ensure the client called `/api/auth/csrf` and that cookies are allowed (CORS `credentials: true`).

Deployment notes

- When deploying the client and server to different origins, ensure the server `CLIENT_ORIGIN` includes the client's origin and that cookies are configured with `SameSite` and `secure` flags appropriate for your deployment.
- For production you can host the built client in the server `public/` folder, or on a static host (Netlify, Vercel, S3+CloudFront) and configure CORS accordingly.

Docker (optional)

There is a `Dockerfile` and `nginx.conf` included which will build the app and serve it with nginx. Building the Docker image will run `npm run build` inside the image — you asked not to build locally, so this is an easy way to produce a production image without building files locally.

Example build and run:

```bash
cd "c:/Users/moham/Desktop/MO Store/client"
docker build -t mo-store-client --build-arg REACT_APP_API_URL="https://api.yourdomain.com" .
docker run -p 8080:80 mo-store-client
```

Open `http://localhost:8080` to view the site.

Useful commands

- Start dev server: `npm start`
- Build for production: `npm run build`
- Run tests: `npm test` (uses react-scripts test runner)

If you want, I can:
- Add a small `README_ADMIN.md` showing how the storefront and admin interact for coupon flows.
- Add axios base URL configuration for explicit API origins (instead of relying on `proxy`).
- Create a minimal e2e test script to validate the coupon flow (validate then checkout).

Last updated: 2025-11-15# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
